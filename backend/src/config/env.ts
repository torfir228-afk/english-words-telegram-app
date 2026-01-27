import 'dotenv/config';

export const env = {
  BOT_TOKEN: process.env.BOT_TOKEN!,
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  API_PORT: parseInt(process.env.API_PORT || '3001', 10),
  API_URL: process.env.API_URL || 'http://localhost:3001',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export function validateEnv() {
  const required = ['BOT_TOKEN', 'DATABASE_URL'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
