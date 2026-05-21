import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime
from .models import Product, SalesRecord
from .chat import ingest_products_to_vector_db

def parse_excel_upload(file_path: str, db: Session) -> dict:
    """
    Parses the uploaded Kirana Store Excel sheet.
    Expected sheets:
    - 'CurrentInventory': columns [SKU, ProductName, Category, CurrentStock, Unit, UnitPrice]
    - 'SalesLog': columns [Date, SKU, ProductName, Category, QuantitySold, UnitPrice, TotalRevenue]
    """
    try:
        # Load excel file
        xls = pd.ExcelFile(file_path)
        
        # Verify sheets exist
        if "CurrentInventory" not in xls.sheet_names or "SalesLog" not in xls.sheet_names:
            raise ValueError("Excel file must contain both 'CurrentInventory' and 'SalesLog' sheets.")
            
        df_inventory = pd.read_excel(xls, "CurrentInventory")
        df_sales = pd.read_excel(xls, "SalesLog")
        
        # 1. Update/Insert Products
        products_count = 0
        for _, row in df_inventory.iterrows():
            sku = str(row["SKU"]).strip()
            name = str(row["ProductName"]).strip()
            category = str(row["Category"]).strip() if pd.notna(row["Category"]) else None
            stock = float(row["CurrentStock"]) if pd.notna(row["CurrentStock"]) else 0.0
            unit = str(row["Unit"]).strip() if pd.notna(row["Unit"]) else "pcs"
            price = float(row["UnitPrice"]) if pd.notna(row["UnitPrice"]) else 0.0
            
            # Check if product already exists
            db_product = db.query(Product).filter(Product.sku == sku).first()
            if db_product:
                db_product.name = name
                db_product.category = category
                db_product.current_stock = stock
                db_product.unit = unit
                db_product.price = price
            else:
                db_product = Product(
                    sku=sku,
                    name=name,
                    category=category,
                    current_stock=stock,
                    unit=unit,
                    price=price,
                    reorder_status="Safe" # Initial status, forecasting updates this
                )
                db.add(db_product)
            products_count += 1
            
        db.commit()

        # 2. Re-populate Sales Records
        # We clear the existing sales records to import the new set of logs
        db.query(SalesRecord).delete()
        db.commit()
        
        sales_count = 0
        sales_to_add = []
        
        for _, row in df_sales.iterrows():
            sku = str(row["SKU"]).strip()
            qty = float(row["QuantitySold"]) if pd.notna(row["QuantitySold"]) else 0.0
            price = float(row["UnitPrice"]) if pd.notna(row["UnitPrice"]) else 0.0
            revenue = float(row["TotalRevenue"]) if pd.notna(row["TotalRevenue"]) else (qty * price)
            
            # Handle date parsing
            raw_date = row["Date"]
            if isinstance(raw_date, str):
                sales_date = datetime.strptime(raw_date.strip(), "%Y-%m-%d").date()
            elif isinstance(raw_date, datetime) or hasattr(raw_date, 'date'):
                sales_date = raw_date.date()
            else:
                # Fallback or skip if date is invalid
                continue
                
            db_sales = SalesRecord(
                date=sales_date,
                sku=sku,
                quantity_sold=qty,
                total_revenue=revenue
            )
            sales_to_add.append(db_sales)
            sales_count += 1
            
        if sales_to_add:
            db.bulk_save_objects(sales_to_add)
            db.commit()
            
        # 3. Update Vector Database knowledge base
        ingest_products_to_vector_db(db)
        
        return {
            "status": "Success",
            "products_imported": products_count,
            "sales_logs_imported": sales_count
        }
        
    except Exception as e:
        db.rollback()
        raise Exception(f"Failed to process Excel workbook: {str(e)}")
