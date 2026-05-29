# Kirana Stock Analyzer

A practical inventory and forecasting dashboard for small Kirana stores.

This repo includes:
- `backend/` — FastAPI service, SQLite database, forecasting, and chat assistant logic
- `frontend/` — React + Vite dashboard for uploads, tables, charts, and chat

---

## What this app does
- Accepts daily sales uploads from Excel
- Stores sales and inventory records in SQLite
- Generates short-term demand forecasts using Prophet
- Flags products as safe, reorder soon, or critical
- Provides a basic chat interface for inventory questions

---

## Local setup

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` if you want OpenAI access:
```bash
cat > .env <<'EOF'
OPENAI_API_KEY=your_openai_key_here
EOF
```

Start the API:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in the browser.

If the frontend cannot reach the backend, make sure the client is pointing to `http://127.0.0.1:8000`.

---

## How to use it
- Generate or upload an Excel sales log
- The backend parses the file, stores records, runs forecasting, and updates inventory status
- Open the table to scan for critical items
- Click a product to view the forecast chart
- Ask the chat assistant about stock, demand, and reorder suggestions

---

## Code structure
- `backend/app/main.py` — FastAPI app and routes
- `backend/app/database.py` — SQLite connection and session setup
- `backend/app/models.py` / `schemas.py` — DB models and request/response schemas
- `backend/app/forecasting.py` — forecast training and prediction logic
- `backend/app/chat.py` — assistant prompt handling and vector search
- `frontend/src/` — React components and page logic

---

## Deployment
This repo includes deployment support for Fly.io, Render, and Google Cloud. The frontend can also be deployed separately on Vercel.

If you want a quick production setup:
- Deploy the backend from the repo root
- Deploy `frontend/` with `VITE_API_BASE_URL` set to the backend URL

See the deployment docs in the repo for platform-specific steps.

---

## Notes
- This project is built for demos and light Kirana use cases.
- Forecasting is short-term and works best with consistent sales data.
- The chat assistant can use OpenAI if configured, otherwise it still answers from stored inventory data.

---

## License
Use this code for experimentation and demos. All rights reserved.

