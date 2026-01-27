import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { telegramAuth } from '../middleware/auth.js';

export const settingsRouter = Router();

settingsRouter.use(telegramAuth);

// Get user settings
settingsRouter.get('/', async (req, res) => {
  try {
    const userId = req.dbUser!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        deliveryHour: true,
        deliveryMinute: true,
        timezone: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const formattedTime = `${String(user.deliveryHour).padStart(2, '0')}:${String(user.deliveryMinute).padStart(2, '0')}`;

    res.json({
      deliveryHour: user.deliveryHour,
      deliveryMinute: user.deliveryMinute,
      timezone: user.timezone,
      isActive: user.isActive,
      formattedTime,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
settingsRouter.put('/', async (req, res) => {
  try {
    const userId = req.dbUser!.id;
    const { deliveryHour, deliveryMinute, timezone } = req.body;

    const updateData: {
      deliveryHour?: number;
      deliveryMinute?: number;
      timezone?: string;
    } = {};

    if (typeof deliveryHour === 'number' && deliveryHour >= 0 && deliveryHour <= 23) {
      updateData.deliveryHour = deliveryHour;
    }

    if (typeof deliveryMinute === 'number' && deliveryMinute >= 0 && deliveryMinute <= 59) {
      updateData.deliveryMinute = deliveryMinute;
    }

    if (typeof timezone === 'string' && timezone.length > 0) {
      updateData.timezone = timezone;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        deliveryHour: true,
        deliveryMinute: true,
        timezone: true,
        isActive: true,
      },
    });

    const formattedTime = `${String(user.deliveryHour).padStart(2, '0')}:${String(user.deliveryMinute).padStart(2, '0')}`;

    res.json({
      ...user,
      formattedTime,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Pause lessons
settingsRouter.post('/pause', async (req, res) => {
  try {
    const userId = req.dbUser!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    res.json({ isActive: false });
  } catch (error) {
    console.error('Error pausing lessons:', error);
    res.status(500).json({ error: 'Failed to pause lessons' });
  }
});

// Resume lessons
settingsRouter.post('/resume', async (req, res) => {
  try {
    const userId = req.dbUser!.id;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    res.json({ isActive: true });
  } catch (error) {
    console.error('Error resuming lessons:', error);
    res.status(500).json({ error: 'Failed to resume lessons' });
  }
});
