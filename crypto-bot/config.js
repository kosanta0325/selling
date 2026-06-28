module.exports = {
  // 取引ペア
  symbol: 'BTC/USDT',
  binanceSymbol: 'BTCUSDT',

  // ペーパートレード用初期資産 (USDT)
  initialCapital: 10000,

  // 戦略設定
  strategy: 'RSI_MA', // RSI_MA | RSI | MA

  rsi: {
    period: 14,
    oversold: 30,    // RSI < 30 で買いシグナル
    overbought: 70,  // RSI > 70 で売りシグナル
  },

  movingAverage: {
    shortPeriod: 9,   // 短期MA
    longPeriod: 21,   // 長期MA
  },

  // 1トレードで使う資産の割合 (0.0 ~ 1.0)
  tradeRatio: 0.3,

  // ストップロス / テイクプロフィット
  stopLoss: 0.03,    // 3% 下落で損切り
  takeProfit: 0.05,  // 5% 上昇で利確

  // 取引所API (ライブ取引時に設定)
  exchange: 'binance',
  apiKey: '',
  apiSecret: '',

  // true: ペーパートレード (仮想), false: 実際の取引
  paperTrading: true,

  // チェック間隔 (ミリ秒)
  interval: 60000, // 1分

  // ローソク足の時間軸
  timeframe: '1m',

  // APIサーバーのポート
  port: 3001,
};
