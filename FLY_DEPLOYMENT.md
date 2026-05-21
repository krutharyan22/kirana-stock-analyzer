# Fly.io Deployment Guide for Kirana Stock Analyzer

## Prerequisites
1. **Fly.io Account**: Sign up at https://fly.io (free tier available)
2. **Fly CLI**: Install from https://fly.io/docs/getting-started/installing-flyctl/

## Backend Deployment (Fly.io)

### Step 1: Prepare Backend
```bash
# From project root
cd backend

# Create runtime.txt for Python version
echo "python-3.11.8" > runtime.txt

# Create Procfile for Fly.io
echo "web: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" > Procfile

cd ..
```

### Step 2: Deploy to Fly.io
```bash
# Login to Fly.io
flyctl auth login

# Launch app (interactive - will create app)
flyctl launch --name kirana-stock-analyzer-api

# Choose region (IAD for US, closest to frontend)
# Say "yes" to create Postgres database (optional, for persistence)
# Say "no" to copy existing fly.toml (we have one)

# Deploy
flyctl deploy
```

### Step 3: Set Environment Variables
```bash
flyctl secrets set OPENAI_API_KEY=your_key_here
flyctl secrets set FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### Step 4: Get Your API URL
```bash
flyctl info
# Your API URL will be: https://kirana-stock-analyzer-api.fly.dev
```

---

## Frontend Deployment (Vercel)

### Step 1: On Vercel Dashboard
- Go to https://vercel.com
- Import your GitHub repo: `krutharyan22/kirana-stock-analyzer`
- Root directory: `frontend/`
- Build command: `npm run build`
- Output directory: `dist/`

### Step 2: Add Environment Variable
- In Vercel project settings → Environment Variables
- Add: `VITE_API_BASE_URL = https://kirana-stock-analyzer-api.fly.dev`
- Redeploy

---

## How It Works
- **Backend**: Runs on Fly.io, auto-scales, has persistent storage
- **Frontend**: Deployed on Vercel (static React app)
- **Database**: SQLite stored in Fly.io's mounted volume (persists between restarts)

## Cost
- **Fly.io**: Free tier (3 shared machines, 3GB storage included)
- **Vercel**: Free tier
- **Total**: $0/month forever! 🎉

## Troubleshooting
If you hit rate limits or need more resources:
```bash
flyctl scale count 1 2  # Scale to 2 machines
flyctl scale memory 512  # Increase RAM to 512MB (costs extra but minimal)
```

Check logs:
```bash
flyctl logs
```
