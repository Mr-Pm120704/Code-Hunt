const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticateToken } = require('../middleware/auth');
const { runCode } = require('../utils/executor');

// XP per difficulty
const XP_MAP = { Easy: 10, Medium: 20, Hard: 40 };

function calcLevel(xp) {
  return Math.floor(xp / 100);
}

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// POST /api/submit — final submission (runs code + saves to DB + updates gamification)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { code, problemId, distractionCount = 0, language = 'java' } = req.body;
    const studentId = req.user.id;

    if (!code || !problemId) {
      return res.status(400).json({ error: 'code and problemId are required' });
    }

    const problem = await prisma.problem.findUnique({ where: { id: problemId } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const testCases = JSON.parse(problem.testCases);
    const startTime = Date.now();
    const results = await runCode(code, testCases, problem.functionName, language);
    const executionTimeMs = Date.now() - startTime;
    const allPassed = results.every((r) => r.passed);
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = testCases.length;

    // Calculate XP earned (only if all test cases passed)
    const xpEarned = allPassed ? (XP_MAP[problem.difficulty] || 10) : 0;

    const submission = await prisma.submission.create({
      data: {
        studentId,
        problemId,
        code,
        output: JSON.stringify(results),
        passedTestCases: allPassed,
        passedCount,
        totalCount,
        distractionCount: distractionCount || 0,
        executionTime: Math.round(executionTimeMs / 1000),
        xpEarned,
      },
    });

    // Update gamification stats if problem was solved
    if (allPassed) {
      const student = await prisma.user.findUnique({ where: { id: studentId } });
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      // Check if this problem was already solved before
      const existingSolved = await prisma.submission.findFirst({
        where: {
          studentId,
          problemId,
          passedTestCases: true,
          id: { not: submission.id },
        },
      });

      const isNewSolve = !existingSolved;
      const isToday = isSameDay(student.lastSolvedDate, today);

      // Calculate execution time in minutes
      const execMinutes = Math.round(executionTimeMs / 60000);

      const updateData = {
        xp: student.xp + xpEarned,
        level: calcLevel(student.xp + xpEarned),
        totalCompletionTime: student.totalCompletionTime + execMinutes,
      };

      if (isNewSolve) {
        updateData.totalSolved = student.totalSolved + 1;
      }

      // Update daily goal tracking
      if (isToday) {
        updateData.todaySolvedCount = student.todaySolvedCount + 1;
      } else {
        // New day — reset counter
        updateData.todaySolvedCount = 1;
        updateData.lastSolvedDate = todayStart;
      }

      if (!student.lastSolvedDate) {
        updateData.lastSolvedDate = todayStart;
      }

      await prisma.user.update({
        where: { id: studentId },
        data: updateData,
      });
    }

    res.status(201).json({
      submission,
      results,
      allPassed,
      xpEarned,
      summary: { passed: passedCount, total: totalCount },
    });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/submit/my — current student's submissions
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { studentId: req.user.id },
      include: { problem: { select: { title: true, difficulty: true } } },
      orderBy: { timestamp: 'desc' },
    });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/submit/stats — current student's gamification stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        totalSolved: true,
        xp: true,
        level: true,
        totalCompletionTime: true,
        todaySolvedCount: true,
        lastSolvedDate: true,
      },
    });

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = student.lastSolvedDate && isSameDay(student.lastSolvedDate, todayStart);

    res.json({
      totalSolved: student.totalSolved,
      xp: student.xp,
      level: student.level,
      totalCompletionTime: student.totalCompletionTime,
      todaySolvedCount: isToday ? student.todaySolvedCount : 0,
      dailyGoal: 2,
      levelTitle: getLevelTitle(student.level),
      nextLevelXp: (student.level + 1) * 100,
      currentLevelXp: student.level * 100,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getLevelTitle(level) {
  if (level === 0) return 'Beginner';
  return `Level ${level}`;
}

module.exports = router;
