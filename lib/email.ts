/**
 * lib/email.ts
 * Shared email utilities — one transporter, one batch-sender.
 * All API routes import from here instead of creating their own.
 */

import nodemailer from "nodemailer";

// Single shared transporter using Gmail credentials from .env.local
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/** The "from" address used in all outbound emails */
export const FROM_ADDRESS = `"ScholarPath" <${process.env.EMAIL_USER}>`;

/**
 * Send emails to a list of users in batches of 10.
 * Uses Promise.allSettled so one failure doesn't stop the rest.
 * Waits 500ms between batches to avoid Gmail rate limits.
 */
export async function sendBatchEmails(
  users: { email: string; name?: string }[],
  subject: string,
  buildHtml: (recipientName?: string) => string
): Promise<{ success: number; failed: number }> {
  const BATCH_SIZE = 10;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);

    await Promise.allSettled(
      batch.map(async (user) => {
        try {
          await transporter.sendMail({
            from: FROM_ADDRESS,
            to: user.email,
            subject,
            html: buildHtml(user.name),
          });
          success++;
        } catch (err) {
          console.error(`[ScholarPath] Email failed for ${user.email}:`, err);
          failed++;
        }
      })
    );

    // Small delay between batches
    if (i + BATCH_SIZE < users.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return { success, failed };
}
