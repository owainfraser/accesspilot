import { Queue, Worker, QueueEvents } from "bullmq";
import IORedis from "ioredis";

// ─── Redis Connection ─────────────────────────────────────────────────────────

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export function createRedisConnection(): IORedis {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  });
}

// ─── Queue Names ──────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  GRANT_EXPIRY: "grant-expiry",
  NOTIFICATION_EMAIL: "notification-email",
  AUDIT_WRITE: "audit-write",
} as const;

// ─── Queue Instances ──────────────────────────────────────────────────────────

let grantExpiryQueue: Queue | null = null;
let notificationQueue: Queue | null = null;
let auditWriteQueue: Queue | null = null;

export function getGrantExpiryQueue(): Queue {
  if (!grantExpiryQueue) {
    grantExpiryQueue = new Queue(QUEUE_NAMES.GRANT_EXPIRY, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    });
  }
  return grantExpiryQueue;
}

export function getNotificationQueue(): Queue {
  if (!notificationQueue) {
    notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION_EMAIL, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 500,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });
  }
  return notificationQueue;
}

export function getAuditWriteQueue(): Queue {
  if (!auditWriteQueue) {
    auditWriteQueue = new Queue(QUEUE_NAMES.AUDIT_WRITE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 200,
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
      },
    });
  }
  return auditWriteQueue;
}

// ─── Job Payloads ─────────────────────────────────────────────────────────────

export interface GrantExpiryJobData {
  grantId: string;
  requestId: string;
  userId: string;
  organizationId: string;
  resourceType: string;
  resourceId: string;
}

export interface NotificationEmailJobData {
  type:
    | "request.created"
    | "request.approved"
    | "request.denied"
    | "grant.expiring_soon"
    | "grant.expired";
  recipientEmail: string;
  recipientName: string;
  requestId?: string;
  grantId?: string;
  organizationName?: string;
  resourceName?: string;
  approverName?: string;
  denialReason?: string;
  expiresAt?: string;
}

export interface AuditWriteJobData {
  organizationId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Schedule Grant Expiry ────────────────────────────────────────────────────

export async function scheduleGrantExpiry(
  data: GrantExpiryJobData,
  expiresAt: Date
): Promise<void> {
  const queue = getGrantExpiryQueue();
  const delay = Math.max(0, expiresAt.getTime() - Date.now());

  await queue.add(`grant-expiry-${data.grantId}`, data, {
    delay,
    jobId: `grant-expiry-${data.grantId}`,
    removeOnComplete: true,
  });
}

export async function cancelGrantExpiry(grantId: string): Promise<void> {
  const queue = getGrantExpiryQueue();
  const job = await queue.getJob(`grant-expiry-${grantId}`);
  if (job) {
    await job.remove();
  }
}

// ─── Send Notification ────────────────────────────────────────────────────────

export async function enqueueNotification(
  data: NotificationEmailJobData
): Promise<void> {
  const queue = getNotificationQueue();
  await queue.add(`notification-${data.type}`, data);
}
