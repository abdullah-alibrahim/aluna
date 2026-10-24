import http from 'http';
import app from './app';
import { env } from './config/env';
import { ensureDb } from './ensureDb';
import { initSocketIO } from './sockets';
import { initScheduler } from './services/scheduler';

const PORT = env.PORT || 5000;

const startServer = async () => {
  await ensureDb();

  const server = http.createServer(app);

  // Socket.io + cron need a long-lived process (not Vercel serverless)
  if (!process.env.VERCEL) {
    initSocketIO(server);
    initScheduler();
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });

  process.on('unhandledRejection', (err: Error) => {
    console.error(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

// Local / Render / Docker: start the HTTP server.
// On Vercel, the platform imports the Express app export instead.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
