/**
 * Notification Email Worker
 *
 * This worker runs as a SEPARATE PROCESS from Next.js.
 * Start it with: npm run worker:notification
 *
 * It processes jobs from the "notification-email" BullMQ queue and
 * sends transactional emails via SMTP (Nodemailer).
 */

import { Worker, Job } from "bullmq";
import nodemailer from "nodemailer";
import {
  createRedisConnection,
  QUEUE_NAMES,
  type NotificationEmailJobData,
} from "../queue";

// ─── Email Transport ──────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || "AccessPilot <noreply@accesspilot.io>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://accesspilot.io";

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildEmailHtml(title: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .body p { margin: 0 0 16px; line-height: 1.6; }
    .cta { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .footer { padding: 16px 32px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
    .badge-pending { background: #1e3a5f; color: #60a5fa; }
    .badge-approved { background: #14532d; color: #4ade80; }
    .badge-denied { background: #450a0a; color: #f87171; }
    .badge-expired { background: #292524; color: #a8a29e; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; font-size: 14px; }
    .detail-label { color: #94a3b8; }
    .detail-value { color: #e2e8f0; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 AccessPilot</h1>
      <p>Just-in-Time Privileged Access Management</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>You received this email because you use AccessPilot for access management.</p>
      <p>© ${new Date().getFullYear()} AccessPilot — <a href="${APP_URL}" style="color: #3b82f6;">accesspilot.io</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function getEmailContent(data: NotificationEmailJobData): {
  subject: string;
  html: string;
} {
  const appUrl = APP_URL;

  switch (data.type) {
    case "request.created":
      return {
        subject: `New Access Request: ${data.resourceName}`,
        html: buildEmailHtml(
          "New Access Request",
          `
          <p>Hi ${data.recipientName},</p>
          <p>A new access request requires your approval.</p>
          <div class="detail-row">
            <span class="detail-label">Resource</span>
            <span class="detail-value">${data.resourceName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Organization</span>
            <span class="detail-value">${data.organizationName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value"><span class="badge badge-pending">PENDING APPROVAL</span></span>
          </div>
          <br/>
          <a href="${appUrl}/requests/${data.requestId}" class="cta">Review Request</a>
          `
        ),
      };

    case "request.approved":
      return {
        subject: `✅ Access Approved: ${data.resourceName}`,
        html: buildEmailHtml(
          "Access Request Approved",
          `
          <p>Hi ${data.recipientName},</p>
          <p>Your access request has been <strong>approved</strong> by ${data.approverName}.</p>
          <div class="detail-row">
            <span class="detail-label">Resource</span>
            <span class="detail-value">${data.resourceName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Approved By</span>
            <span class="detail-value">${data.approverName}</span>
          </div>
          ${data.expiresAt ? `<div class="detail-row">
            <span class="detail-label">Access Expires</span>
            <span class="detail-value">${new Date(data.expiresAt).toLocaleString()}</span>
          </div>` : ""}
          <p style="color: #94a3b8; font-size: 14px; margin-top: 16px;">
            Your access has been provisioned. It will be automatically revoked when it expires.
          </p>
          <a href="${appUrl}/grants" class="cta">View Active Grants</a>
          `
        ),
      };

    case "request.denied":
      return {
        subject: `❌ Access Denied: ${data.resourceName}`,
        html: buildEmailHtml(
          "Access Request Denied",
          `
          <p>Hi ${data.recipientName},</p>
          <p>Your access request has been <strong>denied</strong>.</p>
          <div class="detail-row">
            <span class="detail-label">Resource</span>
            <span class="detail-value">${data.resourceName}</span>
          </div>
          ${data.denialReason ? `<div class="detail-row">
            <span class="detail-label">Reason</span>
            <span class="detail-value">${data.denialReason}</span>
          </div>` : ""}
          <p style="color: #94a3b8; font-size: 14px; margin-top: 16px;">
            If you believe this is incorrect, please contact your administrator or submit a new request with additional justification.
          </p>
          <a href="${appUrl}/requests/new" class="cta">Submit New Request</a>
          `
        ),
      };

    case "grant.expiring_soon":
      return {
        subject: `⏰ Access Expiring Soon: ${data.resourceName}`,
        html: buildEmailHtml(
          "Access Expiring Soon",
          `
          <p>Hi ${data.recipientName},</p>
          <p>Your access to <strong>${data.resourceName}</strong> is expiring soon.</p>
          ${data.expiresAt ? `<div class="detail-row">
            <span class="detail-label">Expires At</span>
            <span class="detail-value">${new Date(data.expiresAt).toLocaleString()}</span>
          </div>` : ""}
          <p style="color: #94a3b8; font-size: 14px; margin-top: 16px;">
            If you still need access, submit a new request before it expires.
          </p>
          <a href="${appUrl}/requests/new" class="cta">Renew Access</a>
          `
        ),
      };

    case "grant.expired":
      return {
        subject: `🔒 Access Expired: ${data.resourceName}`,
        html: buildEmailHtml(
          "Access Expired",
          `
          <p>Hi ${data.recipientName},</p>
          <p>Your temporary access to <strong>${data.resourceName}</strong> has expired and been automatically revoked.</p>
          ${data.expiresAt ? `<div class="detail-row">
            <span class="detail-label">Expired At</span>
            <span class="detail-value">${new Date(data.expiresAt).toLocaleString()}</span>
          </div>` : ""}
          <p style="color: #94a3b8; font-size: 14px; margin-top: 16px;">
            Submit a new access request if you need continued access.
          </p>
          <a href="${appUrl}/requests/new" class="cta">Request New Access</a>
          `
        ),
      };

    default:
      return {
        subject: "AccessPilot Notification",
        html: buildEmailHtml("Notification", `<p>Hi ${data.recipientName},</p><p>You have a new notification from AccessPilot.</p>`),
      };
  }
}

// ─── Worker Process Function ──────────────────────────────────────────────────

async function processNotification(job: Job<NotificationEmailJobData>) {
  const { subject, html } = getEmailContent(job.data);

  console.log(
    `[notification] Sending "${subject}" to ${job.data.recipientEmail}`
  );

  await transporter.sendMail({
    from: FROM_ADDRESS,
    to: job.data.recipientEmail,
    subject,
    html,
  });

  console.log(
    `[notification] Email sent successfully to ${job.data.recipientEmail}`
  );
}

// ─── Start Worker ─────────────────────────────────────────────────────────────

const connection = createRedisConnection();

const worker = new Worker<NotificationEmailJobData>(
  QUEUE_NAMES.NOTIFICATION_EMAIL,
  processNotification,
  {
    connection,
    concurrency: 10,
    limiter: {
      max: 20,
      duration: 1000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[notification] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[notification] Job ${job?.id} failed:`, err);
});

worker.on("error", (err) => {
  console.error("[notification] Worker error:", err);
});

console.log(
  `[notification] Worker started, listening on queue "${QUEUE_NAMES.NOTIFICATION_EMAIL}"`
);

// Graceful shutdown
process.on("SIGTERM", async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await worker.close();
  await connection.quit();
  process.exit(0);
});
