const fetch = require('node-fetch');

const BINANCE_BASE = 'https://api.binance.com';

// ローソク足データを取得 (公開API、認証不要)
async function getKlines(symbol, interval = '1m', limit = 100) {
  const url = `${BINANCE_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API エラー: ${res.status}`);
  const data = await res.json();
  // [openTime, open, high, low, close, volume, ...]
  return data.map(k => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

// 現在価格を取得
async function getPrice(symbol) {
  const url = `${BINANCE_BASE}/api/v3/ticker/price?symbol=${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API エラー: ${res.status}`);
  const data = await res.json();
  return parseFloat(data.price);
}

// 24時間統計を取得
async function get24hStats(symbol) {
  const url = `${BINANCE_BASE}/api/v3/ticker/24hr?symbol=${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Binance API エラー: ${res.status}`);
  const data = await res.json();
  return {
    priceChange: parseFloat(data.priceChange),
    priceChangePercent: parseFloat(data.priceChangePercent),
    high: parseFloat(data.highPrice),
    low: parseFloat(data.lowPrice),
    volume: parseFloat(data.volume),
    lastPrice: parseFloat(data.lastPrice),
  };
}

module.exports = { getKlines, getPrice, get24hStats };
