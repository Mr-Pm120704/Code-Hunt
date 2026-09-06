const nodemailer = require('nodemailer');

const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: smtpPort,
  secure: smtpPort === 465,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
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
