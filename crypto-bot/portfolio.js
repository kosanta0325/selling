// ペーパートレーディング用ポートフォリオ管理

class Portfolio {
  constructor(initialCapital) {
    this.usdt = initialCapital;
    this.crypto = 0;
    this.initialCapital = initialCapital;
    this.trades = [];
    this.position = null; // 現在のポジション { price, amount, time }
  }

  // 買い注文
  buy(price, ratio, reason = '') {
    if (this.position) return null; // すでにポジションあり
    const amount = (this.usdt * ratio) / price;
    const cost = amount * price;
    if (cost <= 0) return null;

    this.usdt -= cost;
    this.crypto += amount;
    this.position = { price, amount, time: new Date() };

    const trade = {
      type: 'BUY',
      price,
      amount,
      cost,
      reason,
      time: new Date().toISOString(),
      portfolioValue: this.getValue(price),
    };
    this.trades.push(trade);
    return trade;
  }

  // 売り注文
  sell(price, reason = '') {
    if (!this.position || this.crypto <= 0) return null;

    const amount = this.crypto;
    const revenue = amount * price;
    const profit = revenue - this.position.amount * this.position.price;
    const profitPercent = (profit / (this.position.amount * this.position.price)) * 100;

    this.usdt += revenue;
    this.crypto = 0;

    const trade = {
      type: 'SELL',
      price,
      amount,
      revenue,
      profit,
      profitPercent: profitPercent.toFixed(2),
      reason,
      time: new Date().toISOString(),
      portfolioValue: this.getValue(price),
    };
    this.trades.push(trade);
    this.position = null;
    return trade;
  }

  // 現在の総資産価値
  getValue(currentPrice) {
    return this.usdt + this.crypto * currentPrice;
  }

  // 損益率
  getProfitPercent(currentPrice) {
    const current = this.getValue(currentPrice);
    return ((current - this.initialCapital) / this.initialCapital) * 100;
  }

  // ストップロス / テイクプロフィット チェック
  checkExitConditions(currentPrice, stopLoss, takeProfit) {
    if (!this.position) return null;
    const change = (currentPrice - this.position.price) / this.position.price;
    if (change <= -stopLoss) return 'STOP_LOSS';
    if (change >= takeProfit) return 'TAKE_PROFIT';
    return null;
  }

  getSummary(currentPrice) {
    const totalValue = this.getValue(currentPrice);
    const profitPercent = this.getProfitPercent(currentPrice);
    const wins = this.trades.filter(t => t.type === 'SELL' && t.profit > 0).length;
    const losses = this.trades.filter(t => t.type === 'SELL' && t.profit <= 0).length;
    const totalSells = wins + losses;

    return {
      usdt: this.usdt.toFixed(2),
      crypto: this.crypto.toFixed(6),
      totalValue: totalValue.toFixed(2),
      initialCapital: this.initialCapital.toFixed(2),
      profit: (totalValue - this.initialCapital).toFixed(2),
      profitPercent: profitPercent.toFixed(2),
      winRate: totalSells > 0 ? ((wins / totalSells) * 100).toFixed(1) : '0.0',
      totalTrades: this.trades.length,
      wins,
      losses,
      hasPosition: !!this.position,
      positionPrice: this.position ? this.position.price : null,
    };
  }
}

module.exports = Portfolio;
