import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocketIO } from './sockets';
import { initScheduler } from './services/scheduler';

const PORT = env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  // Initialize Socket.io
  initSocketIO(server);

  // Initialize Scheduler
  initScheduler();

  server.listen(PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: Error) => {
    console.error(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();
