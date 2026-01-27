import { prisma } from '../config/database.js';
import { processUserLesson } from '../services/lessonService.js';

// Check and send lessons every minute
async function checkAndSendLessons() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  try {
    // Find users whose delivery time matches current time
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        deliveryHour: currentHour,
        deliveryMinute: currentMinute,
        categories: {
          some: {
            isSelected: true,
          },
        },
      },
      select: {
        id: true,
        telegramId: true,
      },
    });

    for (const user of users) {
      try {
        await processUserLesson(user.id, user.telegramId);
        console.log(`Lesson sent to user ${user.id}`);
      } catch (error) {
        console.error(`Failed to send lesson to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error('Scheduler error:', error);
  }
}

export function startDailyScheduler() {
  console.log('Daily scheduler started');

  // Check every minute
  setInterval(checkAndSendLessons, 60 * 1000);

  // Also check on startup (with 5 second delay)
  setTimeout(checkAndSendLessons, 5000);
}
