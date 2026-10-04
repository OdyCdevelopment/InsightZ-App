import { PrismaClient } from '@prisma/client';

// Enable native JSON serialization for BigInt ids used in insightz_products & scrape_runs
(BigInt.prototype as any).toJSON = function () {
  const int = Number(this);
  return int ?? this.toString();
};

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('[MobileBackend] Database connection established successfully.');
  } catch (error) {
    console.error('[MobileBackend] Database connection error:', error);
    process.exit(1);
  }
}
