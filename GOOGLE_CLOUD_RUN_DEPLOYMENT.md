# Google Cloud Run Deployment Guide

## **Why Google Cloud Run?**
✅ **Free forever** (2M requests/month included)  
✅ **No spindown** - Always available instantly  
✅ **Fast startup** - Seconds, not minutes  
✅ **Scales automatically** - Pay only for what you use  
✅ **Simple deployment** - Push code, it deploys  

---

## **Step 1: Create Google Cloud Account**
1. Go to https://cloud.google.com/run
2. Click **"Get Started for Free"**
3. Create account (you get $300 free credits)
4. Set up billing (required, but won't charge for free tier)

---

## **Step 2: Install Google Cloud CLI**
```bash
# Mac/Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

---

## **Step 3: Create Dockerfile**
Already created at root: `Dockerfile` (configure for your project)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

---

## **Step 4: Deploy to Cloud Run**
```bash
# Login to Google Cloud
gcloud auth login

# Set project ID (get from Google Cloud Console)
gcloud config set project YOUR_PROJECT_ID

# Deploy
gcloud run deploy kirana-stock-analyzer \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your_key_here

# You'll get a URL like: https://kirana-stock-analyzer-xxxxx.a.run.app
```

---

## **Step 5: Update Frontend with New URL**
In Vercel:
1. Go to **Settings** → **Environment Variables**
2. Update: `VITE_API_BASE_URL` = your Cloud Run URL
3. Redeploy

---

## **Step 6: Update Backend CORS**
Update [backend/app/main.py](backend/app/main.py) with your Vercel URL (already set for `*.vercel.app` so should work)

---

## **Advantages Over Render**
| Feature | Render | Cloud Run |
|---------|--------|-----------|
| Spindown | Yes (15 min) | No |
| Cold start | 30-60s | 5-10s |
| Free quota | Limited | 2M requests/month |
| Always on | No | Yes |
| Instant response | No | Yes |

---

## **Cost**
- **Free tier:** 2,000,000 requests/month, 360,000 GB-seconds
- **Beyond free tier:** $0.40 per 1M requests (very cheap)
- **For this project:** Fits comfortably in free tier

---

## **Troubleshooting**

### Service won't deploy
```bash
# Check logs
gcloud run logs read kirana-stock-analyzer

# Rebuild and redeploy
gcloud run deploy kirana-stock-analyzer --source .
```

### CORS errors
- Verify `VITE_API_BASE_URL` in Vercel matches Cloud Run URL
- Check backend allows `*.vercel.app` in CORS

### Need to update code
```bash
# Just push to GitHub, then redeploy
gcloud run deploy kirana-stock-analyzer --source .
```

---

## **Next Steps**
1. Create Google Cloud account
2. Install gcloud CLI
3. Create `Dockerfile` (provided below)
4. Run deploy command above
5. Copy Cloud Run URL to Vercel environment variables
6. Done! 🚀

Let me know when you're ready to deploy!
