const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');

// POST /api/logs — update or create distraction summary
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { problemId } = req.body;
    const studentId = req.user.id;

    if (!problemId) {
      return res.status(400).json({ error: 'problemId is required' });
    }

    const updated = await prisma.distractionSummary.updateMany({
      where: { studentId, problemId },
      data: {
        hadDistraction: true,
        distractionCount: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      try {
        await prisma.distractionSummary.create({
          data: {
            studentId,
            problemId,
            hadDistraction: true,
            distractionCount: 1,
          },
        });
      } catch (createErr) {
        if (createErr.code === 'P2002') {
          await prisma.distractionSummary.updateMany({
            where: { studentId, problemId },
            data: {
              hadDistraction: true,
              distractionCount: { increment: 1 },
            },
          });
        } else {
          throw createErr;
        }
      }
    }

    const summary = await prisma.distractionSummary.findFirst({
      where: { studentId, problemId },
    });

    res.status(201).json(summary);
  } catch (err) {
    console.error('Log error:', err.message);
    res.status(200).json({ ok: true });
  }
});

module.exports = router;
