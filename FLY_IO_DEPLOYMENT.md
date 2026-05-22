# Fly.io Deployment Guide (Free Forever, No Expiration)

## **Why Fly.io?**
✅ **Truly free forever** - No 30-day expiration (unlike Railway)  
✅ **No autopay** - Free tier includes 3 shared machines, 3GB storage  
✅ **Instant startup** - No spindowns (unlike Render)  
✅ **Persistent storage** - SQLite database survives restarts  
✅ **Production-ready** - Used by real companies  

---

## **Cost Breakdown**
- **Free tier:** 3 shared machines, 3GB persistent storage, 160GB bandwidth/month
- **This project fits:** Yes, easily within free tier
- **If you need more:** Pay only what you use ($0.015/hour for extra machine)

---

## **Step 1: Create Fly.io Account**
1. Go to https://fly.io (sign up with email/GitHub)
2. No credit card needed for free tier
3. Download flyctl CLI: https://fly.io/docs/hands-on/install-flyctl/

---

## **Step 2: Install Flyctl CLI**
```bash
# Mac
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (WSL)
curl -L https://fly.io/install.sh | sh
```

---

## **Step 3: Login to Fly.io**
```bash
flyctl auth login
```

---

## **Step 4: Deploy Your App**
From your project root:

```bash
# Initialize Fly.io app
flyctl launch

# When prompted:
# - App name: kirana-stock-analyzer
# - Region: Choose closest (iad for US East, lhr for Europe, etc)
# - Database: No (SQLite is fine)
# - Deploy now: Yes

# Get your URL
flyctl info
# Your backend URL: https://kirana-stock-analyzer.fly.dev
```

---

## **Step 5: Configure Environment Variables (if needed)**
```bash
# Add OpenAI key (optional, for AI chat)
flyctl secrets set OPENAI_API_KEY=your_key_here

# Add frontend URL (optional, for CORS)
flyctl secrets set FRONTEND_URL=https://kirana-stock-analyzer.vercel.app
```

---

## **Step 6: Update Frontend with Backend URL**
In Vercel:
1. Go to **Settings** → **Environment Variables**
2. Update: `VITE_API_BASE_URL` = `https://kirana-stock-analyzer.fly.dev`
3. Redeploy

---

## **Step 7: Verify It Works**
```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Test backend
curl https://kirana-stock-analyzer.fly.dev/api/dashboard
```

---

## **Comparison Table**

| Feature | Render | Railway | Fly.io | Google Cloud |
|---------|--------|---------|--------|--------------|
| **Free forever** | No (expires) | No (30 days) | **Yes** ✅ | No (autopay) |
| **Spindowns** | Yes (15 min) | No | **No** ✅ | No |
| **Cold start** | 30-60s | Fast | **Instant** ✅ | Instant |
| **Persistent DB** | Yes | Yes | **Yes** ✅ | Yes |
| **Billing risk** | Low | Medium | **None** ✅ | High |

---

## **Troubleshooting**

### App won't deploy
```bash
# Check for errors
flyctl logs

# Rebuild and deploy
flyctl deploy --remote-only
```

### Database issues
```bash
# SSH into the machine
flyctl ssh console

# Check database
cd /app/backend
sqlite3 kirana.db ".tables"
```

### Need to update code
```bash
# Just push to GitHub, then:
flyctl deploy --remote-only
```

---

## **Production Tips**

### Scale if needed
```bash
# Increase machine count (if traffic grows)
flyctl scale count 2

# Increase memory (rarely needed)
flyctl scale memory 512
```

### Monitor usage
```bash
flyctl status
flyctl metrics
```

---

## **Costs**
- **Month 1-∞:** $0 (free tier includes everything)
- **If you exceed free tier:** Pay as you go, very cheap ($0.015/hour per machine)

---

## **Next Steps**
1. Go to fly.io, sign up (no card needed)
2. Install flyctl CLI
3. Run: `flyctl launch` from your project root
4. Copy the URL and update Vercel
5. Done! 🚀

**No expiration, no billing surprises, no spindowns - just works forever!**
