/* ============================================================
   ReadTrack — routes/session.js
   POST /api/session/complete
   Validates, sanitizes, and dispatches session data to Telegram.
   ============================================================ */

'use strict';

const express  = require('express');
const multer   = require('multer');
const { sendSessionReport } = require('../telegram');

const router = express.Router();

// ── Multer: store photo in memory (max 8 MB) ─────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG/PNG images are accepted for verification photos.'));
    }
  },
});

// ── Sanitize helpers ─────────────────────────────────────────
function sanitizeString(val, maxLen = 200) {
  if (typeof val !== 'string') return '';
  return val.replace(/[<>]/g, '').trim().slice(0, maxLen);
}

function sanitizeFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// ── POST /api/session/complete ───────────────────────────────
router.post('/complete', upload.single('photo'), async (req, res) => {
  try {
    const body = req.body;

    // Required fields
    const sessionId = sanitizeString(body.sessionId, 50);
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    // Sanitize all fields
    const data = {
      sessionId,
      startTime:  sanitizeString(body.startTime,  50),
      endTime:    sanitizeString(body.endTime,    50),
      duration:   sanitizeString(body.duration,   30),
      durationMs: sanitizeString(body.durationMs, 20),
      latitude:   sanitizeFloat(body.latitude),
      longitude:  sanitizeFloat(body.longitude),
      accuracy:   sanitizeFloat(body.accuracy),
      gpsTimestamp: sanitizeString(body.gpsTimestamp, 30),
      browser:    sanitizeString(body.browser,  100),
      os:         sanitizeString(body.os,       100),
      device:     sanitizeString(body.device,    50),
      cameraOk:   body.cameraOk === 'true',
    };

    // Optional verification photo
    const photoBuffer = req.file ? req.file.buffer : null;

    // Send to Telegram (non-blocking acknowledgement — respond to client fast)
    sendSessionReport(data, photoBuffer).catch(err => {
      console.error('[Telegram] Failed to send session report:', err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Session received.',
      sessionId,
    });

  } catch (err) {
    console.error('[Session Route] Error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
