# 🌾 AgroInsight — National Agricultural Assessment Platform

A full-stack web application for collecting, visualizing, and analyzing agricultural data across India's states and districts.

---

## 📁 Project Structure

```
agroinsight/
├── frontend/               # Static HTML/CSS/JS frontend
│   └── index.html          # Main page (charts, forms, map)
│
├── backend/                # Node.js + Express + MongoDB API
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── models/
│   │   └── Submission.js   # Mongoose schema
│   ├── routes/
│   │   ├── submissions.js  # CRUD for agricultural records
│   │   ├── stats.js        # Analytics aggregations
│   │   └── export.js       # CSV / JSON export
│   ├── middleware/
│   │   └── validate.js     # Joi request validation
│   ├── server.js           # Express app entry point
│   ├── .env.example        # Template for environment variables
│   └── package.json
│
├── render.yaml             # One-click Render.com deployment
├── .gitignore
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB installed locally **OR** MongoDB Atlas account (free)
- MongoDB Compass (GUI) — [Download here](https://www.mongodb.com/try/download/compass)

---

### Step 1 — Clone and install dependencies

```bash
git clone https://github.com/YOUR_USERNAME/agroinsight.git
cd agroinsight/backend
npm install
```

---

### Step 2 — Configure environment variables

```bash
# In the backend/ folder (macOS/Linux):
cp .env.example .env

# In the backend/ folder (Windows PowerShell):
Copy-Item .env.example .env
```

Open `.env` and set:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=please_change_this_secret
MONGODB_URI=mongodb://localhost:27017/agroinsight
FRONTEND_URL=http://localhost:5500
CORS_ORIGINS=http://localhost:5000,http://127.0.0.1:5000
ALLOW_RESET_TOKEN_RESPONSE=true
```

> ⚠️ **Never commit `.env` to GitHub.** It's in `.gitignore`.

---

### Step 3 — Connect MongoDB Compass (local)

1. Open **MongoDB Compass**
2. Click **"New Connection"**
3. Enter connection string:
   ```
   mongodb://localhost:27017
   ```
4. Click **Connect**
5. You'll see the `agroinsight` database appear automatically once the backend runs and a record is saved

> 💡 You can browse collections, run queries, and view/edit documents directly in Compass.

---

### Step 4 — Start the backend

```bash
# In backend/ folder:
npm run dev        # development (auto-restarts on file changes)
# OR
npm start          # production mode
```

You should see:
```
✅ MongoDB Connected: localhost
📦 Database: agroinsight
🌾 AgroInsight Backend running on http://localhost:5000
```

---

### Step 5 — Open the frontend

Open `frontend/index.html` in your browser. You can use:
- **VS Code Live Server** (recommended) → right-click `index.html` → "Open with Live Server"
- Or simply double-click `index.html`

The frontend auto-connects to `http://localhost:5000/api`.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/submissions` | Submit a new record |
| `GET` | `/api/submissions` | List records (paginated) |
| `PUT` | `/api/submissions/:id` | Update your record |
| `DELETE` | `/api/submissions/:id` | Delete a record |
| `GET` | `/api/stats` | KPI summary (totals, averages) |
| `GET` | `/api/land` | Land holding distribution |
| `GET` | `/api/irrigation` | Irrigation source breakdown |
| `GET` | `/api/cropping` | Crop data by season |
| `GET` | `/api/wells` | Well depth trends |
| `GET` | `/api/export?format=csv` | Download CSV export |
| `GET` | `/api/export?format=json` | Download JSON export |

**Query parameters for `/api/submissions`:**
- `?page=1&limit=15` — pagination
- `?search=Punjab` — filter by state/district/crop
- `?state=Punjab` — filter by state

---

## ☁️ Free Cloud Deployment

### Option A — Render.com (Recommended, fully free)

**Single Web Service (backend + frontend on one port):**

1. Push your project to GitHub
2. Go to [render.com](https://render.com) → Sign up (free)
3. New → **Web Service** → Connect GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**
5. Add environment variables in Render dashboard:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = long random secret
   - `MONGODB_URI` = your Atlas URI (see below)
   - `FRONTEND_URL` = your web service URL (for example `https://your-backend-service.onrender.com`)
   - `CORS_ORIGINS` = your web service URL (comma-separated if multiple domains)
   - `ALLOW_RESET_TOKEN_RESPONSE` = `false`

> This project serves frontend static files directly from Express, so you do not need a separate static-site deployment.

### Production Deployment Checklist (Render)

Use this checklist when you are ready to deploy to production.

1. Push latest code to GitHub.
2. In Render, create a Web Service from this repo.
3. Set these service values:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`
4. Add environment variables in Render dashboard using the keys below.
5. Deploy and verify `/api/health` returns `success: true`.

Exact environment variable keys and value format:

| Key | Value to set |
|-----|--------------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `JWT_SECRET` | Long random secret (at least 32 chars) |
| `MONGODB_URI` | Atlas URI, e.g. `mongodb+srv://user:pass@cluster.mongodb.net/agroinsight?retryWrites=true&w=majority` |
| `FRONTEND_URL` | Your Render service URL, e.g. `https://agroinsight-backend.onrender.com` |
| `CORS_ORIGINS` | Same URL as above (or comma-separated list if multiple) |
| `ALLOW_RESET_TOKEN_RESPONSE` | `false` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `100` |

Generate a secure JWT secret locally:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Post-deploy verification:

```bash
curl https://YOUR_RENDER_SERVICE.onrender.com/api/health
```

Expected shape:

```json
{"success":true,"status":"online"}
```

---

### Option B — MongoDB Atlas (Free cloud database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up free
2. Create a **Free Tier cluster** (M0 — 512 MB)
3. Create a database user (username + password)
4. Whitelist IP: `0.0.0.0/0` (allow all — needed for Render)
5. Click **Connect** → **Drivers** → copy the URI:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/agroinsight?retryWrites=true&w=majority
   ```
6. Paste this as `MONGODB_URI` in your Render environment variables

> ✅ **You can use MongoDB Compass to connect to Atlas too!**  
> Just paste the same Atlas URI into Compass → Connect.

---

## 🔌 MongoDB Compass Tips

After connecting, you'll see these collections in `agroinsight` database:

| Collection | Description |
|------------|-------------|
| `submissions` | All agricultural records submitted via the form |

Useful things to do in Compass:
- **Filter**: `{ state: "Punjab" }` to view Punjab records
- **Sort**: by `createdAt` descending for latest entries
- **Export**: Compass can export to CSV/JSON directly
- **Aggregation**: Use the Aggregations tab to run the same queries as the API

---

## 🚀 GitHub Setup

```bash
# Initialize git (from project root)
git init
git add .
git commit -m "Initial commit: AgroInsight full-stack app"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/agroinsight.git
git branch -M main
git push -u origin main
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB (local or Atlas) |
| ODM | Mongoose |
| Validation | Joi |
| Security | Helmet, CORS, express-rate-limit |
| Deployment | Render.com (free), MongoDB Atlas (free) |

---

## 📄 License

MIT — free to use, modify, and distribute.
