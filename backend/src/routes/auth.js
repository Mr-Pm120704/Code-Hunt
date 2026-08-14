const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const prisma = require('../utils/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  lookup(hostname, options, callback) {
    const dns = require('dns');
    return dns.lookup(hostname, { ...options, family: 4 }, callback);
  },
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Log env check on startup
console.log('[auth] DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('[auth] SMTP_USER present:', !!process.env.SMTP_USER);
console.log('[auth] SMTP_PASS length:', process.env.SMTP_PASS?.length || 0);

// Verify SMTP connection on startup
transporter.verify()
  .then(() => console.log('[auth] SMTP connection verified OK'))
  .catch((err) => console.error('[auth] SMTP connection FAILED:', err.message));



// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name, year, class: studentClass } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered. Please use a different email or contact admin to delete your old account.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'student',
        year: year || '',
        class: studentClass || '',
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, year: user.year },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name, year: user.year },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name, year: user.year },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name, year: user.year },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/forgot-password — generate reset code and send via email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    const code = String(crypto.randomInt(100000, 999999));
    const hashedCode = await bcrypt.hash(code, 10);
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetToken: hashedCode, resetTokenExpiry: expiry },
    });

    // Send email with reset code
    const fromEmail = process.env.SMTP_USER || process.env.SMTP_FROM;
    console.log(`[RESET] Attempting to send reset email to ${email}, SMTP_USER: ${fromEmail || 'NOT SET'}`);
    if (fromEmail) {
      try {
        const info = await transporter.sendMail({
          from: `"Code Hunt" <${fromEmail}>`,
          to: email,
          subject: 'Password Reset Code — Code Hunt',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Code Hunt</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset</p>
              </div>
              <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 14px; color: #374151; margin: 0 0 15px 0;">Hello <strong>${user.name}</strong>,</p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
                  We received a request to reset your password. Use the code below to reset it:
                </p>
                <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #16a34a; font-weight: bold; text-transform: uppercase;">Your Reset Code</p>
                  <p style="margin: 0; font-size: 36px; font-weight: black; color: #16a34a; letter-spacing: 8px; font-family: monospace;">${code}</p>
                </div>
                <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 20px 0 0 0;">
                  This code expires in 15 minutes. If you didn't request this, ignore this email.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[RESET] Email sent successfully to ${email}, messageId: ${info.messageId}`);
      } catch (emailErr) {
        console.error('[RESET] Email send FAILED:', emailErr.message);
        console.error('[RESET] Full error:', JSON.stringify(emailErr, null, 2));
      }
    } else {
      console.log(`[RESET] No SMTP configured. Code for ${email}: ${code}`);
    }

    res.json({ message: 'If an account exists with this email, a reset code has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password — verify code and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    if (new Date() > user.resetTokenExpiry) {
      await prisma.user.update({ where: { email }, data: { resetToken: null, resetTokenExpiry: null } });
      return res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
    }

    const codeMatch = await bcrypt.compare(code, user.resetToken);
    if (!codeMatch) {
      return res.status(400).json({ error: 'Invalid reset code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
