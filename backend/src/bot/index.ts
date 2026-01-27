import { Telegraf, Markup } from 'telegraf';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';

// Check if URL is HTTPS (required for Mini App)
const isHttps = env.FRONTEND_URL.startsWith('https://');

export function setupBot() {
  const bot = new Telegraf(env.BOT_TOKEN);

  // /start command
  bot.command('start', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId,
          username: ctx.from.username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
          languageCode: ctx.from.language_code || 'ru',
        },
      });

      // Initialize category progress
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

    // Get user's categories for display
    const userCategories = await prisma.userCategoryProgress.findMany({
      where: { userId: user.id },
      include: { category: true },
    });

    const categoriesText = userCategories.map(uc =>
      `${uc.category.iconEmoji} ${uc.category.displayName}: ${uc.isSelected ? '✅' : '❌'}`
    ).join('\n');

    if (isHttps) {
      // Production mode with Mini App
      await ctx.reply(
        `Привет, ${ctx.from.first_name}! 👋\n\n` +
        `Добро пожаловать в приложение для изучения английских слов!\n\n` +
        `📚 Каждый день вы будете получать 5 новых слов с переводом и примерами.\n\n` +
        `🎯 После изучения слов можно пройти тест для закрепления.\n\n` +
        `Выберите категории для изучения в приложении:`,
        Markup.inlineKeyboard([
          [Markup.button.webApp('📖 Открыть приложение', env.FRONTEND_URL)],
          [Markup.button.callback('⚙️ Настройки', 'settings')],
        ])
      );
    } else {
      // Dev mode without Mini App (HTTPS required)
      await ctx.reply(
        `Привет, ${ctx.from.first_name}! 👋\n\n` +
        `Добро пожаловать в приложение для изучения английских слов!\n\n` +
        `📚 Доступные категории:\n${categoriesText}\n\n` +
        `Используйте команды:\n` +
        `/categories - выбрать категории\n` +
        `/lesson - получить урок сейчас\n` +
        `/settings - настройки\n\n` +
        `⚠️ Mini App недоступен (нужен HTTPS)`
      );
    }
  });

  // /categories command - toggle categories
  bot.command('categories', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await ctx.reply('Сначала нажмите /start');
      return;
    }

    const categories = await prisma.userCategoryProgress.findMany({
      where: { userId: user.id },
      include: { category: true },
    });

    const buttons = categories.map(uc => [
      Markup.button.callback(
        `${uc.category.iconEmoji} ${uc.category.displayName} ${uc.isSelected ? '✅' : '❌'}`,
        `toggle_cat_${uc.categoryId}`
      )
    ]);

    await ctx.reply(
      '📚 Выберите категории для изучения:\n(нажмите чтобы включить/выключить)',
      Markup.inlineKeyboard(buttons)
    );
  });

  // Toggle category callback
  bot.action(/toggle_cat_(\d+)/, async (ctx) => {
    const categoryId = parseInt(ctx.match[1]);
    const telegramId = BigInt(ctx.from!.id);

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return;

    const progress = await prisma.userCategoryProgress.findUnique({
      where: { userId_categoryId: { userId: user.id, categoryId } },
    });

    if (progress) {
      await prisma.userCategoryProgress.update({
        where: { id: progress.id },
        data: { isSelected: !progress.isSelected },
      });
    }

    // Refresh the buttons
    const categories = await prisma.userCategoryProgress.findMany({
      where: { userId: user.id },
      include: { category: true },
    });

    const buttons = categories.map(uc => [
      Markup.button.callback(
        `${uc.category.iconEmoji} ${uc.category.displayName} ${uc.isSelected ? '✅' : '❌'}`,
        `toggle_cat_${uc.categoryId}`
      )
    ]);

    await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
    await ctx.answerCbQuery(progress?.isSelected ? 'Выключено' : 'Включено ✅');
  });

  // /lesson command - send lesson now
  bot.command('lesson', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await ctx.reply('Сначала нажмите /start');
      return;
    }

    // Check if user has selected categories
    const selectedCategories = await prisma.userCategoryProgress.findMany({
      where: { userId: user.id, isSelected: true },
    });

    if (selectedCategories.length === 0) {
      await ctx.reply('❌ Сначала выберите категории: /categories');
      return;
    }

    // Get new words
    const categoryIds = selectedCategories.map(c => c.categoryId);
    const words = await prisma.word.findMany({
      where: {
        categoryId: { in: categoryIds },
        NOT: {
          userProgress: {
            some: {
              userId: user.id,
              status: { in: ['SENT', 'LEARNING', 'LEARNED'] },
            },
          },
        },
      },
      include: { examples: true },
      take: 5,
    });

    if (words.length === 0) {
      await ctx.reply('🎉 Поздравляем! Вы изучили все слова в выбранных категориях!');
      return;
    }

    // Mark words as sent
    for (const word of words) {
      await prisma.userWordProgress.upsert({
        where: { userId_wordId: { userId: user.id, wordId: word.id } },
        update: { status: 'SENT', sentCount: { increment: 1 }, lastSentAt: new Date() },
        create: { userId: user.id, wordId: word.id, status: 'SENT', sentCount: 1, lastSentAt: new Date() },
      });
    }

    // Format lesson message
    let message = `📚 Ваш урок английского\n\n`;
    words.forEach((word, i) => {
      message += `${i + 1}. *${word.english}* — ${word.russian}\n`;
      if (word.examples[0]) {
        message += `   _"${word.examples[0].sentence}"_\n`;
      }
      message += '\n';
    });

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // Settings callback
  bot.action('settings', async (ctx) => {
    const telegramId = BigInt(ctx.from!.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await ctx.answerCbQuery('Пользователь не найден');
      return;
    }

    const time = `${String(user.deliveryHour).padStart(2, '0')}:${String(user.deliveryMinute).padStart(2, '0')}`;

    if (isHttps) {
      await ctx.editMessageText(
        `⚙️ Настройки\n\n` +
        `⏰ Время доставки уроков: ${time}\n` +
        `🌍 Часовой пояс: ${user.timezone}\n` +
        `📬 Уроки: ${user.isActive ? 'Включены ✅' : 'Приостановлены ⏸️'}`,
        Markup.inlineKeyboard([
          [Markup.button.webApp('📖 Открыть настройки', `${env.FRONTEND_URL}/settings`)],
          [Markup.button.callback('◀️ Назад', 'back_to_main')],
        ])
      );
    } else {
      await ctx.editMessageText(
        `⚙️ Настройки\n\n` +
        `⏰ Время доставки уроков: ${time}\n` +
        `🌍 Часовой пояс: ${user.timezone}\n` +
        `📬 Уроки: ${user.isActive ? 'Включены ✅' : 'Приостановлены ⏸️'}`,
        Markup.inlineKeyboard([
          [Markup.button.callback('◀️ Назад', 'back_to_main')],
        ])
      );
    }

    await ctx.answerCbQuery();
  });

  // Back to main
  bot.action('back_to_main', async (ctx) => {
    if (isHttps) {
      await ctx.editMessageText(
        `📚 Изучение английских слов\n\nВыберите действие:`,
        Markup.inlineKeyboard([
          [Markup.button.webApp('📖 Открыть приложение', env.FRONTEND_URL)],
          [Markup.button.callback('⚙️ Настройки', 'settings')],
        ])
      );
    } else {
      await ctx.editMessageText(
        `📚 Изучение английских слов\n\nКоманды:\n/categories - категории\n/lesson - получить урок\n/settings - настройки`
      );
    }
    await ctx.answerCbQuery();
  });

  // /settings command
  bot.command('settings', async (ctx) => {
    const telegramId = BigInt(ctx.from.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      await ctx.reply('Пожалуйста, сначала нажмите /start');
      return;
    }

    const time = `${String(user.deliveryHour).padStart(2, '0')}:${String(user.deliveryMinute).padStart(2, '0')}`;

    await ctx.reply(
      `⚙️ Настройки\n\n` +
      `⏰ Время доставки уроков: ${time}\n` +
      `🌍 Часовой пояс: ${user.timezone}\n` +
      `📬 Уроки: ${user.isActive ? 'Включены ✅' : 'Приостановлены ⏸️'}`
    );
  });

  // Start polling
  bot.launch();
  console.log('Bot started');

  return bot;
}
