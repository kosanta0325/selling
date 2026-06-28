const express = require('express');
const cors = require('cors');
const { getPrice, get24hStats } = require('./exchange');
const bot = require('./bot');
const config = require('./config');

const app = express();
app.use(cors());
app.use(express.json());

let botInterval = null;

// ボット状態取得
app.get('/api/state', async (req, res) => {
  try {
    const price = await getPrice(config.binanceSymbol);
    res.json(bot.getState(price));
  } catch (err) {
    res.json(bot.getState(0));
  }
});

// 24時間統計取得
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await get24hStats(config.binanceSymbol);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ボット開始
app.post('/api/start', (req, res) => {
  if (!botInterval) {
    botInterval = bot.start();
    res.json({ success: true, message: 'ボットを起動しました' });
  } else {
    res.json({ success: false, message: 'すでに起動中です' });
  }
});

// ボット停止
app.post('/api/stop', (req, res) => {
  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
    bot.stop();
    res.json({ success: true, message: 'ボットを停止しました' });
  } else {
    res.json({ success: false, message: 'ボットは起動していません' });
  }
});

app.listen(config.port, () => {
  console.log(`🤖 クリプトボット APIサーバー起動: http://localhost:${config.port}`);
  console.log(`   取引ペア: ${config.symbol}`);
  console.log(`   モード: ${config.paperTrading ? 'ペーパートレード (仮想)' : '実際の取引'}`);
});
