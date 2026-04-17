# 🌾 AgroInsight — National Agricultural Assessment Platform

A full-stack Node.js + MongoDB web application for collecting and visualising agricultural data across India.

---

## 📁 Project Structure

```
agroinsight/
├── backend/                  ← Node.js API server + backend packages
│   ├── server.js             ← Express entry point
│   ├── package.json
│   ├── package-lock.json
│   ├── .env.example          ← Copy to .env and fill in values
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── scripts/
│
├── frontend/                 ← Static frontend assets served by backend
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── my-submissions.html
│   ├── css/
│   └── js/
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start (Local)

### 1. Prerequisites
- Node.js ≥ 18
- MongoDB running locally **or** a MongoDB Atlas account

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI at minimum
```

### 4. Seed sample data (optional)
```bash
cd backend
npm run seed
```

### 5. Start development server
```bash
cd backend
npm run dev        # uses nodemon for auto-restart
# or
npm start          # plain node
```

Open `http://localhost:3000` — the frontend and API are served together.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | List submissions (paginated, searchable) |
| POST | `/api/submissions` | Create a new submission |
| GET | `/api/submissions/:id` | Get single submission |
| DELETE | `/api/submissions/:id` | Delete a submission |
| GET | `/api/stats` | Dashboard KPIs |
| GET | `/api/land` | Land size breakdown |
| GET | `/api/irrigation` | Irrigation source breakdown |
| GET | `/api/cropping` | Crop distribution by season |
| GET | `/api/wells` | Well depth trend |
| GET | `/api/export?format=csv` | Export all data as CSV |
| GET | `/api/export?format=json` | Export all data as JSON |
| GET | `/health` | Server + DB health check |

### Query params
- `/api/submissions?page=1&limit=15&search=Punjab&state=Punjab&region=north`
- `/api/land?region=south`
- `/api/export?format=csv&state=Punjab`

---

## ☁️ Deployment

### Option A — Railway (recommended, free tier)
1. Push to GitHub
2. Go to [railway.app](https://railway.app), create a project
3. Add a **MongoDB** plugin (or use Atlas)
4. Set env vars: `MONGODB_URI`, `NODE_ENV=production`, `PORT=3000`
5. Deploy — Railway auto-detects Node.js

### Option B — Render
1. Create a new **Web Service**, connect your repo
2. Build command: `npm install`
3. Start command: `npm start`
4. Add env vars in the Render dashboard

### Option C — VPS / Ubuntu
```bash
# Install Node 20 + PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone + configure
git clone <your-repo>
cd agroinsight
npm install --production
cp .env.example .env   # fill in MONGODB_URI etc.

# Start with PM2 (restarts on crash, survives reboots)
pm2 start server.js --name agroinsight
pm2 save
pm2 startup
```

### MongoDB Atlas (Cloud DB)
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user
3. Whitelist your server IP (or `0.0.0.0/0` for open access)
4. Copy the **connection string** and paste into `MONGODB_URI` in `.env`

---

## 🔒 Security Features
- `helmet` — sets HTTP security headers
- `cors` — configurable origin whitelist
- `express-rate-limit` — 200 req/15 min per IP on all `/api/` routes
- `express.json({ limit: '10kb' })` — prevents large payload attacks
- Mongoose enum validation on all categorical fields
- `.env` never committed (`.gitignore`)

---

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | `production` disables stack traces |
| `MONGODB_URI` | — | **Required.** MongoDB connection string |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `200` | Max requests per window |
