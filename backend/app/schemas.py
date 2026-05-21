from pydantic import BaseModel
from datetime import date
from typing import List, Optional

class ProductBase(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    current_stock: float
    unit: str = "pcs"
    price: float
    reorder_status: str = "Safe"

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True

class SalesRecordBase(BaseModel):
    date: date
    sku: str
    quantity_sold: float
    total_revenue: float

class SalesRecordCreate(SalesRecordBase):
    pass

class SalesRecordOut(SalesRecordBase):
    id: int

    class Config:
        from_attributes = True

class ForecastResultOut(BaseModel):
    sku: str
    date: date
    forecasted_quantity: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

    class Config:
        from_attributes = True

class SKUForecastDetail(BaseModel):
    date: date
    actual_quantity: Optional[float] = None
    forecasted_quantity: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class ForecastChartData(BaseModel):
    sku: str
    name: str
    mape: float
    data: List[SKUForecastDetail]

class DashboardSummary(BaseModel):
    total_skus: int
    critical_count: int
    reorder_soon_count: int
    safe_count: int
    avg_mape: float
    critical_items: List[ProductOut]
    reorder_items: List[ProductOut]
    chat_response_time_ms: Optional[float] = None

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    response_time_ms: float
