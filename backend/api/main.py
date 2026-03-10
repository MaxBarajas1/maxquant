from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
from pydantic import BaseModel
import anthropic
import requests
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
claude = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
AV_KEY = os.getenv("ALPHA_VANTAGE_KEY")

class Position(BaseModel):
    ticker: str
    shares: float
    avg_buy_price: float

def get_current_price(ticker):
    url = f"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}&apikey={AV_KEY}&outputsize=compact"
    res = requests.get(url).json()
    series = res.get("Time Series (Daily)", {})
    if not series:
        return None
    latest_date = list(series.keys())[0]
    return float(series[latest_date]["4. close"])

def get_sentiment(ticker):
    res = supabase.table("sentiment").select("*").eq("ticker", ticker).order("date", desc=True).limit(1).execute()
    if res.data:
        return res.data[0]["sentiment_score"], res.data[0]["ai_summary"]
    return "neutral", "No sentiment data available."

@app.get("/")
def root():
    return {"message": "MaxQuant API is running"}

@app.get("/stocks/{ticker}")
def get_stock(ticker: str):
    response = supabase.table("stocks").select("*").eq("ticker", ticker.upper()).order("date", desc=True).limit(10).execute()
    return {"ticker": ticker.upper(), "data": response.data}

@app.get("/stocks")
def get_all_stocks():
    response = supabase.table("stocks").select("*").order("date", desc=True).execute()
    return {"data": response.data}

@app.get("/sentiment/{ticker}")
def get_sentiment_route(ticker: str):
    response = supabase.table("sentiment").select("*").eq("ticker", ticker.upper()).order("date", desc=True).limit(5).execute()
    return {"ticker": ticker.upper(), "data": response.data}

@app.get("/sentiment")
def get_all_sentiment():
    response = supabase.table("sentiment").select("*").order("date", desc=True).execute()
    return {"data": response.data}

@app.get("/summary")
def get_summary():
    stocks = supabase.table("stocks").select("ticker, close, date").order("date", desc=True).execute()
    sentiment = supabase.table("sentiment").select("ticker, sentiment_score, ai_summary").order("date", desc=True).execute()
    return {"stocks": stocks.data, "sentiment": sentiment.data}

# ── PORTFOLIO ROUTES ──

@app.get("/portfolio")
def get_portfolio():
    positions = supabase.table("portfolio").select("*").execute()
    result = []
    for pos in positions.data:
        current_price = get_current_price(pos["ticker"])
        if current_price:
            pnl = (current_price - pos["avg_buy_price"]) * pos["shares"]
            pnl_pct = ((current_price - pos["avg_buy_price"]) / pos["avg_buy_price"]) * 100
            result.append({**pos, "current_price": current_price, "pnl": round(pnl, 2), "pnl_pct": round(pnl_pct, 2), "market_value": round(current_price * pos["shares"], 2)})
    return {"data": result}

@app.post("/portfolio")
def add_position(position: Position):
    existing = supabase.table("portfolio").select("*").eq("ticker", position.ticker.upper()).execute()
    if existing.data:
        supabase.table("portfolio").update({"shares": position.shares, "avg_buy_price": position.avg_buy_price}).eq("ticker", position.ticker.upper()).execute()
    else:
        supabase.table("portfolio").insert({"ticker": position.ticker.upper(), "shares": position.shares, "avg_buy_price": position.avg_buy_price}).execute()
    return {"message": f"Position saved for {position.ticker.upper()}"}

@app.delete("/portfolio/{ticker}")
def delete_position(ticker: str):
    supabase.table("portfolio").delete().eq("ticker", ticker.upper()).execute()
    return {"message": f"Position deleted for {ticker.upper()}"}

@app.get("/signals")
def get_trade_signals():
    positions = supabase.table("portfolio").select("*").execute()
    signals = []
    for pos in positions.data:
        ticker = pos["ticker"]
        current_price = get_current_price(ticker)
        if not current_price:
            continue
        sentiment, summary = get_sentiment(ticker)
        pnl_pct = ((current_price - pos["avg_buy_price"]) / pos["avg_buy_price"]) * 100

        message = claude.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": f"""You are an AI trading assistant. Analyze this position and give a trade signal.

Ticker: {ticker}
Current Price: ${current_price}
Avg Buy Price: ${pos["avg_buy_price"]}
Shares: {pos["shares"]}
P&L: {round(pnl_pct, 2)}%
Market Sentiment: {sentiment}
News Summary: {summary}

Respond in this EXACT format:
SIGNAL: [BUY/SELL/HOLD]
CONFIDENCE: [0-100]
REASONING: [1-2 sentences max]
STOP_LOSS: [suggested stop loss price]
TAKE_PROFIT: [suggested take profit price]"""
            }]
        )

        text = message.content[0].text
        signal_data = {"ticker": ticker, "current_price": current_price, "avg_buy_price": pos["avg_buy_price"], "shares": pos["shares"], "pnl_pct": round(pnl_pct, 2), "signal": "HOLD", "confidence": 50, "reasoning": text, "stop_loss": None, "take_profit": None}

        for line in text.strip().split("\n"):
            if line.startswith("SIGNAL:"): signal_data["signal"] = line.replace("SIGNAL:", "").strip()
            elif line.startswith("CONFIDENCE:"): signal_data["confidence"] = int(line.replace("CONFIDENCE:", "").strip())
            elif line.startswith("REASONING:"): signal_data["reasoning"] = line.replace("REASONING:", "").strip()
            elif line.startswith("STOP_LOSS:"): signal_data["stop_loss"] = line.replace("STOP_LOSS:", "").strip()
            elif line.startswith("TAKE_PROFIT:"): signal_data["take_profit"] = line.replace("TAKE_PROFIT:", "").strip()

        supabase.table("trade_signals").insert({"ticker": ticker, "signal": signal_data["signal"], "confidence": signal_data["confidence"], "reasoning": signal_data["reasoning"], "current_price": current_price, "avg_buy_price": pos["avg_buy_price"], "pnl_pct": round(pnl_pct, 2)}).execute()
        signals.append(signal_data)

    return {"signals": signals}