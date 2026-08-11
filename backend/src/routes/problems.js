const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Normalize year format: "1" -> "1st Year", "2" -> "2nd Year", "3" -> "3rd Year"
function normalizeYear(year) {
  if (!year) return '1st Year';
  const map = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year' };
  return map[year] || year;
}

// GET /api/problems — list problems (admin: all, student: only their year)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const studentYear = normalizeYear(req.user.year);
    const where = isAdmin ? {} : { year: studentYear };

    const problems = await prisma.problem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        submissions: {
          where: { studentId: req.user.id, passedTestCases: true },
          take: 1,
        },
      },
    });
    const parsed = problems.map((p) => {
      const cases = JSON.parse(p.testCases);
      const isSolved = p.submissions && p.submissions.length > 0;
      const { submissions, ...problemData } = p;
      return {
        ...problemData,
        year: p.year || '1st Year',
        isSolved,
        testCases: isAdmin ? cases : cases.filter(c => !c.hidden),
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/problems/:id — single problem (enforce year for students)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const problem = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Students can only access problems from their year
    if (req.user.role !== 'admin' && problem.year && problem.year !== normalizeYear(req.user.year)) {
      return res.status(403).json({ error: 'Access denied: problem not assigned to your year' });
    }

    const isAdmin = req.user.role === 'admin';
    const cases = JSON.parse(problem.testCases);

    // Get student's last successful submission for this problem
    let lastSolvedCode = null;
    let isSolved = false;
    if (!isAdmin) {
      const lastSubmission = await prisma.submission.findFirst({
        where: {
          studentId: req.user.id,
          problemId: problem.id,
          passedTestCases: true,
        },
        orderBy: { timestamp: 'desc' },
        select: { code: true },
      });
      if (lastSubmission) {
        isSolved = true;
        lastSolvedCode = lastSubmission.code;
      }
    }

    res.json({ 
      ...problem, 
      year: problem.year || '1st Year',
      testCases: isAdmin ? cases : cases.filter(c => !c.hidden),
      isSolved,
      lastSolvedCode,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/problems — create (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, difficulty, category, year, testCases, functionName, starterCode, points } = req.body;
    if (!title || !description || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({ error: 'title, description, testCases[] required' });
    }
    if (!year) {
      return res.status(400).json({ error: 'year is required' });
    }
    const problem = await prisma.problem.create({
      data: {
        title,
        description,
        difficulty: difficulty || 'Easy',
        category: category || 'All',
        year,
        testCases: JSON.stringify(testCases),
        functionName: functionName || 'solution',
        starterCode: starterCode || '',
        points: points || 100,
      },
    });
    res.status(201).json({ ...problem, testCases: JSON.parse(problem.testCases) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/problems/:id — update (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, difficulty, category, year, testCases, functionName, starterCode, points } = req.body;
    const data = {};
    if (title) data.title = title;
    if (description) data.description = description;
    if (difficulty) data.difficulty = difficulty;
    if (category) data.category = category;
    if (year) data.year = year;
    if (testCases) data.testCases = JSON.stringify(testCases);
    if (functionName) data.functionName = functionName;
    if (starterCode !== undefined) data.starterCode = starterCode;
    if (points !== undefined) data.points = points;

    const problem = await prisma.problem.update({ where: { id: req.params.id }, data });
    res.json({ ...problem, testCases: JSON.parse(problem.testCases) });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/problems/:id — delete (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.distractionSummary.deleteMany({ where: { problemId: req.params.id } });
    await prisma.submission.deleteMany({ where: { problemId: req.params.id } });
    await prisma.problem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Problem deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
