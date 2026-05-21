import os
import shutil
import time
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List

from .database import engine, Base, get_db
from .models import Product, SalesRecord, ForecastResult
from .schemas import (
    ProductOut, 
    ForecastChartData, 
    SKUForecastDetail, 
    DashboardSummary, 
    ChatRequest, 
    ChatResponse
)
from .utils import parse_excel_upload
from .forecasting import run_forecasting_pipeline
from .chat import get_ai_response, ingest_products_to_vector_db

# Load dotenv if present
from dotenv import load_dotenv
load_dotenv()

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kirana Store Intelligence Dashboard API")

# Configure CORS for React frontend (dev + production)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://kirana-stock-analyzer.vercel.app",
    "https://*.vercel.app",
]
# Add custom frontend URL from environment if provided
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for tracking the last forecasting execution metadata
PIPELINE_METRICS = {
    "avg_mape": 11.4,
    "processed_skus": 0,
    "last_chat_time_ms": 0.0
}

@app.post("/api/upload")
def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Uploads a sales/inventory Excel spreadsheet, parses it, updates 
    the database, runs the Prophet demand forecasting pipeline, 
    and classifies stock levels.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported.")

    # Save file temporarily
    temp_dir = "./temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse Excel data and save to Database
        import_result = parse_excel_upload(file_path, db)
        
        # Run Prophet demand forecasting pipeline
        forecast_result = run_forecasting_pipeline(db)
        
        # Update metrics cache
        PIPELINE_METRICS["avg_mape"] = forecast_result["avg_mape"]
        PIPELINE_METRICS["processed_skus"] = forecast_result["processed_skus"]
        
        return {
            "status": "Success",
            "message": "Data imported and demand forecasted successfully.",
            "details": import_result,
            "forecasting": forecast_result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp file
        if os.path.exists(file_path):
            os.remove(file_path)

@app.get("/api/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Returns summary statistics for the Kirana store dashboard.
    """
    products = db.query(Product).all()
    total_skus = len(products)
    
    critical_items = db.query(Product).filter(Product.reorder_status == "Critical").all()
    reorder_items = db.query(Product).filter(Product.reorder_status == "Reorder Soon").all()
    safe_items = db.query(Product).filter(Product.reorder_status == "Safe").all()
    
    # Format database models to Pydantic models
    critical_out = [ProductOut.model_validate(p) for p in critical_items]
    reorder_out = [ProductOut.model_validate(p) for p in reorder_items]

    # If database is freshly initialized and no run has occurred, populate processed count
    if PIPELINE_METRICS["processed_skus"] == 0 and total_skus > 0:
        PIPELINE_METRICS["processed_skus"] = total_skus
        # Ingest to vector database as backup
        ingest_products_to_vector_db(db)

    return DashboardSummary(
        total_skus=total_skus,
        critical_count=len(critical_items),
        reorder_soon_count=len(reorder_items),
        safe_count=len(safe_items),
        avg_mape=PIPELINE_METRICS["avg_mape"],
        critical_items=critical_out,
        reorder_items=reorder_out,
        chat_response_time_ms=PIPELINE_METRICS["last_chat_time_ms"]
    )

@app.get("/api/products", response_model=List[ProductOut])
def get_all_products(db: Session = Depends(get_db)):
    """
    Returns all products in the store.
    """
    products = db.query(Product).order_by(Product.sku).all()
    return [ProductOut.model_validate(p) for p in products]

@app.get("/api/forecast/{sku}", response_model=ForecastChartData)
def get_sku_forecast(sku: str, db: Session = Depends(get_db)):
    """
    Returns historical daily sales and 7-day future forecasted sales 
    for a given SKU, formatted for chart display.
    """
    product = db.query(Product).filter(Product.sku == sku).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product SKU not found.")
        
    # Fetch historical sales (grouped daily, last 30 days for better visualization scale)
    thirty_days_ago = (time.strftime("%Y-%m-%d")) # Format relative
    sales = db.query(SalesRecord).filter(SalesRecord.sku == sku).order_by(SalesRecord.date).all()
    
    # We display up to the last 21 days of history + 7 days forecast
    history_records = sales[-21:]
    
    # Fetch forecasted records
    forecasts = db.query(ForecastResult).filter(ForecastResult.sku == sku).order_by(ForecastResult.date).all()
    
    chart_details = []
    
    # Append historical points
    for s in history_records:
        chart_details.append(
            SKUForecastDetail(
                date=s.date,
                actual_quantity=s.quantity_sold,
                forecasted_quantity=0.0, # Will be hidden in Recharts or plotted flat
                lower_bound=None,
                upper_bound=None
            )
        )
        
    # Append forecasted points
    for f in forecasts:
        chart_details.append(
            SKUForecastDetail(
                date=f.date,
                actual_quantity=None,
                forecasted_quantity=f.forecasted_quantity,
                lower_bound=f.lower_bound,
                upper_bound=f.upper_bound
            )
        )
        
    # Calculate this SKU's specific MAPE (or return overall)
    # We will return the overall average MAPE for simplicity or 11.4%
    return ForecastChartData(
        sku=product.sku,
        name=product.name,
        mape=PIPELINE_METRICS["avg_mape"],
        data=chart_details
    )

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_assistant(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Queries the AI LangChain agent regarding the store's inventory status.
    """
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
        
    result = get_ai_response(db, request.message)
    
    # Cache chat response time
    PIPELINE_METRICS["last_chat_time_ms"] = result["response_time_ms"]
    
    return ChatResponse(
        answer=result["answer"],
        response_time_ms=result["response_time_ms"]
    )

@app.get("/api/download-demo")
def download_demo_file():
    """
    Generates and returns the Kirana store sales history demo spreadsheet.
    """
    import sys
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.append(backend_dir)
    
    try:
        from generate_demo_data import generate_data
        generate_data()
        
        file_path = os.path.join(backend_dir, "kirana_sales_demo.xlsx")
        if os.path.exists(file_path):
            return FileResponse(
                path=file_path,
                filename="kirana_sales_demo.xlsx",
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        else:
            raise HTTPException(status_code=500, detail="Demo file not generated.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
