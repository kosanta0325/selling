const { calculateRSI, calculateEMA } = require('./indicators');

// RSI + 移動平均クロスオーバー 複合戦略
// 買い条件: RSI < oversold かつ 短期EMA が 長期EMA を上抜け
// 売り条件: RSI > overbought かつ 短期EMA が 長期EMA を下抜け

function getSignal(prices, config) {
  const { rsi: rsiConfig, movingAverage: maConfig } = config;

  const rsi = calculateRSI(prices, rsiConfig.period);
  const shortEMA = calculateEMA(prices, maConfig.shortPeriod);
  const longEMA = calculateEMA(prices, maConfig.longPeriod);

  if (rsi === null || shortEMA === null || longEMA === null) {
    return { signal: 'HOLD', rsi, shortEMA, longEMA };
  }

  // 前の足でのEMAクロス確認用
  const prevPrices = prices.slice(0, -1);
  const prevShortEMA = calculateEMA(prevPrices, maConfig.shortPeriod);
  const prevLongEMA = calculateEMA(prevPrices, maConfig.longPeriod);

  const crossedUp = prevShortEMA < prevLongEMA && shortEMA >= longEMA;
  const crossedDown = prevShortEMA > prevLongEMA && shortEMA <= longEMA;

  let signal = 'HOLD';
  let reason = '';

  if (rsi < rsiConfig.oversold && crossedUp) {
    signal = 'BUY';
    reason = `RSI(${rsi.toFixed(1)}) 売られ過ぎ + ゴールデンクロス`;
  } else if (rsi > rsiConfig.overbought && crossedDown) {
    signal = 'SELL';
    reason = `RSI(${rsi.toFixed(1)}) 買われ過ぎ + デッドクロス`;
  } else if (rsi < rsiConfig.oversold) {
    signal = 'BUY';
    reason = `RSI(${rsi.toFixed(1)}) 売られ過ぎ`;
  } else if (rsi > rsiConfig.overbought) {
    signal = 'SELL';
    reason = `RSI(${rsi.toFixed(1)}) 買われ過ぎ`;
  }

  return { signal, reason, rsi, shortEMA, longEMA };
}

module.exports = { getSignal };
