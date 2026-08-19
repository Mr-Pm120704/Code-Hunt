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

async function sendEmail({ to, subject, html }) {
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
