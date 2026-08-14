const dns = require('dns');
const nodemailer = require('nodemailer');

const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: String(process.env.SMTP_PORT || '587') === '465',
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  lookup(hostname, options, callback) {
    return dns.lookup(hostname, { ...options, family: 4 }, callback);
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendViaResend({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!apiKey || !from) return null;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function sendEmail({ to, subject, html }) {
  const resendResult = await sendViaResend({ to, subject, html });
  if (resendResult) {
    return { provider: 'resend', result: resendResult };
  }

  const fromEmail = process.env.SMTP_USER || process.env.SMTP_FROM;
  if (!fromEmail) {
    throw new Error('No email provider configured');
  }

  const info = await smtpTransporter.sendMail({
    from: `"Code Hunt" <${fromEmail}>`,
    to,
    subject,
    html,
  });

  return { provider: 'smtp', result: info };
}

module.exports = { sendEmail, smtpTransporter };
