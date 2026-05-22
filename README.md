# Kirana Store Intelligence Dashboard 🛒📈

A modern, full-stack web application designed for small Indian grocery (Kirana) store owners to upload daily sales sheets, forecast SKU demand, identify inventory risks, and query store status using an AI Chat Assistant.

---

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS (v4), Recharts (data visualization), Lucide (icons)
- **Backend:** FastAPI (Python 3.14+), SQLAlchemy (SQLite ORM)
- **Time-Series ML:** Facebook Prophet (7-day demand forecasting & MAPE metrics)
- **AI Chat Layer:** LangChain + ChromaDB (vector store) + OpenAI GPT-4o (with automatic rule-based NLP fallback if no API key is set)

---

## 🚀 Getting Started

### 1. Setup Backend & Python Environment
From the project root:
```bash
# Create python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install python dependencies (FastAPI, Prophet, LangChain, ChromaDB)
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables
Create or edit `backend/.env`:
```env
OPENAI_API_KEY=your_actual_openai_key_here
```
*Note: If `OPENAI_API_KEY` is blank or invalid, the chatbot automatically falls back to an offline rule-based model that operates directly on the SQLite database, responding to English and Hindi stock queries.*

### 3. Launch the Backend Server
Make sure your virtual environment is active:
```bash
cd backend
python3 -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The API documentation will be available at: http://127.0.0.1:8000/docs (local dev) or on your Railway backend URL in production

---

### 4. Launch the React Frontend
Open a new terminal tab/window:
```bash
cd frontend
npm install
npm run dev
```
Open your browser to: http://localhost:5173

---

## 📊 Core Features Walkthrough

1. **Download Demo Data:** On first launch, click **"Get Demo Excel Log"** in the top bar. This will trigger a backend script that creates a realistic `kirana_sales_demo.xlsx` containing:
   - 90 days of daily sales logs for 10 typical Indian grocery items (seasonality, weekend spikes, upward trends).
   - An inventory list representing stock levels (categorized as Safe, Critical, or Reorder).
2. **Upload Sales logs:** Drag and drop this excel sheet into the uploader panel. The backend immediately:
   - Aggregates daily sales records.
   - Fits a Facebook Prophet model per product.
   - Computes forecast accuracy (Mean Absolute Percentage Error - MAPE).
   - Refreshes inventory risk statuses (Safe / Reorder Soon / Critical) in the database.
   - Automatically updates vector store embeddings in ChromaDB.
3. **Analyze Forecasts:** Click on any SKU row in the **Inventory & Reorder Log** table. The line chart will load displaying the last 21 days of actual historical daily sales and the next 7 days of forecasted sales, surrounded by a purple confidence boundary.
4. **Chat with AI:** Type questions in English, Hindi, or Hinglish:
   - *"What should I order this week?"*
   - *"कौनसे items critical list में हैं?"* (Hindi)
   - *"Show stock status for Amul Butter"*
   - The assistant answers naturally with list summaries and order suggestions (calculated as `Expected Forecast Sales - Current Stock`).

---

## 🌐 Production Deployment

### **Recommended: Fly.io (Free Forever, No Expiration)**
✅ **Truly free forever** - No 30-day limit, no billing surprises  
✅ **No spindowns** - Always instantly available  
✅ **Persistent storage** - SQLite database survives restarts  

**Deploy in 5 minutes:**
```bash
# 1. Go to fly.io, sign up (no credit card needed)
# 2. Install flyctl: brew install flyctl (Mac) or https://fly.io/docs/hands-on/install-flyctl/
# 3. From project root:
flyctl launch
# 4. Follow prompts, deploy
# 5. Copy Fly.io URL to Vercel environment variables
```

Full guide: [FLY_IO_DEPLOYMENT.md](FLY_IO_DEPLOYMENT.md)

### **Frontend: Vercel (Free)**
- Go to vercel.com
- Import this GitHub repo
- Set root directory: `frontend/`
- Add `VITE_API_BASE_URL` environment variable with your backend URL
- Deploy automatically on git push

---

## 📝 License
© 2026 Kruth Aryan. All rights reserved.

