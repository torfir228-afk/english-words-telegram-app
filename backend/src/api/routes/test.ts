import { Router } from 'express';
import { prisma } from '../../config/database.js';
import { telegramAuth } from '../middleware/auth.js';

export const testRouter = Router();

testRouter.use(telegramAuth);

// Generate test (5 questions from latest lesson)
testRouter.get('/generate', async (req, res) => {
  try {
    const userId = req.dbUser!.id;

    // Get words that were sent but not yet tested
    const sentWords = await prisma.userWordProgress.findMany({
      where: {
        userId,
        status: 'SENT',
      },
      include: {
        word: {
          include: {
            examples: true,
          },
        },
      },
      orderBy: { lastSentAt: 'desc' },
      take: 5,
    });

    if (sentWords.length === 0) {
      return res.json({ questions: [], message: 'No words to test' });
    }

    const questions = sentWords.map((wp, index) => {
      const questionType = index % 2 === 0 ? 'fill_blank' : 'translate';

      if (questionType === 'fill_blank' && wp.word.examples.length > 0) {
        const example = wp.word.examples[0];
        const sentence = example.sentence.replace(
          new RegExp(wp.word.english, 'gi'),
          '_____'
        );
        return {
          id: index + 1,
          wordId: wp.word.id,
          type: 'fill_blank',
          question: sentence,
          hint: wp.word.russian,
          correctAnswer: wp.word.english.toLowerCase(),
        };
      } else {
        return {
          id: index + 1,
          wordId: wp.word.id,
          type: 'translate',
          question: wp.word.russian,
          hint: null,
          correctAnswer: wp.word.english.toLowerCase(),
        };
      }
    });

    res.json({ questions });
  } catch (error) {
    console.error('Error generating test:', error);
    res.status(500).json({ error: 'Failed to generate test' });
  }
});

// Submit test answers
testRouter.post('/submit', async (req, res) => {
  try {
    const userId = req.dbUser!.id;
    const { answers } = req.body as {
      answers: Array<{ wordId: number; answer: string }>;
    };

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid answers format' });
    }

    const wordIds = answers.map((a) => a.wordId);
    const words = await prisma.word.findMany({
      where: { id: { in: wordIds } },
    });

    const wordMap = new Map(words.map((w) => [w.id, w]));
    const results: Array<{
      wordId: number;
      correct: boolean;
      userAnswer: string;
      correctAnswer: string;
    }> = [];

    let correctCount = 0;

    for (const answer of answers) {
      const word = wordMap.get(answer.wordId);
      if (!word) continue;

      const isCorrect =
        answer.answer.toLowerCase().trim() === word.english.toLowerCase();

      if (isCorrect) {
        correctCount++;
      }

      results.push({
        wordId: word.id,
        correct: isCorrect,
        userAnswer: answer.answer,
        correctAnswer: word.english,
      });

      // Update word progress
      await prisma.userWordProgress.updateMany({
        where: { userId, wordId: word.id },
        data: {
          status: isCorrect ? 'LEARNED' : 'LEARNING',
          correctCount: isCorrect ? { increment: 1 } : undefined,
          lastTestedAt: new Date(),
        },
      });

      // Update category progress if word is learned
      if (isCorrect) {
        const wordData = await prisma.word.findUnique({
          where: { id: word.id },
          select: { categoryId: true },
        });

        if (wordData) {
          await prisma.userCategoryProgress.updateMany({
            where: { userId, categoryId: wordData.categoryId },
            data: { wordsLearned: { increment: 1 } },
          });
        }
      }
    }

    const percentage =
      answers.length > 0 ? (correctCount / answers.length) * 100 : 0;

    // Save test result
    await prisma.testResult.create({
      data: {
        userId,
        totalQuestions: answers.length,
        correctAnswers: correctCount,
        percentage,
        answers: results,
      },
    });

    res.json({
      totalQuestions: answers.length,
      correctAnswers: correctCount,
      percentage: Math.round(percentage),
      results,
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  }
});
