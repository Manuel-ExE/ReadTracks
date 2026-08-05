# ReadTrack — Reading Session Website

A production-ready, mobile-first reading session tracker with camera verification,
GPS location capture, a built-in PDF reader, and automatic Telegram reporting.

---

## Features

- Structured reading sessions with live timer (start / pause / resume / end)
- Front-camera verification photo captured at session start
- GPS location captured at session start
- PDF reader powered by PDF.js (open, scroll, zoom in/out)
- Full session report sent to a Telegram bot on completion
- Dark mode (automatic via system preference)
- Fully responsive — Android, iPhone, tablet, desktop

---

## Folder Structure

```
reading-session/
├── index.html               # Single-page frontend (all 6 views)
├── style.css                # Mobile-first styles + dark mode
├── script.js                # Camera, GPS, timer, PDF.js, session logic
├── assets/                  # Static assets (icons, images)
└── backend/
    ├── server.js            # Express server (serves frontend + API)
    ├── telegram.js          # Telegram Bot API integration
    ├── .env.example         # Environment variable template
    ├── package.json         # Node.js dependencies
    └── routes/
        └── session.js       # POST /api/session/complete
```

---

## Quick Start

### 1. Install dependencies

```bash
cd "reading-session/backend"
npm install
```

### 2. Configure environment variables

```bash
copy .env.example .env
```

Open `.env` and fill in your values:

| Variable             | Description                                           |
|----------------------|-------------------------------------------------------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather                        |
| `TELEGRAM_CHAT_ID`   | The chat or channel ID to receive session reports     |
| `PORT`               | Server port (default: `3000`)                         |
| `NODE_ENV`           | `development` or `production`                         |
| `ALLOWED_ORIGINS`    | Comma-separated allowed CORS origins (production)     |

### 3. Start the server

**Development** (auto-reload with nodemon):
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Open your browser at `http://localhost:3000`.

---

## How to Get Your Telegram Credentials

### Bot Token
1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts.
3. Copy the token BotFather provides into `TELEGRAM_BOT_TOKEN` in `.env`.

### Chat ID
1. Add your bot to the target group or channel, or start a direct chat with it.
2. Send any message to that chat.
3. Visit this URL in a browser (replace `<TOKEN>` with your bot token):
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Find `"chat": { "id": ... }` in the JSON response.
5. Copy that number into `TELEGRAM_CHAT_ID` in `.env`.

---

## API Reference

### `POST /api/session/complete`

Accepts `multipart/form-data`.

| Field          | Type   | Required | Description                              |
|----------------|--------|----------|------------------------------------------|
| `sessionId`    | string | Yes      | Unique session identifier                |
| `startTime`    | string | No       | ISO 8601 start timestamp                 |
| `endTime`      | string | No       | ISO 8601 end timestamp                   |
| `duration`     | string | No       | Formatted duration (HH:MM:SS)            |
| `durationMs`   | string | No       | Duration in milliseconds                 |
| `latitude`     | number | No       | GPS latitude                             |
| `longitude`    | number | No       | GPS longitude                            |
| `accuracy`     | number | No       | GPS accuracy in metres                   |
| `browser`      | string | No       | Detected browser name                    |
| `os`           | string | No       | Detected operating system                |
| `device`       | string | No       | Device type (Mobile / Tablet / Desktop)  |
| `cameraOk`     | string | No       | `"true"` if camera verification succeeded|
| `photo`        | file   | No       | JPEG verification photo (max 8 MB)       |

**Success response:**
```json
{ "success": true, "message": "Session received.", "sessionId": "RS-..." }
```

---

## Telegram Message Format

When a session completes, the bot sends a message like this:

```
📚 Reading Session Completed
━━━━━━━━━━━━━━━━━━━━━━━
🆔 Session ID:  RS-M3X7A-K2P9Q
🕐 Start Time:  2026-08-05T14:30:00.000Z
🕑 End Time:    2026-08-05T15:15:42.000Z
⏱️ Duration:    00:45:42
━━━━━━━━━━━━━━━━━━━━━━━
📍 Location:    6.524379, 3.379206
📡 GPS Accuracy: 12.4 m
━━━━━━━━━━━━━━━━━━━━━━━
🌐 Browser:  Google Chrome
💻 OS:       Android
📱 Device:   Mobile
━━━━━━━━━━━━━━━━━━━━━━━
📷 Camera Verification: ✅ Verified
━━━━━━━━━━━━━━━━━━━━━━━
✅ Session Status: COMPLETED
```

If a verification photo was captured, it is attached to the message.

---

## Security Notes

- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` live only in `.env` on the server — never sent to the browser.
- All API inputs are sanitized and validated server-side before use.
- Helmet sets strict HTTP security headers including a Content Security Policy.
- Rate limiting: 30 session submissions per IP per 15 minutes.
- Photo uploads are capped at 8 MB and validated for JPEG/PNG MIME type.
- Use HTTPS in production via a reverse proxy (Nginx, Caddy) or a platform that provides TLS automatically (Railway, Render, Fly.io).

---

## Deployment (Production)

The Express server serves both the frontend static files and the `/api` routes,
so only one process needs to run.

### Option A — Railway / Render / Fly.io

1. Push the `reading-session/` folder to a GitHub repository.
2. Create a new service pointing to the `backend/` directory.
3. Set the environment variables (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NODE_ENV=production`, `ALLOWED_ORIGINS=https://yourdomain.com`).
4. Set the start command to `node server.js`.
5. The platform handles HTTPS automatically.

### Option B — VPS with Nginx

1. Copy the project to your server.
2. Run `npm install --omit=dev` inside `backend/`.
3. Use PM2 to keep the process alive:
   ```bash
   npm install -g pm2
   pm2 start server.js --name readtrack
   pm2 save
   ```
4. Configure Nginx as a reverse proxy and add a Let's Encrypt certificate.

---

## Development Tips

- To test the Telegram integration without a real session, POST to `/api/session/complete` directly using a tool like Postman or curl.
- If the server cannot reach Telegram (firewall, no internet), the frontend still shows a success screen and the session data is saved to `localStorage` as a fallback.
- The `nodemon` dev server auto-restarts on file changes inside `backend/`.

---

## License

MIT
