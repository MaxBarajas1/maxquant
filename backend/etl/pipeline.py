import requests
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
import os
import time

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
AV_KEY = os.getenv("ALPHA_VANTAGE_KEY")

TICKERS = ["AMD", "NVDA", "INTC", "AAPL", "MSFT", "GOOGL", "SPY"]

def fetch_stock_data(ticker):
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}&apikey={AV_KEY}&outputsize=compact"
    response = requests.get(url)
    data = response.json()

    if "Time Series (Daily)" not in data:
        raise ValueError(f"No data for {ticker}: {data}")

    time_series = data["Time Series (Daily)"]
    rows = []
    for date, values in list(time_series.items())[:5]:
        rows.append({
            "ticker": ticker,
            "date": date,
            "open": float(values["1. open"]),
            "high": float(values["2. high"]),
            "low": float(values["3. low"]),
            "close": float(values["4. close"]),
            "volume": int(values["5. volume"])
        })
    return rows

def load_to_supabase(records):
    for record in records:
        supabase.table("stocks").upsert(record).execute()
    print(f"Loaded {len(records)} records for {records[0]['ticker']}")

def run_pipeline():
    print("Starting ETL pipeline...")
    for ticker in TICKERS:
        try:
            records = fetch_stock_data(ticker)
            load_to_supabase(records)
            time.sleep(12)  # Alpha Vantage free tier: 5 calls/min
        except Exception as e:
            print(f"Error processing {ticker}: {e}")
    print("ETL pipeline complete.")

if __name__ == "__main__":
    run_pipeline()