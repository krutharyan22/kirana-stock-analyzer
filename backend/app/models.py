from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    category = Column(String, nullable=True)
    current_stock = Column(Float, default=0.0)
    unit = Column(String, default="pcs")
    price = Column(Float, default=0.0)
    reorder_status = Column(String, default="Safe") # "Safe", "Reorder Soon", "Critical"

    # Relationships
    sales = relationship("SalesRecord", back_populates="product", cascade="all, delete-orphan")
    forecasts = relationship("ForecastResult", back_populates="product", cascade="all, delete-orphan")

class SalesRecord(Base):
    __tablename__ = "sales_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, index=True, nullable=False)
    sku = Column(String, ForeignKey("products.sku", ondelete="CASCADE"), nullable=False)
    quantity_sold = Column(Float, nullable=False)
    total_revenue = Column(Float, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="sales")

class ForecastResult(Base):
    __tablename__ = "forecast_results"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, ForeignKey("products.sku", ondelete="CASCADE"), nullable=False)
    date = Column(Date, index=True, nullable=False)
    forecasted_quantity = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="forecasts")
