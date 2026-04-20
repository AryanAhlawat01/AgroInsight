require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Server } = require('socket.io');

const connectDB = require('./config/db');

// ── Route imports ──────────────────────────────────────
const submissionsRouter = require('./routes/submissions');
const statsRouter = require('./routes/stats');
const exportRouter = require('./routes/export');
const authRouter = require('./routes/auth');

// ── Connect to MongoDB ─────────────────────────────────
connectDB();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const configuredOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const devOrigins = [
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? configuredOrigins
  : [...new Set([...configuredOrigins, ...devOrigins])];

function warnProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const warnings = [];
  const jwtSecret = process.env.JWT_SECRET || '';
  const frontendUrl = process.env.FRONTEND_URL || '';
  const corsOrigins = process.env.CORS_ORIGINS || '';

  if (!jwtSecret || jwtSecret.length < 32 || /please_change|replace_with|dev_only/i.test(jwtSecret)) {
    warnings.push('JWT_SECRET looks weak or placeholder. Use a long random value (32+ chars).');
  }

  if (!frontendUrl || /your-|example\.com|localhost/i.test(frontendUrl)) {
    warnings.push('FRONTEND_URL appears unset or placeholder. Set your public app URL.');
  }

  if (!corsOrigins || /your-|example\.com/i.test(corsOrigins)) {
    warnings.push('CORS_ORIGINS appears unset or placeholder. Set real production origins.');
  }

  if (corsOrigins && /localhost|127\.0\.0\.1/i.test(corsOrigins)) {
    warnings.push('CORS_ORIGINS contains localhost in production. Remove local origins if not needed.');
  }

  if (!allowedOrigins.length) {
    warnings.push('No allowed CORS origins configured for production requests.');
  }

  if (warnings.length) {
    console.warn('\n[ENV WARNING] Potential production configuration issues:');
    warnings.forEach((msg) => console.warn('- ' + msg));
    console.warn('');
  }
}

warnProductionEnv();

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Socket CORS: origin ${origin} not allowed`));
      }
    },
  },
});

const onlineSockets = new Set();

io.on('connection', (socket) => {
  onlineSockets.add(socket.id);
  io.emit('online:count', { count: onlineSockets.size });

  socket.on('disconnect', () => {
    onlineSockets.delete(socket.id);
    io.emit('online:count', { count: onlineSockets.size });
  });
});

app.locals.io = io;

// ── Security middlewares ───────────────────────────────
app.use(
  helmet({
    // Allow Chart.js CDN and Google Fonts from frontend
    contentSecurityPolicy: false,
  })
);

// ── CORS ───────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Body parsing ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Logging (disable in test) ──────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Rate limiting ──────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Health check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api',             statsRouter);          // /api/stats, /api/land, /api/irrigation, etc.
app.use('/api/export',      exportRouter);

// ── Serve Frontend (same port as API) ──────────────────
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Catch-all: serve index.html for any non-API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  return res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── 404 for unknown API routes ─────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: `Route ${req.path} not found` });
});

// ── Global error handler ───────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start server ───────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🌾  AgroInsight Backend  🌾             ║
  ║   Running on  http://localhost:${PORT}      ║
  ║   ENV: ${(process.env.NODE_ENV || 'development').padEnd(32)}║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app; // for testing
