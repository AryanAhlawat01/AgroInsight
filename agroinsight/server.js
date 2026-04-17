// server.js  — AgroInsight API Server
require('dotenv').config();

const http        = require('http');
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const path        = require('path');
const { Server }  = require('socket.io');

const connectDB   = require('./config/db');
const submissions = require('./routes/submissions');
const analytics   = require('./routes/analytics');
const exportRoute = require('./routes/export');
const authRoutes  = require('./routes/auth');
const predictRoute = require('./routes/predict');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected:', socket.id);
  });
});

// ─── Security & Utility Middleware ────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'fonts.googleapis.com', 'unpkg.com'],
        styleSrc:   ["'self'", "'unsafe-inline'", 'fonts.googleapis.com', 'unpkg.com'],
        fontSrc:    ["'self'", 'fonts.gstatic.com'],
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'", 'https://*.tile.openstreetmap.org'],
      },
    },
  })
);

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  methods: ['GET', 'POST', 'DELETE'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ─── Serve Static Frontend ────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/submissions', submissions);
app.use('/api/export',      exportRoute);
app.use('/api/predict',     predictRoute);
app.use('/api',             analytics);  // /api/stats, /api/land, /api/irrigation, etc.

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const { readyState } = require('mongoose').connection;
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    db:     states[readyState],
    uptime: process.uptime().toFixed(1) + 's',
    env:    process.env.NODE_ENV,
  });
});

// ─── Catch-all → serve classic frontend routes ───────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Error Handlers ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🌾 AgroInsight server running on port ${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
