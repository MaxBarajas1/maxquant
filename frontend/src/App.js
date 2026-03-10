import { useState, useEffect } from "react";
import axios from "axios";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://127.0.0.1:8000";
const AV_KEY = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
const TICKERS = ["AMD", "NVDA", "INTC", "AAPL", "MSFT", "GOOGL", "SPY"];

const sentimentColor = (s) => s === "bullish" ? "#00ff9f" : s === "bearish" ? "#ff2d6b" : "#f0c040";
const sentimentGlow = (s) => s === "bullish" ? "0 0 12px #00ff9f88" : s === "bearish" ? "0 0 12px #ff2d6b88" : "0 0 12px #f0c04088";
const sentimentLabel = (s) => s === "bullish" ? "▲ BULLISH" : s === "bearish" ? "▼ BEARISH" : "◆ NEUTRAL";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #020408; font-family: 'Rajdhani', sans-serif; cursor: crosshair; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0a0e1a; }
  ::-webkit-scrollbar-thumb { background: #00d4ff44; border-radius: 2px; }

  .scanlines {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px);
    pointer-events: none; z-index: 1000;
  }
  .grid-bg {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background-image: linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none; z-index: 0;
  }

  .app { position: relative; z-index: 1; min-height: 100vh; padding: 24px; max-width: 1400px; margin: 0 auto; }

  .cyber-card {
    background: linear-gradient(135deg, rgba(0,20,40,0.9), rgba(0,10,20,0.95));
    border: 1px solid rgba(0,212,255,0.2); border-radius: 4px;
    position: relative; overflow: hidden; transition: border-color 0.3s, box-shadow 0.3s;
  }
  .cyber-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #00d4ff, transparent); opacity: 0.6;
  }
  .cyber-card:hover { border-color: rgba(0,212,255,0.5); box-shadow: 0 0 20px rgba(0,212,255,0.1); }

  .glitch { position: relative; animation: glitch-skew 4s infinite linear alternate-reverse; }
  @keyframes glitch-skew {
    0% { transform: skew(0deg); } 85% { transform: skew(0deg); }
    87% { transform: skew(-1deg); } 89% { transform: skew(0.5deg); }
    91% { transform: skew(0deg); } 100% { transform: skew(0deg); }
  }

  .pulse-dot {
    width: 8px; height: 8px; border-radius: 50%; background: #00ff9f;
    box-shadow: 0 0 8px #00ff9f; animation: pulse 2s infinite; display: inline-block;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
  }

  .ticker-btn {
    font-family: 'Share Tech Mono', monospace; font-size: 12px; padding: 8px 16px;
    border-radius: 2px; border: 1px solid rgba(0,212,255,0.3); background: rgba(0,20,40,0.8);
    color: #4a9bbe; cursor: crosshair; transition: all 0.2s; letter-spacing: 2px;
  }
  .ticker-btn:hover { border-color: #00d4ff; color: #00d4ff; box-shadow: 0 0 12px rgba(0,212,255,0.3); background: rgba(0,40,80,0.8); }
  .ticker-btn.active { border-color: #00d4ff; background: rgba(0,212,255,0.15); color: #00d4ff; box-shadow: 0 0 16px rgba(0,212,255,0.4); }
  .ticker-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .time-btn {
    font-family: 'Share Tech Mono', monospace; font-size: 11px; padding: 6px 14px;
    border-radius: 2px; border: 1px solid rgba(0,212,255,0.2); background: transparent;
    color: #4a9bbe; cursor: crosshair; transition: all 0.2s; letter-spacing: 1px;
  }
  .time-btn.active { border-color: #b44dff; background: rgba(180,77,255,0.15); color: #b44dff; box-shadow: 0 0 12px rgba(180,77,255,0.3); }

  .tab-btn {
    font-family: 'Share Tech Mono', monospace; font-size: 11px; letter-spacing: 3px;
    padding: 12px 24px; border: none; background: transparent; color: rgba(0,212,255,0.3);
    border-bottom: 2px solid transparent; cursor: crosshair; transition: all 0.2s; text-transform: uppercase;
  }
  .tab-btn.active { color: #00d4ff; border-bottom: 2px solid #00d4ff; }
  .tab-btn:hover { color: rgba(0,212,255,0.7); }

  .stat-card {
    background: linear-gradient(135deg, rgba(0,20,40,0.9), rgba(0,10,20,0.95));
    border: 1px solid rgba(0,212,255,0.15); border-radius: 4px; padding: 16px;
    position: relative; overflow: hidden;
  }
  .stat-card::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent);
  }

  .news-link {
    display: block; padding: 12px 0; border-bottom: 1px solid rgba(0,212,255,0.08);
    color: #8ab4cc; text-decoration: none; font-size: 13px;
    font-family: 'Rajdhani', sans-serif; font-weight: 400; letter-spacing: 0.3px;
    transition: all 0.2s; cursor: pointer;
  }
  .news-link:hover { color: #00d4ff; padding-left: 8px; border-bottom-color: rgba(0,212,255,0.3); }

  .section-label {
    font-family: 'Share Tech Mono', monospace; font-size: 10px; letter-spacing: 3px;
    color: rgba(0,212,255,0.5); text-transform: uppercase; margin-bottom: 12px;
  }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.4s ease forwards; }

  .corner-tl, .corner-tr, .corner-bl, .corner-br {
    position: absolute; width: 12px; height: 12px; border-color: rgba(0,212,255,0.6); border-style: solid;
  }
  .corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
  .corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
  .corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
  .corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

  .cyber-input {
    background: rgba(0,20,40,0.8); border: 1px solid rgba(0,212,255,0.2); border-radius: 2px;
    padding: 8px 12px; color: #00d4ff; font-family: 'Share Tech Mono', monospace;
    font-size: 13px; outline: none; transition: border-color 0.2s;
  }
  .cyber-input:focus { border-color: rgba(0,212,255,0.6); box-shadow: 0 0 8px rgba(0,212,255,0.2); }
  .cyber-input::placeholder { color: rgba(0,212,255,0.2); }

  .portfolio-row { transition: background 0.2s; }
  .portfolio-row:hover { background: rgba(0,212,255,0.04) !important; }

  .signal-card {
    background: linear-gradient(135deg, rgba(0,20,40,0.9), rgba(0,10,20,0.95));
    border-radius: 4px; padding: 24px; position: relative; overflow: hidden; transition: all 0.3s;
  }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(0,10,20,0.95)", border: "1px solid rgba(0,212,255,0.4)", borderRadius: "4px", padding: "10px 14px" }}>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "#00d4ff", marginBottom: "4px" }}>{label}</p>
        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", color: "#00ff9f" }}>${payload[0].value?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [selectedTicker, setSelectedTicker] = useState("AAPL");
  const [stockData, setStockData] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeRange, setTimeRange] = useState("5D");
  const [chartData, setChartData] = useState([]);
  const [activeTab, setActiveTab] = useState("market");
  const [portfolio, setPortfolio] = useState([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [newPosition, setNewPosition] = useState({ ticker: "", shares: "", avg_buy_price: "" });
  const [addingPosition, setAddingPosition] = useState(false);
  const [signals, setSignals] = useState([]);
  const [loadingSignals, setLoadingSignals] = useState(false);

  useEffect(() => { fetchSummary(); }, []);
  useEffect(() => { fetchTickerData(); }, [selectedTicker]);
  useEffect(() => { fetchChartData(); }, [selectedTicker, timeRange]);
  useEffect(() => { if (activeTab === "portfolio") fetchPortfolio(); }, [activeTab]);

  const fetchSummary = async () => {
    const res = await axios.get(`${API}/summary`);
    setSummary(res.data.sentiment);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const fetchTickerData = async () => {
    setLoading(true);
    const [stocks, sentiment] = await Promise.all([
      axios.get(`${API}/stocks/${selectedTicker}`),
      axios.get(`${API}/sentiment/${selectedTicker}`)
    ]);
    const data = stocks.data.data.map(d => ({
      date: d.date, close: parseFloat(d.close.toFixed(2)),
      open: d.open, high: d.high, low: d.low, volume: d.volume
    })).reverse();
    setStockData(data);
    setSentimentData(sentiment.data.data);
    setLoading(false);
  };

  const fetchChartData = async () => {
    try {
      let func = "TIME_SERIES_DAILY";
      let key = "Time Series (Daily)";
      if (timeRange === "1M" || timeRange === "3M") { func = "TIME_SERIES_WEEKLY"; key = "Weekly Time Series"; }
      if (timeRange === "1Y") { func = "TIME_SERIES_MONTHLY"; key = "Monthly Time Series"; }
      const url = `https://www.alphavantage.co/query?function=${func}&symbol=${selectedTicker}&apikey=${AV_KEY}&outputsize=full`;
      const res = await axios.get(url);
      const series = res.data[key];
      if (!series) return;
      const limit = timeRange === "5D" ? 5 : timeRange === "1M" ? 4 : timeRange === "3M" ? 13 : 12;
      const entries = Object.entries(series).slice(0, limit).reverse();
      setChartData(entries.map(([date, vals]) => ({
        date: timeRange === "1Y" ? date.slice(0, 7) : date,
        close: parseFloat(parseFloat(vals["4. close"]).toFixed(2))
      })));
    } catch (e) {
      setChartData(stockData.map(d => ({ date: d.date, close: d.close })));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    await fetchTickerData();
    await fetchChartData();
    setRefreshing(false);
  };

  const fetchPortfolio = async () => {
    setPortfolioLoading(true);
    try { const res = await axios.get(`${API}/portfolio`); setPortfolio(res.data.data); }
    catch (e) { console.error(e); }
    setPortfolioLoading(false);
  };

  const addPosition = async () => {
    if (!newPosition.ticker || !newPosition.shares || !newPosition.avg_buy_price) return;
    setAddingPosition(true);
    await axios.post(`${API}/portfolio`, {
      ticker: newPosition.ticker.toUpperCase(),
      shares: parseFloat(newPosition.shares),
      avg_buy_price: parseFloat(newPosition.avg_buy_price)
    });
    setNewPosition({ ticker: "", shares: "", avg_buy_price: "" });
    await fetchPortfolio();
    setAddingPosition(false);
  };

  const deletePosition = async (ticker) => {
    await axios.delete(`${API}/portfolio/${ticker}`);
    fetchPortfolio();
  };

  const fetchSignals = async () => {
    setLoadingSignals(true);
    try { const res = await axios.get(`${API}/signals`); setSignals(res.data.signals); }
    catch (e) { console.error(e); }
    setLoadingSignals(false);
  };

  const latest = stockData[stockData.length - 1];
  const previous = stockData[stockData.length - 2];
  const priceChange = latest && previous ? (latest.close - previous.close).toFixed(2) : null;
  const priceChangePct = latest && previous ? (((latest.close - previous.close) / previous.close) * 100).toFixed(2) : null;
  const isPositive = parseFloat(priceChange) >= 0;
  const latestSentiment = sentimentData[0];
  const summaryMap = {};
  summary.forEach(s => { if (!summaryMap[s.ticker]) summaryMap[s.ticker] = s; });
  const displayData = chartData.length > 0 ? chartData : stockData.map(d => ({ date: d.date, close: d.close }));

  const totalValue = portfolio.reduce((sum, p) => sum + (p.market_value || 0), 0);
  const totalPnl = portfolio.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const totalCost = portfolio.reduce((sum, p) => sum + (p.avg_buy_price * p.shares), 0);
  const totalPnlPct = totalCost > 0 ? ((totalPnl / totalCost) * 100).toFixed(2) : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="scanlines" />
      <div className="grid-bg" />
      <div className="app">

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <div className="glitch" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h1 style={{ fontFamily: "'Orbitron', monospace", fontSize: "32px", fontWeight: 900, color: "#00d4ff", letterSpacing: "4px", textShadow: "0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.3)" }}>
                MAXQUANT
              </h1>
              <span className="pulse-dot" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px" }}>
              <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "rgba(0,212,255,0.4)", letterSpacing: "4px" }}>
                // AI-POWERED STOCK ANALYSIS SYSTEM
              </p>
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "2px", color: "#f0c040", background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.3)", padding: "3px 8px", borderRadius: "2px" }}>
                ⚠ EOD DATA · 15MIN DELAY
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {lastUpdated && (
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "10px", color: "rgba(0,212,255,0.3)", letterSpacing: "1px" }}>
                SYS_TIME: {lastUpdated}
              </span>
            )}
            <button className="ticker-btn" onClick={handleRefresh} disabled={refreshing} style={{ letterSpacing: "1px" }}>
              {refreshing ? "SYNCING..." : "⟳ SYNC DATA"}
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", marginBottom: "24px", borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
          {[["market", "// MARKET"], ["portfolio", "// PORTFOLIO"], ["signals", "// AI SIGNALS"]].map(([id, label]) => (
            <button key={id} className={`tab-btn ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── MARKET TAB ── */}
        {activeTab === "market" && (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {TICKERS.map(t => {
                const s = summaryMap[t];
                return (
                  <button key={t} className={`ticker-btn ${selectedTicker === t ? "active" : ""}`} onClick={() => setSelectedTicker(t)}>
                    {t}
                    {s && <span style={{ marginLeft: "6px", color: sentimentColor(s.sentiment_score), fontSize: "9px" }}>
                      {s.sentiment_score === "bullish" ? "▲" : s.sentiment_score === "bearish" ? "▼" : "◆"}
                    </span>}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: "80px", fontFamily: "'Share Tech Mono', monospace", color: "rgba(0,212,255,0.4)", letterSpacing: "4px", fontSize: "13px" }}>
                LOADING {selectedTicker} DATA...
              </div>
            ) : (
              <div className="fade-in">
                <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", marginBottom: "16px" }}>
                  <div className="cyber-card" style={{ padding: "24px" }}>
                    <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
                    <p className="section-label">// CURRENT PRICE</p>
                    <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "rgba(0,212,255,0.4)", marginBottom: "8px", letterSpacing: "2px" }}>{selectedTicker}</p>
                    <h2 style={{ fontFamily: "'Orbitron', monospace", fontSize: "36px", fontWeight: 700, color: "#f0f8ff", marginBottom: "12px", textShadow: "0 0 20px rgba(0,212,255,0.3)" }}>
                      ${latest?.close?.toFixed(2)}
                    </h2>
                    {priceChange && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "2px", background: isPositive ? "rgba(0,255,159,0.1)" : "rgba(255,45,107,0.1)", border: `1px solid ${isPositive ? "rgba(0,255,159,0.3)" : "rgba(255,45,107,0.3)"}` }}>
                        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "13px", color: isPositive ? "#00ff9f" : "#ff2d6b", textShadow: isPositive ? "0 0 8px #00ff9f" : "0 0 8px #ff2d6b" }}>
                          {isPositive ? "▲" : "▼"} ${Math.abs(priceChange)} ({Math.abs(priceChangePct)}%)
                        </span>
                      </div>
                    )}
                  </div>

                  {latestSentiment && (
                    <div className="cyber-card" style={{ padding: "24px", borderColor: `${sentimentColor(latestSentiment.sentiment_score)}44`, boxShadow: sentimentGlow(latestSentiment.sentiment_score) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <p className="section-label">// AI SENTIMENT ANALYSIS</p>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "11px", fontWeight: 700, color: sentimentColor(latestSentiment.sentiment_score), letterSpacing: "2px", textShadow: sentimentGlow(latestSentiment.sentiment_score), padding: "4px 10px", border: `1px solid ${sentimentColor(latestSentiment.sentiment_score)}44`, borderRadius: "2px" }}>
                          {sentimentLabel(latestSentiment.sentiment_score)}
                        </span>
                      </div>
                      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "15px", color: "#8ab4cc", lineHeight: "1.6", fontWeight: 300 }}>
                        {latestSentiment.ai_summary}
                      </p>
                    </div>
                  )}
                </div>

                {latest && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "16px" }}>
                    {[["OPEN", latest.open, "#00d4ff"], ["HIGH", latest.high, "#00ff9f"], ["LOW", latest.low, "#ff2d6b"], ["VOLUME", null, "#b44dff"]].map(([label, value, color]) => (
                      <div key={label} className="stat-card">
                        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "3px", color: `${color}88`, marginBottom: "6px" }}>{label}</p>
                        <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "16px", fontWeight: 700, color, textShadow: `0 0 8px ${color}66` }}>
                          {label === "VOLUME" ? (latest.volume / 1000000).toFixed(1) + "M" : `$${parseFloat(value).toFixed(2)}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="cyber-card" style={{ padding: "24px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <p className="section-label">// PRICE CHART — {selectedTicker}</p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {["5D", "1M", "3M", "1Y"].map(t => (
                        <button key={t} className={`time-btn ${timeRange === t ? "active" : ""}`} onClick={() => setTimeRange(t)}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={displayData} margin={{ right: 16, left: 0 }}>
                      <defs>
                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(0,212,255,0.08)" />
                      <XAxis dataKey="date" stroke="rgba(0,212,255,0.3)" tick={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, fill: "rgba(0,212,255,0.5)" }} />
                      <YAxis stroke="rgba(0,212,255,0.3)" tick={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, fill: "rgba(0,212,255,0.5)" }} domain={["auto", "auto"]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="close" stroke="#00d4ff" strokeWidth={2} fill="url(#priceGrad)" dot={false} activeDot={{ fill: "#00d4ff", r: 4, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>
                  <div className="cyber-card" style={{ padding: "24px" }}>
                    <p className="section-label">// LIVE NEWS FEED — {selectedTicker}</p>
                    {sentimentData.length === 0 ? (
                      <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "rgba(0,212,255,0.3)" }}>NO FEED DATA</p>
                    ) : sentimentData.map((item, i) => (
                      <a key={i} className="news-link" href={`https://www.google.com/search?q=${encodeURIComponent(item.headline)}`} target="_blank" rel="noreferrer">
                        <span style={{ color: sentimentColor(item.sentiment_score), marginRight: "10px", fontSize: "10px" }}>
                          {item.sentiment_score === "bullish" ? "▲" : item.sentiment_score === "bearish" ? "▼" : "◆"}
                        </span>
                        {item.headline}
                        <span style={{ float: "right", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", color: "rgba(0,212,255,0.3)", letterSpacing: "1px" }}>↗ OPEN</span>
                      </a>
                    ))}
                  </div>

                  <div className="cyber-card" style={{ padding: "24px" }}>
                    <p className="section-label">// MARKET OVERVIEW</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {TICKERS.map(ticker => {
                        const s = summaryMap[ticker];
                        const isSelected = ticker === selectedTicker;
                        return (
                          <div key={ticker} onClick={() => setSelectedTicker(ticker)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "2px", cursor: "crosshair", background: isSelected ? "rgba(0,212,255,0.08)" : "rgba(0,10,20,0.6)", border: `1px solid ${isSelected ? "rgba(0,212,255,0.4)" : "rgba(0,212,255,0.08)"}`, transition: "all 0.2s", borderLeft: `3px solid ${s ? sentimentColor(s.sentiment_score) : "rgba(0,212,255,0.2)"}`, boxShadow: isSelected ? "0 0 12px rgba(0,212,255,0.15)" : "none" }}>
                            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "12px", color: isSelected ? "#00d4ff" : "#4a9bbe", letterSpacing: "2px" }}>{ticker}</span>
                            <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "9px", fontWeight: 700, color: s ? sentimentColor(s.sentiment_score) : "rgba(0,212,255,0.3)", letterSpacing: "1px", textShadow: s ? sentimentGlow(s.sentiment_score) : "none" }}>
                              {s ? sentimentLabel(s.sentiment_score) : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {activeTab === "portfolio" && (
          <div className="fade-in">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                ["TOTAL VALUE", `$${totalValue.toFixed(2)}`, "#00d4ff"],
                ["TOTAL P&L", `${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`, totalPnl >= 0 ? "#00ff9f" : "#ff2d6b"],
                ["TOTAL RETURN", `${totalPnlPct >= 0 ? "▲" : "▼"} ${Math.abs(totalPnlPct)}%`, totalPnlPct >= 0 ? "#00ff9f" : "#ff2d6b"]
              ].map(([label, value, color]) => (
                <div key={label} className="stat-card">
                  <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
                  <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "3px", color: "rgba(0,212,255,0.4)", marginBottom: "8px" }}>{label}</p>
                  <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "24px", fontWeight: 700, color, textShadow: `0 0 8px ${color}66` }}>{value}</p>
                </div>
              ))}
            </div>

            <div className="cyber-card" style={{ padding: "24px", marginBottom: "16px" }}>
              <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
              <p className="section-label">// ADD / UPDATE POSITION</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
                {[["TICKER", "ticker", "AMD", "80px"], ["SHARES", "shares", "10", "120px"], ["AVG BUY PRICE $", "avg_buy_price", "180.00", "150px"]].map(([label, field, placeholder, width]) => (
                  <div key={field}>
                    <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", letterSpacing: "2px", color: "rgba(0,212,255,0.4)", marginBottom: "6px" }}>{label}</p>
                    <input className="cyber-input" value={newPosition[field]} onChange={e => setNewPosition({ ...newPosition, [field]: e.target.value })} placeholder={placeholder} style={{ width }} />
                  </div>
                ))}
                <button className="ticker-btn active" onClick={addPosition} disabled={addingPosition} style={{ marginBottom: "1px" }}>
                  {addingPosition ? "ADDING..." : "+ ADD"}
                </button>
              </div>
            </div>

            <div className="cyber-card" style={{ padding: "24px" }}>
              <p className="section-label">// CURRENT POSITIONS</p>
              {portfolioLoading ? (
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "rgba(0,212,255,0.3)", marginTop: "12px", letterSpacing: "3px" }}>LOADING...</p>
              ) : portfolio.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", color: "rgba(0,212,255,0.3)", letterSpacing: "3px" }}>NO POSITIONS — ADD ONE ABOVE</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Share Tech Mono', monospace", fontSize: "12px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,212,255,0.15)" }}>
                        {["TICKER", "SHARES", "AVG BUY", "CURRENT", "MKT VALUE", "P&L $", "P&L %", ""].map(h => (
                          <th key={h} style={{ padding: "8px 12px", color: "rgba(0,212,255,0.4)", letterSpacing: "2px", fontSize: "9px", textAlign: "left", fontWeight: "normal" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {portfolio.map((pos, i) => (
                        <tr key={i} className="portfolio-row" style={{ borderBottom: "1px solid rgba(0,212,255,0.06)" }}>
                          <td style={{ padding: "14px 12px", color: "#00d4ff", letterSpacing: "2px", fontWeight: "bold" }}>{pos.ticker}</td>
                          <td style={{ padding: "14px 12px", color: "#8ab4cc" }}>{pos.shares}</td>
                          <td style={{ padding: "14px 12px", color: "#8ab4cc" }}>${pos.avg_buy_price?.toFixed(2)}</td>
                          <td style={{ padding: "14px 12px", color: "#f0f8ff" }}>${pos.current_price?.toFixed(2)}</td>
                          <td style={{ padding: "14px 12px", color: "#f0f8ff" }}>${pos.market_value?.toFixed(2)}</td>
                          <td style={{ padding: "14px 12px", color: pos.pnl >= 0 ? "#00ff9f" : "#ff2d6b", textShadow: pos.pnl >= 0 ? "0 0 8px #00ff9f66" : "0 0 8px #ff2d6b66" }}>
                            {pos.pnl >= 0 ? "+" : ""}${pos.pnl?.toFixed(2)}
                          </td>
                          <td style={{ padding: "14px 12px", color: pos.pnl_pct >= 0 ? "#00ff9f" : "#ff2d6b" }}>
                            {pos.pnl_pct >= 0 ? "▲" : "▼"} {Math.abs(pos.pnl_pct?.toFixed(2))}%
                          </td>
                          <td style={{ padding: "14px 12px" }}>
                            <button onClick={() => deletePosition(pos.ticker)} style={{ background: "rgba(255,45,107,0.08)", border: "1px solid rgba(255,45,107,0.25)", color: "#ff2d6b", fontFamily: "'Share Tech Mono', monospace", fontSize: "9px", padding: "4px 10px", borderRadius: "2px", cursor: "crosshair", letterSpacing: "1px" }}>
                              ✕ REMOVE
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AI SIGNALS TAB ── */}
        {activeTab === "signals" && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <p className="section-label">// AI TRADE SIGNALS — POWERED BY CLAUDE</p>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", color: "rgba(0,212,255,0.3)" }}>
                  Add positions in Portfolio tab → click RUN ANALYSIS to generate BUY / SELL / HOLD signals.
                </p>
              </div>
              <button className="ticker-btn active" onClick={fetchSignals} disabled={loadingSignals} style={{ letterSpacing: "1px", padding: "10px 20px" }}>
                {loadingSignals ? "ANALYZING..." : "⚡ RUN ANALYSIS"}
              </button>
            </div>

            {loadingSignals ? (
              <div style={{ textAlign: "center", padding: "80px" }}>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", color: "rgba(0,212,255,0.4)", letterSpacing: "4px", fontSize: "13px", marginBottom: "12px" }}>
                  CLAUDE IS ANALYZING YOUR POSITIONS...
                </p>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", color: "rgba(0,212,255,0.2)" }}>
                  This may take 30–60 seconds depending on number of positions.
                </p>
              </div>
            ) : signals.length === 0 ? (
              <div className="cyber-card" style={{ padding: "60px", textAlign: "center" }}>
                <p style={{ fontFamily: "'Orbitron', monospace", fontSize: "14px", color: "rgba(0,212,255,0.2)", letterSpacing: "4px", marginBottom: "12px" }}>NO SIGNALS GENERATED</p>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", color: "rgba(0,212,255,0.15)" }}>Add positions in Portfolio tab → click RUN ANALYSIS</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "16px" }}>
                {signals.map((sig, i) => {
                  const sc = sig.signal === "BUY" ? "#00ff9f" : sig.signal === "SELL" ? "#ff2d6b" : "#f0c040";
                  return (
                    <div key={i} className="signal-card" style={{ border: `1px solid ${sc}44`, boxShadow: `0 0 20px ${sc}18` }}>
                      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "20px", fontWeight: 700, color: "#00d4ff", letterSpacing: "3px" }}>{sig.ticker}</span>
                        <span style={{ fontFamily: "'Orbitron', monospace", fontSize: "13px", fontWeight: 900, color: sc, letterSpacing: "3px", padding: "6px 16px", border: `1px solid ${sc}55`, borderRadius: "2px", textShadow: `0 0 12px ${sc}`, boxShadow: `0 0 12px ${sc}22` }}>
                          {sig.signal}
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
                        {[
                          ["CURRENT PRICE", `$${sig.current_price?.toFixed(2)}`, "#f0f8ff"],
                          ["AVG BUY PRICE", `$${sig.avg_buy_price?.toFixed(2)}`, "#f0f8ff"],
                          ["UNREALIZED P&L", `${sig.pnl_pct >= 0 ? "+" : ""}${sig.pnl_pct?.toFixed(2)}%`, sig.pnl_pct >= 0 ? "#00ff9f" : "#ff2d6b"],
                          ["AI CONFIDENCE", `${sig.confidence}%`, sc]
                        ].map(([label, value, color]) => (
                          <div key={label} style={{ background: "rgba(0,10,20,0.6)", padding: "10px 12px", borderRadius: "2px", border: "1px solid rgba(0,212,255,0.08)" }}>
                            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", letterSpacing: "2px", color: "rgba(0,212,255,0.35)", marginBottom: "4px" }}>{label}</p>
                            <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "14px", color, textShadow: color !== "#f0f8ff" ? `0 0 6px ${color}88` : "none" }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "rgba(0,10,20,0.6)", padding: "12px 14px", borderRadius: "2px", border: "1px solid rgba(0,212,255,0.08)", marginBottom: "12px" }}>
                        <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", letterSpacing: "2px", color: "rgba(0,212,255,0.35)", marginBottom: "6px" }}>CLAUDE REASONING</p>
                        <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", color: "#8ab4cc", lineHeight: "1.5" }}>{sig.reasoning}</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div style={{ background: "rgba(255,45,107,0.06)", padding: "10px 12px", borderRadius: "2px", border: "1px solid rgba(255,45,107,0.2)" }}>
                          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", letterSpacing: "2px", color: "rgba(255,45,107,0.5)", marginBottom: "4px" }}>⬇ STOP LOSS</p>
                          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "14px", color: "#ff2d6b" }}>{sig.stop_loss || "—"}</p>
                        </div>
                        <div style={{ background: "rgba(0,255,159,0.06)", padding: "10px 12px", borderRadius: "2px", border: "1px solid rgba(0,255,159,0.2)" }}>
                          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "8px", letterSpacing: "2px", color: "rgba(0,255,159,0.5)", marginBottom: "4px" }}>⬆ TAKE PROFIT</p>
                          <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "14px", color: "#00ff9f" }}>{sig.take_profit || "—"}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}