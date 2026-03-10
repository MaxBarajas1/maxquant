import anthropic
import requests
from supabase import create_client
from dotenv import load_dotenv
import os
from datetime import date

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
AV_KEY = os.getenv("ALPHA_VANTAGE_KEY")

TICKERS = ["AMD", "NVDA", "INTC", "AAPL", "MSFT", "GOOGL", "SPY"]

def fetch_news(ticker):
    url = f"https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers={ticker}&apikey={AV_KEY}&limit=5"
    response = requests.get(url)
    data = response.json()
    if "feed" not in data:
        return []
    headlines = [item["title"] for item in data["feed"][:5]]
    return headlines

def analyze_sentiment(ticker, headlines):
    if not headlines:
        return "neutral", "No recent news found."

    headlines_text = "\n".join([f"- {h}" for h in headlines])
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"""Analyze these news headlines for {ticker} stock and provide:
1. Overall sentiment: bullish, bearish, or neutral
2. A 2-sentence AI summary with a buy, sell, or hold signal

Headlines:
{headlines_text}

Respond in this exact format:
SENTIMENT: [bullish/bearish/neutral]
SUMMARY: [your 2-sentence summary]"""
        }]
    )

    response_text = message.content[0].text
    lines = response_text.strip().split("\n")
    sentiment = "neutral"
    summary = response_text

    for line in lines:
        if line.startswith("SENTIMENT:"):
            sentiment = line.replace("SENTIMENT:", "").strip().lower()
        if line.startswith("SUMMARY:"):
            summary = line.replace("SUMMARY:", "").strip()

    return sentiment, summary

def load_sentiment_to_supabase(ticker, headlines, sentiment, summary):
    for headline in headlines:
        record = {
            "ticker": ticker,
            "date": str(date.today()),
            "headline": headline,
            "sentiment_score": sentiment,
            "ai_summary": summary
        }
        supabase.table("sentiment").upsert(record).execute()
    print(f"Saved sentiment for {ticker}: {sentiment}")

def run_sentiment_pipeline():
    print("Starting sentiment analysis...")
    for ticker in TICKERS:
        try:
            headlines = fetch_news(ticker)
            sentiment, summary = analyze_sentiment(ticker, headlines)
            load_sentiment_to_supabase(ticker, headlines, sentiment, summary)
        except Exception as e:
            print(f"Error processing {ticker}: {e}")
    print("Sentiment analysis complete.")

if __name__ == "__main__":
    run_sentiment_pipeline()