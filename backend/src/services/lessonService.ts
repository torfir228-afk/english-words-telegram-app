import { prisma } from '../config/database.js';
import { Telegraf } from 'telegraf';
import { env } from '../config/env.js';
import { formatDailyLesson, getLessonKeyboard } from '../bot/messages/dailyLesson.js';

const bot = new Telegraf(env.BOT_TOKEN);

export async function generateLesson(userId: number) {
  // Get user's selected categories
  const selectedCategories = await prisma.userCategoryProgress.findMany({
    where: {
      userId,
      isSelected: true,
    },
    select: { categoryId: true },
  });

  if (selectedCategories.length === 0) {
    return null;
  }

  const categoryIds = selectedCategories.map((c) => c.categoryId);

  // Get words that haven't been sent yet
  const newWords = await prisma.word.findMany({
    where: {
      categoryId: { in: categoryIds },
      NOT: {
        userProgress: {
          some: {
            userId,
            status: { in: ['SENT', 'LEARNING', 'LEARNED'] },
          },
        },
      },
    },
    include: {
      examples: true,
    },
    take: 5,
  });

  if (newWords.length === 0) {
    return null;
  }

  // Create or update word progress
  for (const word of newWords) {
    await prisma.userWordProgress.upsert({
      where: {
        userId_wordId: { userId, wordId: word.id },
      },
      update: {
        status: 'SENT',
        sentCount: { increment: 1 },
        lastSentAt: new Date(),
      },
      create: {
        userId,
        wordId: word.id,
        status: 'SENT',
        sentCount: 1,
        lastSentAt: new Date(),
      },
    });
  }

  // Save lesson history
  await prisma.lessonHistory.create({
    data: {
      userId,
      wordIds: newWords.map((w) => w.id),
    },
  });

  return newWords;
}

export async function sendLesson(telegramId: bigint, words: Array<{
  english: string;
  russian: string;
  examples: Array<{ sentence: string; translation: string | null }>;
}>) {
  const message = formatDailyLesson(words);
  const keyboard = getLessonKeyboard();

  await bot.telegram.sendMessage(telegramId.toString(), message, {
    parse_mode: 'Markdown',
    ...keyboard,
  });
}

export async function processUserLesson(userId: number, telegramId: bigint) {
  const words = await generateLesson(userId);

  if (!words || words.length === 0) {
    return false;
  }

  await sendLesson(telegramId, words);
  return true;
}
