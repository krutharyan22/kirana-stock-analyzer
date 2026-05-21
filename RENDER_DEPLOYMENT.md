# Render Deployment Guide for Kirana Stock Analyzer

## Prerequisites
1. **Render Account**: Sign up at https://render.com (free tier, no expiration!)
2. **GitHub**: Already have repo at https://github.com/krutharyan22/kirana-stock-analyzer

---

## **Backend Deployment (Render)**

### Step 1: Create Web Service on Render
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repo: `krutharyan22/kirana-stock-analyzer`
4. Configure:
   - **Name**: `kirana-stock-analyzer-api`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - **Plan**: Free
5. Click **"Create Web Service"**

### Step 2: Add Environment Variables
Once deployed:
1. Go to your service → **Environment**
2. Add:
   - `OPENAI_API_KEY` = your key (optional)
   - `FRONTEND_URL` = https://your-vercel-domain.vercel.app

### Step 3: Get Your Backend URL
- Dashboard shows: `https://kirana-stock-analyzer-api.onrender.com`
- This is your `VITE_API_BASE_URL` for frontend

---

## **Frontend Deployment (Vercel)**

### Step 1: Deploy on Vercel
1. Go to https://vercel.com/new
2. Import GitHub repo: `krutharyan22/kirana-stock-analyzer`
3. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend/`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/`
4. Click **"Deploy"**

### Step 2: Add Environment Variable
1. Project → **Settings** → **Environment Variables**
2. Add: `VITE_API_BASE_URL` = `https://kirana-stock-analyzer-api.onrender.com`
3. Redeploy

### Step 3: Get Your Frontend URL
- Vercel assigns: `https://kirana-stock-analyzer.vercel.app`

---

## **How It Works**
- **Backend (Render)**: FastAPI runs on free tier, persistent storage for SQLite
- **Frontend (Vercel)**: Static React app, auto-deploys on git push
- **Database**: SQLite on Render's persistent disk

## **Cost**
- **Render**: FREE forever (3 free web services)
- **Vercel**: FREE forever
- **Total**: **$0/month** 🎉

---

## **Troubleshooting**

### Backend not responding?
```
Check Render logs: Dashboard → Service → Logs
```

### Frontend can't reach backend?
- Check browser console for CORS errors
- Verify `VITE_API_BASE_URL` in Vercel matches Render URL
- Render cold starts may take 10-15s on first request

### Database not persisting?
- Render free tier includes persistent disk
- Data survives between deployments

---

## **Next Steps**
1. Create Render account (2 min)
2. Follow Step 1 above to deploy backend (5 min)
3. Copy Render URL, deploy Vercel frontend (5 min)
4. Done! Your site is live 🚀

**Questions?** Check Render docs: https://render.com/docs
