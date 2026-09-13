const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');

async function upsertWithRetry(data, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await prisma.distractionSummary.upsert(data);
    } catch (err) {
      if (err.code === 'P2034' && i < retries - 1) {
        await new Promise((r) => setTimeout(r, 50 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
}

// POST /api/logs — upsert distraction summary (lightweight, one row per student+problem)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.body;
    const studentId = req.user.id;

    if (!problemId) {
      return res.status(400).json({ error: 'problemId is required' });
    }

    const summary = await upsertWithRetry({
      where: { studentId_problemId: { studentId, problemId } },
      update: {
        hadDistraction: true,
        distractionCount: { increment: 1 },
      },
      create: {
        studentId,
        problemId,
        hadDistraction: true,
        distractionCount: 1,
      },
    });

    res.status(201).json(summary);
  } catch (err) {
    console.error('Log error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
