/**
 * Mailer – Nodemailer SMTP with STARTTLS for production, file-based for local dev.
 *
 * Production variables (set in Hostinger environment):
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASSWORD, MAIL_FROM
 *
 * Local development: when SMTP_HOST is absent, emails are written to .local/mail/.
 */
import { createTransport, type Transporter } from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { SendMailOptions } from 'nodemailer';

// Lazy singleton so the module can be imported without an SMTP config present
let _transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (_transport) return _transport;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  _transport = createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,          // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
    requireTLS: true,
  });
  return _transport;
}

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Send a mail. Falls back to .local/mail/ when SMTP is not configured. */
export async function sendMail(opts: MailOptions): Promise<void> {
  const transport = getTransport();
  if (transport) {
    const from = process.env.MAIL_FROM || `"Digiwiz Tasks" <no-reply@digiwiz.com.bd>`;
    await transport.sendMail({ from, ...opts } as SendMailOptions);
  } else {
    // Local file-based inbox (development only)
    await mkdir('.local/mail', { recursive: true });
    const filename = '.local/mail/' + randomUUID() + '.eml';
    const content = [
      `To: ${opts.to}`,
      `Subject: ${opts.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      '',
      opts.text,
    ].join('\r\n');
    await writeFile(filename, content, { mode: 0o600 });
  }
}

/** Branded OTP email body */
export function otpEmail(purpose: 'register' | 'reset', code: string): MailOptions {
  const action = purpose === 'register' ? 'account registration' : 'password reset';
  const subject = `Digiwiz Tasks – Your ${purpose === 'register' ? 'registration' : 'password reset'} code`;
  const text = [
    'Hello,',
    '',
    `Your Digiwiz Tasks ${action} code is:`,
    '',
    `    ${code}`,
    '',
    'This code expires in 10 minutes and can only be used once.',
    'If you did not request this, please ignore this email.',
    '',
    '– Digiwiz Tasks',
  ].join('\n');
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f8;font-family:'Segoe UI',system-ui,sans-serif;color:#211e2e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px #24194814">
<tr><td style="background:#523397;padding:28px 32px">
  <span style="display:inline-block;background:#d3bfff;color:#201634;border-radius:12px 12px 4px 12px;width:40px;height:40px;line-height:40px;text-align:center;font-weight:800;font-size:15px;letter-spacing:-.1em">DW</span>
  <span style="display:inline-block;vertical-align:middle;margin-left:12px;color:#fff;font-size:18px;font-weight:700">Digiwiz Tasks</span>
</td></tr>
<tr><td style="padding:32px">
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700">Your verification code</h1>
  <p style="margin:0 0 24px;color:#625e72;font-size:14px">Use this one-time code to complete your ${action}.</p>
  <div style="background:#f0edf5;border-radius:12px;padding:20px 24px;text-align:center;margin-bottom:24px">
    <span style="font-size:38px;font-weight:800;letter-spacing:.18em;color:#523397">${code}</span>
  </div>
  <p style="margin:0;color:#625e72;font-size:13px;line-height:1.5">This code expires in <strong>10 minutes</strong> and can only be used once.<br>If you did not request this, please ignore this email.</p>
</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #e9e6ef">
  <p style="margin:0;color:#9a95a7;font-size:12px">Digiwiz Tasks — Staff workspace &nbsp;·&nbsp; <a href="https://tasks.digiwiz.com.bd" style="color:#6547b7">tasks.digiwiz.com.bd</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
  return { to: '', subject, text, html };
}
