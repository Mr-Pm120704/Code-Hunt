const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/admin/webcam-users — list all students with webcam status for webcam control
router.get('/webcam-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        year: true,
        class: true,
        webcamEnabled: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// POST /api/admin/webcam-toggle/:userId — toggle webcam for a specific student
router.post('/webcam-toggle/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { webcamEnabled } = req.body;

    if (typeof webcamEnabled !== 'boolean') {
      return res.status(400).json({ error: 'webcamEnabled must be a boolean' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { webcamEnabled },
      select: { id: true, name: true, email: true, year: true, class: true, webcamEnabled: true },
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle webcam', details: err.message });
  }
});

// GET /api/admin/students — list all students with summary data
router.get('/students', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        name: true,
        email: true,
        year: true,
        class: true,
        webcamEnabled: true,
        createdAt: true,
        submissions: {
          where: { passedTestCases: true },
          select: {
            id: true,
            problem: { select: { id: true, title: true, difficulty: true } },
            timestamp: true,
          },
          orderBy: { timestamp: 'desc' },
        },
        distractionSummaries: {
          select: {
            problemId: true,
            hadDistraction: true,
            distractionCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Build summary per student
    const result = students.map(s => {
      const summaries = s.distractionSummaries || [];
      const totalDistractions = summaries.reduce((acc, d) => acc + d.distractionCount, 0);
      const hadAnyDistraction = summaries.some(d => d.hadDistraction);
      const passedSubs = s.submissions || [];
      const uniqueProblemIds = new Set();
      const uniqueSolvedProblems = [];
      passedSubs.forEach(sub => {
        if (!uniqueProblemIds.has(sub.problem.id)) {
          uniqueProblemIds.add(sub.problem.id);
          uniqueSolvedProblems.push(sub);
        }
      });

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        year: s.year,
        class: s.class,
        webcamEnabled: s.webcamEnabled,
        createdAt: s.createdAt,
        solvedProblems: uniqueSolvedProblems,
        solvedCount: uniqueSolvedProblems.length,
        totalDistractions,
        hadDistraction: hadAnyDistraction,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// GET /api/admin/student/:id — detailed profile for one student
router.get('/student/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const student = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, name: true,
        submissions: {
          select: {
            id: true,
            passedTestCases: true,
            distractionCount: true,
            timestamp: true,
            problem: { select: { id: true, title: true, difficulty: true } },
          },
          orderBy: { timestamp: 'desc' },
        },
        distractionSummaries: {
          select: {
            problemId: true,
            hadDistraction: true,
            distractionCount: true,
            lastUpdated: true,
            problem: { select: { title: true } },
          },
        },
      },
    });

    if (!student) return res.status(404).json({ error: 'Student not found' });

    const passedSubs = (student.submissions || []).filter(s => s.passedTestCases);
    const uniqueProblemIds = new Set();
    const solvedProblems = [];
    passedSubs.forEach(sub => {
      if (!uniqueProblemIds.has(sub.problem.id)) {
        uniqueProblemIds.add(sub.problem.id);
        solvedProblems.push(sub);
      }
    });
    const summaries = student.distractionSummaries || [];
    const totalDistractions = summaries.reduce((acc, d) => acc + d.distractionCount, 0);
    const hadDistraction = summaries.some(d => d.hadDistraction);

    res.json({
      student: { id: student.id, name: student.name, email: student.email },
      submissions: student.submissions,
      solvedProblems,
      distractionSummaries: student.distractionSummaries,
      totalDistractions,
      hadDistraction,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// POST /api/admin/contests - Create a new contest
router.post('/contests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, startTime, endTime, problemIds } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ error: 'End time must be strictly after start time' });
    }

    const contest = await prisma.contest.create({
      data: {
        title,
        description: description || '',
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        problemIds: problemIds || [],
      },
      include: { problems: true },
    });

    res.status(201).json(contest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// DELETE /api/admin/contests/:id - Delete a contest
router.delete('/contests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.contest.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Contest deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
