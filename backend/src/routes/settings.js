const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');

// GET /api/settings/webcam — returns the authenticated student's webcam status
router.get('/webcam', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { webcamEnabled: true },
    });
    res.json({ webcamEnabled: user ? user.webcamEnabled : true });
  } catch (err) {
    // Default to enabled on error (safe fallback)
    res.json({ webcamEnabled: true });
  }
});

module.exports = router;
