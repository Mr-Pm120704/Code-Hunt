const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('./utils/email');

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getTimePeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

async function sendReminderEmail(student, todayCount) {
  const timePeriod = getTimePeriod();
  const mailOptions = {
    to: student.email,
    subject: `Daily Coding Reminder (${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}) — Complete Today's Problems!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Code Hunt</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Daily Coding Reminder</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 15px 0;">${getGreeting()}, <strong>${student.name}</strong>!</p>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
            You haven't completed today's coding goal yet. Keep your streak going!
          </p>
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 15px; margin: 0 0 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Today's Progress: ${todayCount} / 2 problems solved</strong>
            </p>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin: 0 0 20px 0;">
            Solve <strong>${2 - todayCount} more problem${2 - todayCount !== 1 ? 's' : ''}</strong> today to meet your daily goal.
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/student" 
               style="background: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">
              Start Coding Now →
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
            Consistent practice is the key to improvement. Keep coding! 💪
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await sendEmail(mailOptions);
    console.log(`[EMAIL SENT] Reminder sent to ${student.email} (${student.name}) via ${info.provider}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL FAILED] Could not send to ${student.email}:`, err.message);
    return false;
  }
}

async function checkAndSendReminders() {
  try {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const currentHour = today.getHours();

    // Determine which time period we're in
    let timePeriod;
    if (currentHour < 12) timePeriod = 'morning';
    else if (currentHour < 17) timePeriod = 'afternoon';
    else timePeriod = 'evening';

    // Find all student accounts
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
      },
      select: {
        id: true,
        name: true,
        email: true,
        todaySolvedCount: true,
        lastSolvedDate: true,
        lastReminderSent: true,
        totalSolved: true,
      },
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      // Calculate today's actual solved count
      const todayCount = isToday(student.lastSolvedDate) ? student.todaySolvedCount : 0;

      // Skip if already met daily goal
      if (todayCount >= 2) {
        skippedCount++;
        continue;
      }

      // Skip if already reminded in this exact time period today
      // Allow reminders in different time periods (morning + evening)
      if (student.lastReminderSent && isSameDay(student.lastReminderSent, today)) {
        const lastSentHour = new Date(student.lastReminderSent).getHours();
        let lastPeriod;
        if (lastSentHour < 12) lastPeriod = 'morning';
        else if (lastSentHour < 17) lastPeriod = 'afternoon';
        else lastPeriod = 'evening';

        // Skip if already sent in the same time period
        if (lastPeriod === timePeriod) {
          skippedCount++;
          continue;
        }
      }

      // Send reminder email
      const sent = await sendReminderEmail(student, todayCount);

      // Update lastReminderSent regardless of email success (to avoid spam)
      await prisma.user.update({
        where: { id: student.id },
        data: { lastReminderSent: new Date() },
      });

      if (sent) sentCount++;
    }

    console.log(`[REMINDER] Done (${timePeriod}). Checked: ${students.length} | Sent: ${sentCount} | Skipped: ${skippedCount}`);
  } catch (err) {
    console.error('[REMINDER ERROR]', err.message);
  }
}

// Run daily at 8 PM (20:00) and also at 10 AM (10:00) for a second reminder
function startScheduler() {
  const now = new Date();

  // Schedule for 10:00 AM
  const morningTarget = new Date(now);
  morningTarget.setHours(10, 0, 0, 0);
  if (morningTarget <= now) morningTarget.setDate(morningTarget.getDate() + 1);

  // Schedule for 8:00 PM
  const eveningTarget = new Date(now);
  eveningTarget.setHours(20, 0, 0, 0);
  if (eveningTarget <= now) eveningTarget.setDate(eveningTarget.getDate() + 1);

  const msUntilMorning = morningTarget.getTime() - now.getTime();
  const msUntilEvening = eveningTarget.getTime() - now.getTime();

  // Morning reminder
  setTimeout(() => {
    console.log('[SCHEDULER] Running morning reminder check...');
    checkAndSendReminders();
    setInterval(checkAndSendReminders, 12 * 60 * 60 * 1000); // every 12 hours
  }, msUntilMorning);

  // Evening reminder (offset by 30 seconds from morning cycle to avoid collision)
  setTimeout(() => {
    console.log('[SCHEDULER] Running evening reminder check...');
    checkAndSendReminders();
  }, msUntilEvening + 30000);

  console.log(`[SCHEDULER] Reminders scheduled for ${morningTarget.toLocaleString()} (morning) and ${eveningTarget.toLocaleString()} (evening)`);
}

module.exports = { startScheduler, checkAndSendReminders };
