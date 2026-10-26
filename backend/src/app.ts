import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { NotFoundError } from './utils/errors';

import authRoutes from './routes/auth.routes';
import adminRoutes from './routes/admin.routes';
import ownerRoutes from './routes/owner.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import reviewRoutes from './routes/review.routes';
import chatRoutes from './routes/chat.routes';
import faqRoutes from './routes/faq.routes';
import aiRoutes from './routes/ai.routes';
import { ensureDb } from './ensureDb';

const app = express();

// Rate limiting
// Behind Vercel/most proxies all traffic shares one IP unless trust proxy is on.
app.set('trust proxy', 1);

// General API limiter — generous enough for normal dashboard polling.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500, // per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter only for credential endpoints (brute-force protection).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'محاولات كثيرة، حاولي بعد دقائق' },
});

// Middlewares
app.use(cors({ origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',') }));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure Mongo is ready (local + Vercel serverless)
app.use(async (_req, _res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/', apiLimiter);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check route
app.get('/api/health', (req, res) => {
  const info = (globalThis as any).__alunaDb;
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    // Safe diagnostics: lets us confirm which database a deployment is bound to.
    db: {
      mode: info?.mode || 'uninitialized',
      host: info?.host || null,
      state: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
    uptime: Math.round(process.uptime()),
  });
});

// Register Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/password-login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/ai', aiRoutes);

// 404 Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use(errorHandler);

export default app;
// redeploy trigger
