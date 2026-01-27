import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { telegramAuth } from '../middleware/auth.js';

export const progressRouter = Router();

progressRouter.use(telegramAuth);

// Get overall progress
progressRouter.get('/', async (req, res) => {
  try {
    const userId = req.dbUser!.id;

    const categoryProgress = await prisma.userCategoryProgress.findMany({
      where: { userId },
      include: {
        category: {
          include: {
            _count: { select: { words: true } },
          },
        },
      },
    });

    const totalWords = categoryProgress.reduce(
      (sum, p) => sum + p.category._count.words,
      0
    );
    const totalLearned = categoryProgress.reduce(
      (sum, p) => sum + p.wordsLearned,
      0
    );

    res.json({
      totalWords,
      totalLearned,
      totalPercent: totalWords > 0 ? Math.round((totalLearned / totalWords) * 100) : 0,
      categories: categoryProgress.map((p) => ({
        categoryId: p.categoryId,
        categoryName: p.category.displayName,
        wordsLearned: p.wordsLearned,
        totalWords: p.category._count.words,
        percent: p.category._count.words > 0
          ? Math.round((p.wordsLearned / p.category._count.words) * 100)
          : 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get learned words
progressRouter.get('/words', async (req, res) => {
  try {
    const userId = req.dbUser!.id;
    const categoryId = req.query.categoryId
      ? parseInt(req.query.categoryId as string, 10)
      : undefined;

    const wordProgress = await prisma.userWordProgress.findMany({
      where: {
        userId,
        status: 'LEARNED',
        ...(categoryId && { word: { categoryId } }),
      },
      include: {
        word: {
          include: {
            examples: true,
            category: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      words: wordProgress.map((wp) => ({
        id: wp.word.id,
        english: wp.word.english,
        russian: wp.word.russian,
        category: wp.word.category.displayName,
        examples: wp.word.examples.map((e) => ({
          sentence: e.sentence,
          translation: e.translation,
        })),
        learnedAt: wp.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ error: 'Failed to fetch words' });
  }
});
