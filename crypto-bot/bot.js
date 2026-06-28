const config = require('./config');
const { getKlines, getPrice } = require('./exchange');
const Portfolio = require('./portfolio');
const { getSignal } = require('./strategies/rsi_ma');

const portfolio = new Portfolio(config.initialCapital);
let isRunning = false;
let status = 'stopped';
let lastSignal = null;
let lastError = null;
let priceHistory = [];

async function tick() {
  try {
    // ローソク足データ取得
    const klines = await getKlines(config.binanceSymbol, config.timeframe, 100);
    const closes = klines.map(k => k.close);
    const currentPrice = closes[closes.length - 1];

    // 価格履歴を保存 (最新50件)
    priceHistory.push({ time: new Date().toISOString(), price: currentPrice });
    if (priceHistory.length > 50) priceHistory.shift();

    // ストップロス / テイクプロフィット チェック
    const exitCondition = portfolio.checkExitConditions(
      currentPrice,
      config.stopLoss,
      config.takeProfit
    );
    if (exitCondition) {
      const trade = portfolio.sell(currentPrice, exitCondition === 'STOP_LOSS' ? '損切り発動' : '利確発動');
      if (trade) {
        log(`[${exitCondition}] ${trade.price.toFixed(2)} USDT で売却 | 損益: ${trade.profit.toFixed(2)} USDT (${trade.profitPercent}%)`);
        lastSignal = { signal: 'SELL', reason: trade.reason, price: currentPrice, time: new Date().toISOString() };
      }
      return;
    }

    // 売買シグナル取得
    const { signal, reason, rsi, shortEMA, longEMA } = getSignal(closes, config);
    lastSignal = { signal, reason, rsi, shortEMA, longEMA, price: currentPrice, time: new Date().toISOString() };

    if (signal === 'BUY') {
      const trade = portfolio.buy(currentPrice, config.tradeRatio, reason);
      if (trade) {
        log(`[BUY] ${currentPrice.toFixed(2)} USDT | ${reason}`);
      }
    } else if (signal === 'SELL') {
      const trade = portfolio.sell(currentPrice, reason);
      if (trade) {
        log(`[SELL] ${currentPrice.toFixed(2)} USDT | ${reason} | 損益: ${trade.profit.toFixed(2)} USDT (${trade.profitPercent}%)`);
      }
    } else {
      log(`[HOLD] 価格: ${currentPrice.toFixed(2)} USDT | RSI: ${rsi ? rsi.toFixed(1) : 'N/A'}`);
    }

    lastError = null;
  } catch (err) {
    lastError = err.message;
    log(`[ERROR] ${err.message}`);
  }
}

function log(message) {
  const time = new Date().toLocaleTimeString('ja-JP');
  console.log(`[${time}] ${message}`);
}

function start() {
  if (isRunning) return;
  isRunning = true;
  status = 'running';
  log('ボット起動 — ペーパートレードモード');
  tick();
  return setInterval(tick, config.interval);
}

function stop() {
  isRunning = false;
  status = 'stopped';
  log('ボット停止');
}

function getState(currentPrice) {
  return {
    status,
    isRunning,
    lastSignal,
    lastError,
    priceHistory,
    portfolio: portfolio.getSummary(currentPrice || (priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0)),
    trades: portfolio.trades.slice(-20), // 直近20件
    config: {
      symbol: config.symbol,
      strategy: config.strategy,
      paperTrading: config.paperTrading,
      interval: config.interval,
      tradeRatio: config.tradeRatio,
      stopLoss: config.stopLoss,
      takeProfit: config.takeProfit,
    },
  };
}

module.exports = { start, stop, getState, portfolio, priceHistory };
