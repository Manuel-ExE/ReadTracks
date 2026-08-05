/* ============================================================
   ReadTrack — telegram.js
   Sends session reports to a Telegram bot.
   Token and chat ID are loaded from environment variables only.
   ============================================================ */

'use strict';

const fetch    = require('node-fetch');
const FormData = require('form-data');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

const BASE_URL  = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ── Validation ──────────────────────────────────────────────
function validateConfig() {
  if (!BOT_TOKEN || BOT_TOKEN.trim() === '') {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables.');
  }
  if (!CHAT_ID || CHAT_ID.trim() === '') {
    throw new Error('TELEGRAM_CHAT_ID is not set in environment variables.');
  }
}

// ── Format the session message ──────────────────────────────
function buildMessage(data) {
  const {
    sessionId, startTime, endTime, duration,
    latitude, longitude, accuracy,
    browser, os, device, cameraOk,
  } = data;

  const locationLine = (latitude && longitude)
    ? `📍 *Location:* \`${parseFloat(latitude).toFixed(6)}, ${parseFloat(longitude).toFixed(6)}\`\n📡 *GPS Accuracy:* ${accuracy ? parseFloat(accuracy).toFixed(1) + ' m' : 'N/A'}`
    : '📍 *Location:* Unavailable';

  return `📚 *Reading Session Completed*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🆔 *Session ID:* \`${sessionId}\`\n` +
    `🕐 *Start Time:* ${startTime}\n` +
    `🕑 *End Time:*   ${endTime}\n` +
    `⏱️ *Duration:*   ${duration}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${locationLine}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🌐 *Browser:* ${browser}\n` +
    `💻 *OS:*      ${os}\n` +
    `📱 *Device:*  ${device}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📷 *Camera Verification:* ${cameraOk === 'true' || cameraOk === true ? '✅ Verified' : '⚠️ Not captured'}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ *Session Status:* COMPLETED`;
}

// ── Send text message ───────────────────────────────────────
async function sendMessage(text) {
  validateConfig();

  const res = await fetch(`${BASE_URL}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:    CHAT_ID,
      text,
      parse_mode: 'Markdown',
    }),
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram sendMessage failed: ${json.description}`);
  }
  return json;
}

// ── Send photo with caption ─────────────────────────────────
async function sendPhoto(photoBuffer, filename, caption) {
  validateConfig();

  const form = new FormData();
  form.append('chat_id', CHAT_ID);
  form.append('caption', caption);
  form.append('parse_mode', 'Markdown');
  form.append('photo', photoBuffer, {
    filename:    filename || 'verification.jpg',
    contentType: 'image/jpeg',
  });

  const res = await fetch(`${BASE_URL}/sendPhoto`, {
    method: 'POST',
    body:   form,
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(`Telegram sendPhoto failed: ${json.description}`);
  }
  return json;
}

// ── Main export: send full session report ───────────────────
async function sendSessionReport(data, photoBuffer) {
  const message = buildMessage(data);

  if (photoBuffer && photoBuffer.length > 0) {
    // Send photo with session report as caption
    await sendPhoto(photoBuffer, `verify-${data.sessionId}.jpg`, message);
  } else {
    // Send text-only report
    await sendMessage(message);
  }
}

module.exports = { sendSessionReport };
