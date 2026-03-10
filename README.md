cat > README.md << 'EOF'
# MaxQuant ⚡
> AI-powered stock analysis and trading signal system built with Python, FastAPI, Claude AI, and React.

![Python](https://img.shields.io/badge/Python-3.11-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green) ![React](https://img.shields.io/badge/React-18-cyan) ![Claude AI](https://img.shields.io/badge/Claude-AI-purple)

## What It Does
MaxQuant is a full-stack AI trading dashboard that:
- Ingests real-time stock data via ETL pipeline (AMD, NVDA, INTC, AAPL, MSFT, GOOGL, SPY)
- Runs NLP sentiment analysis on live news headlines using the Anthropic Claude API
- Generates AI-powered BUY / SELL / HOLD signals based on your portfolio positions
- Displays everything in a cyberpunk-themed React dashboard with live charts

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, pandas, NumPy |
| AI/NLP | Anthropic Claude API, scikit-learn |
| Database | Supabase (PostgreSQL) |
| Frontend | React, Recharts, Axios |
| Data | Alpha Vantage API |
| Infra | Docker, AWS Lambda (planned), Vercel (planned) |

## Features
- **ETL Pipeline** — fetches OHLCV data for 7 tickers, loads into Supabase PostgreSQL
- **AI Sentiment Analysis** — Claude analyzes live news headlines, returns bullish/bearish/neutral + summary
- **Portfolio Tracker** — track positions, P&L, market value, and total return
- **AI Trade Signals** — Claude generates BUY/SELL/HOLD with confidence score, stop loss, and take profit targets
- **Interactive Dashboard** — 5D/1M/3M/1Y charts, market overview, clickable news feed

## Getting Started

### Prerequisites
- Python 3.11
- Node.js 18+
- Supabase account
- Alpha Vantage API key (free)
- Anthropic API key

### Setup
```bash
# Clone the repo
git clone https://github.com/MaxBarajas1/maxquant.git
cd maxquant

# Backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r backend/requirements.txt

# Create .env
cp .env.example .env
# Fill in your keys

# Run ETL pipeline
python backend/etl/pipeline.py

# Run sentiment analysis
python backend/ai/sentiment.py

# Start API
uvicorn backend.api.main:app --reload

# Frontend (new terminal)
cd frontend
npm install
npm start
```

### Database Tables
```sql
stocks (id, ticker, date, open, high, low, close, volume)
sentiment (id, ticker, date, headline, sentiment_score, ai_summary)
portfolio (id, ticker, shares, avg_buy_price)
trade_signals (id, ticker, signal, confidence, reasoning, stop_loss, take_profit)
```

## Project Structure
```
maxquant/
├── backend/
│   ├── etl/pipeline.py        # Stock data ingestion
│   ├── ai/sentiment.py        # Claude AI sentiment analysis
│   └── api/main.py            # FastAPI REST endpoints
├── frontend/
│   └── src/App.js             # React dashboard
└── README.md
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /stocks/{ticker} | Get price data for ticker |
| GET | /sentiment/{ticker} | Get AI sentiment for ticker |
| GET | /summary | Get all tickers summary |
| GET | /portfolio | Get all positions with P&L |
| POST | /portfolio | Add/update position |
| DELETE | /portfolio/{ticker} | Remove position |
| GET | /signals | Generate AI trade signals |

## Disclaimer
This project is for educational purposes only. AI-generated signals are not financial advice.

## Author
**Max Barajas** — [LinkedIn](https://linkedin.com/in/maxbarajas) | [Portfolio](https://maxupgrade.net)
EOF