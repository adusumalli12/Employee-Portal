import express, { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { connectDatabase } from './config/database';
import env from './config/environment';
import { RATE_LIMITS } from './utils/constants';

const app: Express = express();

// Trust proxy for rate limiting (important when behind Nginx/Heroku/Cloudflare)
app.set('trust proxy', 1);

// =======================
// MIDDLEWARE Setup (Order is IMPORTANT)
// =======================

// 1. Body parser (must be FIRST)
app.use(bodyParser.json());
app.use(cookieParser());

// 2. Serve static files from frontend/dist folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 3. CORS
app.use(
  cors({
    origin: env.APP_URL,
    credentials: true,
  })
);

// 4. Rate limiting (global: 100 requests per 15 min per IP)
const limiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_GLOBAL,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// =======================
// Routes
// =======================

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import twilioRoutes from './routes/twilio.routes';
import attendanceRoutes from './routes/attendance.routes';
import performanceRoutes from './routes/performance.routes';
import taskRoutes from './routes/task.routes';
import leaveRoutes from './routes/leave.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

app.use('/auth', authRoutes);
app.use('/employees', employeeRoutes);
app.use('/twilio', twilioRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/performance', performanceRoutes);
app.use('/tasks', taskRoutes);
app.use('/leaves', leaveRoutes);
app.use('/notifications', notificationRoutes);

// =======================
// Basic Health Check Routes
// =======================

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Server is running...',
    timestamp: new Date().toISOString(),
  });
});

// =======================
// SPA Catch-all Middleware
// This handles frontend routing for all non-API paths
// =======================
app.use((req: Request, res: Response, next: NextFunction) => {
  // Only handle GET requests for non-API paths
  if (req.method === 'GET') {
    const apiPrefixes = ['/auth', '/employees', '/twilio', '/attendance', '/performance', '/tasks', '/leaves', '/notifications', '/health', '/assets'];
    const isApiRequest = apiPrefixes.some(prefix => req.path.startsWith(prefix));

    if (!isApiRequest) {
      return res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
  }
  next();
});

// =======================
// 404 Handler (API only)
// =======================
app.use(notFoundHandler);

// =======================
// Global Error Handler
// =======================
app.use(errorHandler);

// =======================
// Start Server
// =======================
async function startServer(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Start listening
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

export default app;
