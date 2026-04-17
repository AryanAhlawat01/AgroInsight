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

### Permanent local startup

On Windows PowerShell:

```powershell
cd backend
.\start.ps1
```

Or with a custom port:

```powershell
cd backend
.\start.ps1 -Port 3001
```

On Windows CMD:

```cmd
cd backend
start.bat 3000
```

### Permanent background startup with PM2

From the backend folder, install PM2 locally if needed:

```powershell
cd backend
npm install
```

Then start the app in the background:

```powershell
cd backend
npm run pm2:start
```

To stop it:

```powershell
npm run pm2:stop
```

To restart it:

```powershell
npm run pm2:restart
```

### Automatic free deploy with Railway

This repo now includes a GitHub Actions workflow that deploys the backend automatically on every push to `master`.

1. Create a free Railway account: https://railway.app
2. Create or connect a project and copy the project ID.
3. Create a Railway API key.
4. In your GitHub repository, add these secrets:
   - `RAILWAY_API_KEY`
   - `RAILWAY_PROJECT_ID`
5. Push to `master` and GitHub Actions will build and deploy the backend from `agroinsight/backend`.

The workflow file is located at:

- `.github/workflows/deploy.yml`

To check status:

```powershell
npm run pm2:status
```

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

## 🚀 Free Deployment

This project is ready for free Node.js hosting. The app serves the static frontend from `frontend/` through the backend server in `backend/`.

### Recommended free hosts

- Railway: easiest for Node.js + MongoDB free tier
- Render: free web service for static and Node apps

### Deploy with Railway

1. Create a Railway account.
2. Add a new project from GitHub and connect your repo.
3. Set the root directory to `agroinsight/backend`.
4. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
5. Add environment variables:
   - `MONGODB_URI`
   - `PORT` (optional; Railway provides one automatically)
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=*` (or your site URL)
6. Deploy.

### Deploy with Render

1. Create a Render account.
2. Create a new Web Service and connect your GitHub repo.
3. Set the root directory to `agroinsight/backend`.
4. Use these settings:
   - Environment: `Node 18`
   - Build command: `npm install`
   - Start command: `npm start`
5. Add the same environment variables as above.
6. Deploy.

### Notes

- The backend serves `frontend/` automatically, so you do not need a separate frontend service.
- `backend/Procfile` is included for compatibility with services that support Procfile deployment.
- Use MongoDB Atlas free tier for a production-ready database.
