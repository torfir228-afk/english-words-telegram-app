import { Request, Response, NextFunction } from 'express';
import { validate, parse } from '@telegram-apps/init-data-node';
import { env } from '../../config/env.js';
import { prisma } from '../../config/database.js';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
      dbUser?: {
        id: number;
        telegramId: bigint;
      };
    }
  }
}

export async function telegramAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('tma ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const initDataRaw = authHeader.replace('tma ', '');

    try {
      validate(initDataRaw, env.BOT_TOKEN, { expiresIn: 3600 });
    } catch (error) {
      return res.status(401).json({ error: 'Invalid init data' });
    }

    const initData = parse(initDataRaw);

    if (!initData.user) {
      return res.status(401).json({ error: 'No user in init data' });
    }

    req.telegramUser = {
      id: initData.user.id,
      firstName: initData.user.firstName,
      lastName: initData.user.lastName,
      username: initData.user.username,
      languageCode: initData.user.languageCode,
    };

    // Find or create user in database
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(initData.user.id) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(initData.user.id),
          username: initData.user.username,
          firstName: initData.user.firstName,
          lastName: initData.user.lastName,
          languageCode: initData.user.languageCode || 'ru',
        },
      });

      // Initialize category progress for new users
      const categories = await prisma.category.findMany();
      await prisma.userCategoryProgress.createMany({
        data: categories.map((cat) => ({
          userId: user!.id,
          categoryId: cat.id,
          isSelected: false,
          wordsLearned: 0,
        })),
      });
    }

    req.dbUser = {
      id: user.id,
      telegramId: user.telegramId,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}
