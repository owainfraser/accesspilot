/**
 * Grant Expiry Worker
 *
 * This worker runs as a SEPARATE PROCESS from Next.js.
 * Start it with: npm run worker:grant-expiry
 *
 * It processes jobs from the "grant-expiry" BullMQ queue and:
 * 1. Revokes the access grant via Microsoft Graph API
 * 2. Updates the grant status in the database
 * 3. Updates the associated request status
 * 4. Writes an audit log entry
 * 5. Sends a notification email
 */

import { Worker, Job } from "bullmq";
import {
  createRedisConnection,
  QUEUE_NAMES,
  type GrantExpiryJobData,
  enqueueNotification,
} from "../queue";
import { writeAuditLog, AUDIT_ACTIONS } from "../audit";
import { revokeAccess, type ResourceType } from "../microsoft-graph";
import prisma from "../prisma";

async function processGrantExpiry(job: Job<GrantExpiryJobData>) {
  const { grantId, requestId, userId, organizationId, resourceType, resourceId } =
    job.data;

  console.log(`[grant-expiry] Processing expiry for grant ${grantId}`);

  // Fetch the grant and related data
  const grant = await prisma.accessGrant.findUnique({
    where: { id: grantId },
    include: {
      request: {
        include: {
          requester: true,
          policy: true,
        },
      },
    },
  });

  if (!grant) {
    console.warn(`[grant-expiry] Grant ${grantId} not found, skipping`);
    return;
  }

  if (grant.status !== "ACTIVE") {
    console.log(
      `[grant-expiry] Grant ${grantId} is already ${grant.status}, skipping`
    );
    return;
  }

  // Fetch org credentials for Microsoft Graph
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org || !org.entraIdTenantId || !org.entraIdClientId || !org.entraClientSecret) {
    console.error(
      `[grant-expiry] Organization ${organizationId} missing Microsoft credentials`
    );
  } else {
    // Attempt to revoke access via Microsoft Graph
    try {
      await revokeAccess(
        {
          clientId: org.entraIdClientId,
          clientSecret: org.entraClientSecret,
          tenantId: org.entraIdTenantId,
        },
        grant.request.requester.entraIdUserId || userId,
        resourceType as ResourceType,
        resourceId
      );
      console.log(
        `[grant-expiry] Successfully revoked access for grant ${grantId}`
      );
    } catch (error) {
      console.error(
        `[grant-expiry] Failed to revoke access for grant ${grantId}:`,
        error
      );
      // Continue to mark as expired even if Graph API call fails
      // (the access may have already expired or been removed)
    }
  }

  // Update grant status to EXPIRED
  await prisma.accessGrant.update({
    where: { id: grantId },
    data: {
      status: "EXPIRED",
      revokedAt: new Date(),
    },
  });

  // Update request status to EXPIRED
  await prisma.accessRequest.update({
    where: { id: requestId },
    data: { status: "EXPIRED" },
  });

  // Write audit log
  await writeAuditLog({
    organizationId,
    userId,
    action: AUDIT_ACTIONS.GRANT_EXPIRED,
    resourceType,
    resourceId,
    metadata: {
      grantId,
      requestId,
      resourceName: grant.resourceName,
      expiredAt: new Date().toISOString(),
    },
  });

  // Send expiry notification
  try {
    await enqueueNotification({
      type: "grant.expired",
      recipientEmail: grant.request.requester.email,
      recipientName: grant.request.requester.name,
      grantId,
      resourceName: grant.resourceName,
      expiresAt: grant.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error(
      `[grant-expiry] Failed to enqueue notification for grant ${grantId}:`,
      error
    );
  }

  console.log(`[grant-expiry] Successfully processed expiry for grant ${grantId}`);
}

// ─── Start Worker ─────────────────────────────────────────────────────────────

const connection = createRedisConnection();

const worker = new Worker<GrantExpiryJobData>(
  QUEUE_NAMES.GRANT_EXPIRY,
  processGrantExpiry,
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // max 10 jobs per second
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[grant-expiry] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[grant-expiry] Job ${job?.id} failed:`, err);
});

worker.on("error", (err) => {
  console.error("[grant-expiry] Worker error:", err);
});

console.log(
  `[grant-expiry] Worker started, listening on queue "${QUEUE_NAMES.GRANT_EXPIRY}"`
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[grant-expiry] SIGTERM received, shutting down...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[grant-expiry] SIGINT received, shutting down...");
  await worker.close();
  await connection.quit();
  process.exit(0);
});
