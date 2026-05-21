import os
import random
import pandas as pd
from datetime import datetime, timedelta

def generate_data():
    print("Generating mock Kirana store data...")
    
    # Define products
    products = [
        {"sku": "SKU001", "name": "Aashirvaad Shudh Chakki Atta 5kg", "category": "Flour & Grains", "unit": "pack", "price": 260.0, "avg_daily_qty": 8.0, "stock": 15}, # Understocked
        {"sku": "SKU002", "name": "Tata Salt Iodized 1kg", "category": "Salt & Spices", "unit": "pack", "price": 28.0, "avg_daily_qty": 15.0, "stock": 120}, # Safe
        {"sku": "SKU003", "name": "Maggi 2-Min Masala Noodles 12-Pack", "category": "Instant Foods", "unit": "pack", "price": 168.0, "avg_daily_qty": 12.0, "stock": 45}, # Reorder soon
        {"sku": "SKU004", "name": "Amul Butter salted 500g", "category": "Dairy", "unit": "pack", "price": 275.0, "avg_daily_qty": 5.0, "stock": 6}, # Critical (less than 3 days)
        {"sku": "SKU005", "name": "Fortune Mustard Oil 1L", "category": "Oils & Ghee", "unit": "bottle", "price": 175.0, "avg_daily_qty": 6.0, "stock": 35}, # Safe
        {"sku": "SKU006", "name": "Surf Excel Easy Wash 1kg", "category": "Household", "unit": "pack", "price": 140.0, "avg_daily_qty": 4.0, "stock": 8}, # Reorder soon
        {"sku": "SKU007", "name": "Dettol Liquid Handwash Refill 175ml", "category": "Personal Care", "unit": "pack", "price": 99.0, "avg_daily_qty": 3.0, "stock": 25}, # Safe
        {"sku": "SKU008", "name": "Brooke Bond Red Label Tea 500g", "category": "Beverages", "unit": "pack", "price": 210.0, "avg_daily_qty": 7.0, "stock": 12}, # Reorder soon
        {"sku": "SKU009", "name": "Sugar Loose 1kg", "category": "Flour & Grains", "unit": "kg", "price": 45.0, "avg_daily_qty": 20.0, "stock": 200}, # Safe
        {"sku": "SKU010", "name": "Toor Dal Premium 1kg", "category": "Dal & Pulses", "unit": "kg", "price": 160.0, "avg_daily_qty": 10.0, "stock": 22}, # Critical
    ]

    # Date range: 90 days ending yesterday (relative to 2026-05-21)
    end_date = datetime(2026, 5, 20)
    start_date = end_date - timedelta(days=90)

    # 1. Generate Current Inventory sheet
    inventory_data = []
    for p in products:
        inventory_data.append({
            "SKU": p["sku"],
            "ProductName": p["name"],
            "Category": p["category"],
            "CurrentStock": p["stock"],
            "Unit": p["unit"],
            "UnitPrice": p["price"]
        })
    df_inventory = pd.DataFrame(inventory_data)

    # 2. Generate Sales Log sheet
    sales_logs = []
    current_date = start_date
    
    while current_date <= end_date:
        is_weekend = current_date.weekday() in [5, 6] # Sat, Sun
        
        for p in products:
            days_elapsed = (current_date - start_date).days
            trend_multiplier = 1.0 + (days_elapsed / 360.0) # Smooth growth
            
            weekend_multiplier = 1.5 if is_weekend else 0.95
            # Add small random noise
            noise = random.uniform(-0.05, 0.05)
            
            base_qty = p["avg_daily_qty"] * trend_multiplier * weekend_multiplier
            qty = max(1, int(round(base_qty * (1.0 + noise))))
            
            revenue = qty * p["price"]
            sales_logs.append({
                "Date": current_date.strftime("%Y-%m-%d"),
                "SKU": p["sku"],
                "ProductName": p["name"],
                "Category": p["category"],
                "QuantitySold": qty,
                "UnitPrice": p["price"],
                "TotalRevenue": revenue
            })
        
        current_date += timedelta(days=1)
        
    df_sales = pd.DataFrame(sales_logs)

    # Export to Excel
    file_path = "kirana_sales_demo.xlsx"
    with pd.ExcelWriter(file_path, engine="openpyxl") as writer:
        df_inventory.to_excel(writer, sheet_name="CurrentInventory", index=False)
        df_sales.to_excel(writer, sheet_name="SalesLog", index=False)
        
    print(f"Successfully generated demo data: {file_path}")
    print(f"Total sales records generated: {len(df_sales)}")

if __name__ == "__main__":
    generate_data()
