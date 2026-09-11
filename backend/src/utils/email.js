const axios = require('axios');

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'muruganandhamm7639@gmail.com';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Code Hunt';

async function sendEmail({ to, subject, html }) {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const payload = {
    sender: {
      email: BREVO_SENDER_EMAIL,
      name: BREVO_SENDER_NAME,
    },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  const response = await axios.post(BREVO_API_URL, payload, {
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 30000,
  });

  return { provider: 'brevo', result: response.data };
}

module.exports = { sendEmail };
