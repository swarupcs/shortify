import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL ?? 'Shortify <noreply@yourdomain.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const APP_NAME = 'Shortify';

// ── Email templates ────────────────────────────────────────────────────────

function verificationEmailHtml(verifyUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <div style="width:32px;height:32px;background:rgba(255,255,255,.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center">
              <span style="color:#fff;font-size:16px">✂</span>
            </div>
            <span style="color:#fff;font-size:20px;font-weight:700">${APP_NAME}</span>
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b">Verify your email</h1>
          <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6">
            Thanks for signing up! Click the button below to verify your email address and start shortening links.
          </p>
          <a href="${verifyUrl}"
             style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px">
            Verify email address
          </a>
          <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px">
            This link expires in 24 hours. If you didn't create an account, you can ignore this email.
          </p>
          <hr style="margin:28px 0;border:none;border-top:1px solid #f4f4f5">
          <p style="margin:0;color:#a1a1aa;font-size:12px">
            Or copy this URL into your browser:<br>
            <span style="color:#7c3aed;word-break:break-all">${verifyUrl}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function passwordResetEmailHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 40px;text-align:center">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <div style="width:32px;height:32px;background:rgba(255,255,255,.2);border-radius:8px;display:inline-flex;align-items:center;justify-content:center">
              <span style="color:#fff;font-size:16px">✂</span>
            </div>
            <span style="color:#fff;font-size:20px;font-weight:700">${APP_NAME}</span>
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#09090b">Reset your password</h1>
          <p style="margin:0 0 24px;color:#71717a;font-size:15px;line-height:1.6">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px">
            Reset password
          </a>
          <p style="margin:24px 0 0;color:#a1a1aa;font-size:13px">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          <hr style="margin:28px 0;border:none;border-top:1px solid #f4f4f5">
          <p style="margin:0;color:#a1a1aa;font-size:12px">
            Or copy this URL into your browser:<br>
            <span style="color:#7c3aed;word-break:break-all">${resetUrl}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Exported helpers ───────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Verify your Shortify email address',
      html: verificationEmailHtml(verifyUrl),
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err) {
    console.error('[email] Failed to send verification email:', err);
    return { success: false, error: 'Failed to send verification email' };
  }
}

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Reset your Shortify password',
      html: passwordResetEmailHtml(resetUrl),
    });
    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err) {
    console.error('[email] Failed to send password reset email:', err);
    return { success: false, error: 'Failed to send password reset email' };
  }
}
