const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');

function normalizeYear(year) {
  if (!year) return '1st Year';
  const map = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year' };
  return map[year] || year;
}

function getLevelTitle(level) {
  if (level === 0) return 'Beginner';
  return `Level ${level}`;
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// GET /api/leaderboard — get leaderboard for student's year
router.get('/', authenticateToken, async (req, res) => {
  try {
    const studentYear = normalizeYear(req.user.year);

    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        year: studentYear,
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalSolved: true,
        xp: true,
        level: true,
        totalCompletionTime: true,
        lastSolvedDate: true,
      },
    });

    // Sort by: 1) totalSolved desc, 2) totalCompletionTime asc
    const ranked = students
      .sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        return a.totalCompletionTime - b.totalCompletionTime;
      })
      .map((s, idx) => ({
        rank: idx + 1,
        id: s.id,
        name: s.name,
        email: s.email,
        totalSolved: s.totalSolved,
        totalMarks: s.totalSolved * 2,
        xp: s.xp,
        level: s.level,
        levelTitle: getLevelTitle(s.level),
        totalCompletionTime: s.totalCompletionTime,
        formattedTime: formatTime(s.totalCompletionTime),
        lastSolvedDate: s.lastSolvedDate,
        isCurrentUser: s.id === req.user.id,
      }));

    // Find current user's rank
    const currentUserRank = ranked.find((r) => r.isCurrentUser);

    res.json({
      year: studentYear,
      leaderboard: ranked,
      myRank: currentUserRank || null,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboard/:year — get leaderboard for a specific year (admin)
router.get('/:year', authenticateToken, async (req, res) => {
  try {
    const targetYear = normalizeYear(req.params.year);

    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        year: targetYear,
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalSolved: true,
        xp: true,
        level: true,
        totalCompletionTime: true,
        lastSolvedDate: true,
      },
    });

    const ranked = students
      .sort((a, b) => {
        if (b.totalSolved !== a.totalSolved) return b.totalSolved - a.totalSolved;
        return a.totalCompletionTime - b.totalCompletionTime;
      })
      .map((s, idx) => ({
        rank: idx + 1,
        id: s.id,
        name: s.name,
        email: s.email,
        totalSolved: s.totalSolved,
        totalMarks: s.totalSolved * 2,
        xp: s.xp,
        level: s.level,
        levelTitle: getLevelTitle(s.level),
        totalCompletionTime: s.totalCompletionTime,
        formattedTime: formatTime(s.totalCompletionTime),
        lastSolvedDate: s.lastSolvedDate,
        isCurrentUser: s.id === req.user.id,
      }));

    res.json({
      year: targetYear,
      leaderboard: ranked,
    });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
