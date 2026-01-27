import express from 'express';
import cors from 'cors';
import { env, validateEnv } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { setupBot } from './bot/index.js';
import { categoriesRouter } from './api/routes/categories.js';
import { progressRouter } from './api/routes/progress.js';
import { testRouter } from './api/routes/test.js';
import { settingsRouter } from './api/routes/settings.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { startDailyScheduler } from './jobs/scheduler.js';

async function main() {
  validateEnv();

  const app = express();

  app.use(cors({
    origin: [env.FRONTEND_URL, 'https://web.telegram.org'],
    credentials: true,
  }));
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.use('/api/categories', categoriesRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/test', testRouter);
  app.use('/api/settings', settingsRouter);

  // Error handler
  app.use(errorHandler);

  // Connect to database
  await connectDatabase();

  // Setup Telegram bot
  const bot = setupBot();

  // Start daily lesson scheduler
  startDailyScheduler();

  // Start server
  app.listen(env.API_PORT, () => {
    console.log(`Server running on port ${env.API_PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await bot.stop('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    await bot.stop('SIGTERM');
    process.exit(0);
  });
}

main().catch(console.error);
