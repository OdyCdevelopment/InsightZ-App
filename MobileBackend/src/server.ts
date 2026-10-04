import app from './app.js';
import { env } from './config/env.js';
import { connectDB, prisma } from './db.js';

async function bootstrap() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`
=====================================================
  🚀 InsightZ Mobile & Customer Backend Online!
  📡 Port: ${env.PORT}
  🌍 Health: http://localhost:${env.PORT}/api/health
  📚 Base API: http://localhost:${env.PORT}/api/v1
  📖 Swagger UI: http://localhost:${env.PORT}/api-docs
  📊 Environment: ${env.NODE_ENV}
=====================================================
    `);
  });

  const shutdown = async () => {
    console.log('\nShutting down Mobile Backend gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Mobile Backend closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
