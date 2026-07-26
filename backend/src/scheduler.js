const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(d) {
  if (!d) return false;
  return isSameDay(d, new Date());
}

function formatTime(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

async function checkAndSendReminders() {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Find students who haven't met daily goal and haven't been reminded today
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        OR: [
          { todaySolvedCount: { lt: 2 } },
          { lastSolvedDate: null },
        ],
        NOT: {
          lastReminderSent: {
            gte: todayStart,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        todaySolvedCount: true,
        lastSolvedDate: true,
        totalSolved: true,
      },
    });

    for (const student of students) {
      const todayCount = isToday(student.lastSolvedDate) ? student.todaySolvedCount : 0;

      if (todayCount < 2) {
        // Log reminder (in production, send email via nodemailer/SendGrid)
        console.log(`[EMAIL REMINDER] To: ${student.email}`);
        console.log(`  Subject: Daily Coding Reminder`);
        console.log(`  Hello ${student.name},`);
        console.log(`  You have not completed today's coding goal.`);
        console.log(`  Today's Goal: Complete at least 2 coding problems.`);
        console.log(`  Current: ${todayCount}/2 completed`);
        console.log(`  Keep practicing consistently to improve your skills!`);
        console.log(`  Happy Coding! — Code Hunt Team\n`);

        // Update lastReminderSent
        await prisma.user.update({
          where: { id: student.id },
          data: { lastReminderSent: new Date() },
        });
      }
    }

    console.log(`[REMINDER] Checked ${students.length} students`);
  } catch (err) {
    console.error('[REMINDER ERROR]', err.message);
  }
}

// Run daily at 8 PM (20:00)
function startScheduler() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(20, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const msUntilTarget = target.getTime() - now.getTime();

  setTimeout(() => {
    checkAndSendReminders();
    // Then repeat every 24 hours
    setInterval(checkAndSendReminders, 24 * 60 * 60 * 1000);
  }, msUntilTarget);

  console.log(`[SCHEDULER] Email reminders scheduled for ${target.toLocaleString()}`);
}

module.exports = { startScheduler, checkAndSendReminders };
