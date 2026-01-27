import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { telegramAuth } from '../middleware/auth.js';

export const categoriesRouter = Router();

categoriesRouter.use(telegramAuth);

// Get all categories with user progress
categoriesRouter.get('/', async (req, res) => {
  try {
    const userId = req.dbUser!.id;

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { words: true },
        },
        userProgress: {
          where: { userId },
        },
      },
    });

    const result = categories.map((cat) => {
      const progress = cat.userProgress[0];
      return {
        id: cat.id,
        name: cat.name,
        displayName: cat.displayName,
        iconEmoji: cat.iconEmoji,
        totalWords: cat._count.words,
        isSelected: progress?.isSelected || false,
        wordsLearned: progress?.wordsLearned || 0,
        progressPercent: cat._count.words > 0
          ? Math.round((progress?.wordsLearned || 0) / cat._count.words * 100)
          : 0,
      };
    });

    res.json({ categories: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Toggle category selection
categoriesRouter.put('/:id/toggle', async (req, res) => {
  try {
    const userId = req.dbUser!.id;
    const categoryId = parseInt(req.params.id, 10);

    const progress = await prisma.userCategoryProgress.findUnique({
      where: {
        userId_categoryId: { userId, categoryId },
      },
    });

    if (!progress) {
      return res.status(404).json({ error: 'Category progress not found' });
    }

    const updated = await prisma.userCategoryProgress.update({
      where: { id: progress.id },
      data: { isSelected: !progress.isSelected },
    });

    res.json({ isSelected: updated.isSelected });
  } catch (error) {
    console.error('Error toggling category:', error);
    res.status(500).json({ error: 'Failed to toggle category' });
  }
});
