import express, { Express, Request, Response, NextFunction } from 'express';
import dns from 'dns';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Force IPv4 for all network connections (Fixes ENETUNREACH on platforms like Render)
dns.setDefaultResultOrder('ipv4first');
import { createServer } from 'http';

import { connectDatabase } from './config/database';
import env from './config/environment';
import { RATE_LIMITS } from './utils/constants';
import { initSocket } from './utils/socket';

const app: Express = express();
const server = createServer(app);

// Initialize Socket.io
const io = initSocket(server);

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
import adminRoutes from './routes/admin.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

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
    const isApiRequest = req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/assets');

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
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`📍 Environment: ${env.NODE_ENV}`);
      console.log(`🔌 WebSockets initialized`);
    });

    server.on('error', (e: any) => {
      if (e.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.error(`💡 Suggestion: Run "npx kill-port ${PORT}" or close other terminal windows.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', e);
      }
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
