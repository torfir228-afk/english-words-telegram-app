import { Markup } from 'telegraf';
import { env } from '../../config/env.js';

interface WordWithExamples {
  english: string;
  russian: string;
  examples: Array<{
    sentence: string;
    translation: string | null;
  }>;
}

export function formatDailyLesson(words: WordWithExamples[]): string {
  let message = `📚 Ваш ежедневный урок английского\n\n`;

  words.forEach((word, index) => {
    message += `${index + 1}. 🔤 **${word.english}**\n`;
    message += `   🇷🇺 ${word.russian}\n`;

    word.examples.forEach((example) => {
      message += `   📝 "${example.sentence}"\n`;
      if (example.translation) {
        message += `      (${example.translation})\n`;
      }
    });

    message += '\n';
  });

  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `Готовы проверить знания? 🎯`;

  return message;
}

export function getLessonKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('🎯 Пройти тест', `${env.FRONTEND_URL}/test`)],
    [Markup.button.webApp('📊 Мой прогресс', `${env.FRONTEND_URL}`)],
  ]);
}
