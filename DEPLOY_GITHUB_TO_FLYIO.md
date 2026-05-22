# Deploy to Fly.io from GitHub (Step-by-Step)

## **Environment Variables & Config**

### **Fly.toml Configuration** ✅ ALREADY SET UP
Your `fly.toml` has:
- **App name:** `kirana-stock-analyzer`
- **Region:** `iad` (US East - Washington DC)
- **Working directory:** `/app/backend` (via Dockerfile)
- **Port:** 8000
- **Database:** Persistent storage at `/app/backend/kirana_db`

### **Environment Variables Setup**

**Option 1: In fly.toml (permanent)**
```toml
[env]
  PYTHONUNBUFFERED = "true"
  OPENAI_API_KEY = "your_key_here"
  FRONTEND_URL = "https://kirana-stock-analyzer.vercel.app"
```

**Option 2: Via CLI (secure, hidden)**
```bash
flyctl secrets set OPENAI_API_KEY=your_key_here
flyctl secrets set FRONTEND_URL=https://kirana-stock-analyzer.vercel.app
```

**Option 3: In Fly.io Dashboard (UI)**
- Go to dashboard.fly.io
- Select your app
- Click Variables
- Add keys and values

---

## **Step-by-Step Deployment from GitHub**

### **1. Sign Up for Fly.io**
- Go to https://fly.io
- Sign up with GitHub (easier for auto-deploys)
- No credit card needed

### **2. Install Flyctl CLI**
```bash
brew install flyctl  # Mac
# OR
curl -L https://fly.io/install.sh | sh  # Linux/WSL
```

### **3. Authenticate**
```bash
flyctl auth login
```

### **4. Deploy from Your Local Machine**
```bash
# From your project root (where fly.toml is)
cd "/Users/aryan/Documents/kirana stock analyzer copy"

flyctl launch
```

When prompted:
- **App name:** Leave as `kirana-stock-analyzer`
- **Region:** Choose `iad` (or closest to you)
- **Database:** No
- **Deploy now:** Yes

### **5. Get Your Backend URL**
```bash
flyctl info

# Look for "Hostname:" - will be:
# https://kirana-stock-analyzer.fly.dev
```

---

## **Update Vercel with New Backend URL**

### **Steps:**
1. Go to https://vercel.com/dashboard
2. Click your `kirana-stock-analyzer` project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_BASE_URL`
5. Change value to: `https://kirana-stock-analyzer.fly.dev`
6. Click **Save**
7. Go to **Deployments** tab
8. Click **Redeploy** on the latest deployment

**Done!** Frontend now points to Fly.io backend ✅

---

## **Remove Old Render Backend (Optional)**

If you want to stop the Render service:

### **Option A: Via Render Dashboard**
1. Go to https://dashboard.render.com
2. Click `kirana-stock-analyzer-api`
3. Click **Settings** (gear icon)
4. Scroll to bottom → Click **Delete Service**
5. Confirm

### **Option B: Keep It (Backup)**
Leave it running for 30 days as backup (free tier expires after 30 days anyway)

---

## **Verify Everything Works**

### **Test Backend URL**
```bash
curl https://kirana-stock-analyzer.fly.dev/health
# Should return: {"status":"ok","service":"kirana-api"}
```

### **Test from Frontend**
- Go to https://kirana-stock-analyzer.vercel.app
- Should load without "Connection Error"
- Click "Get Demo Excel Log"
- Try uploading a file

---

## **Environment Variables Summary**

| Variable | Value | Where |
|----------|-------|-------|
| `OPENAI_API_KEY` | Your API key (optional) | fly.toml or `flyctl secrets` |
| `FRONTEND_URL` | `https://kirana-stock-analyzer.vercel.app` | fly.toml or `flyctl secrets` |
| `VITE_API_BASE_URL` | `https://kirana-stock-analyzer.fly.dev` | Vercel dashboard |

---

## **Quick Reference**

```bash
# Deploy
flyctl launch

# View info
flyctl info

# See logs
flyctl logs

# Set environment variable
flyctl secrets set KEY=VALUE

# View all variables
flyctl secrets list

# Redeploy
flyctl deploy

# Check status
flyctl status
```

---

## **Done!**
- ✅ Backend on Fly.io (free forever, no spindowns)
- ✅ Frontend on Vercel (free, auto-deploys)
- ✅ Connected via environment variables
- ✅ No autopay risks
- ✅ Production ready!
