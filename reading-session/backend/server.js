/* ============================================================
   ReadTrack — server.js
   Express server: serves frontend + handles /api routes
   ============================================================ */

'use strict';

require('dotenv').config();

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
const sessionRoute = require('./routes/session');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security headers ─────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
        styleSrc:    ["'self'", "'unsafe-inline'"],
        imgSrc:      ["'self'", 'data:', 'blob:'],
        mediaSrc:    ["'self'", 'blob:'],
        connectSrc:  ["'self'"],
        workerSrc:   ["'self'", 'blob:', 'cdnjs.cloudflare.com'],
        objectSrc:   ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
);

// ── CORS (restrict to same origin in production) ─────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS policy: origin not allowed'));
  },
  methods: ['GET', 'POST'],
}));

// ── Body parsers ─────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── Rate limiting ─────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      30,              // max 30 session submissions per window per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api/', apiLimiter);

// ── API routes ────────────────────────────────────────────────
app.use('/api/session', sessionRoute);

// ── Serve static frontend ─────────────────────────────────────
// The frontend files live one directory up from /backend
const frontendPath = path.resolve(__dirname, '..');

app.use(express.static(frontendPath, {
  maxAge:  process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag:    true,
  index:   'index.html',
}));

// Catch-all: return index.html for any non-API route (SPA support)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found.' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  console.error(`[Error] ${status}: ${err.message}`);
  res.status(status).json({ error: err.message || 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  ReadTrack server running on http://localhost:${PORT}`);
  console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️   TELEGRAM_BOT_TOKEN is not set. Session reports will fail.');
  }
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.warn('⚠️   TELEGRAM_CHAT_ID is not set. Session reports will fail.');
  }
});

module.exports = app;
