/* ── 商品データ ── */
export const PRODUCTS = [
  {
    id: '1',
    title: 'ブログ記事自動生成AI',
    price: 4800,
    seller: 'ai_creator_taro',
    sellerAvatar: 'T',
    rating: 4.8,
    reviewCount: 32,
    category: 'テキスト生成',
    description: 'SEO最適化されたブログ記事を自動で生成するAIツールです。キーワードを入力するだけで、5000文字以上の高品質な記事を数分で作成できます。WordPress連携機能付き。\n\n【主な機能】\n- キーワードから記事構成を自動生成\n- SEOメタタグの自動最適化\n- 画像キャプションの自動生成\n- WordPress/Note等への直接投稿\n\n【対応言語】\n日本語・英語・中国語',
    deliveryDays: 1,
    paymentMethods: ['クレジットカード', 'PayPay', '銀行振込'],
    images: [
      'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
      'https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=800&q=80',
    ],
    tags: ['自動化', 'SEO', 'ブログ'],
  },
  {
    id: '2',
    title: 'AIイラスト一括生成ツール',
    price: 7200,
    seller: 'pixel_ai_lab',
    sellerAvatar: 'P',
    rating: 4.5,
    reviewCount: 18,
    category: '画像生成',
    description: 'Stable Diffusionベースのイラスト一括生成ツールです。CSVでプロンプトを一括入力し、数百枚のイラストを自動生成できます。商用利用可能なモデルを使用しています。\n\n【主な機能】\n- CSV一括インポート対応\n- スタイル統一機能\n- 背景リムーバー内蔵\n- 解像度アップスケール',
    deliveryDays: 2,
    paymentMethods: ['クレジットカード', 'PayPal'],
    images: [
      'https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=800&q=80',
      'https://images.unsplash.com/photo-1672863601879-c54f59dc2b45?w=800&q=80',
    ],
    tags: ['イラスト', '画像', '自動化'],
  },
  {
    id: '3',
    title: '議事録自動要約ボット',
    price: 3500,
    seller: 'meeting_ai',
    sellerAvatar: 'M',
    rating: 4.9,
    reviewCount: 54,
    category: 'テキスト生成',
    description: 'Zoom・Teams・Google Meetの録音ファイルをアップロードするだけで、議事録を自動生成します。重要なアクションアイテムも自動抽出。\n\n【主な機能】\n- 自動文字起こし（日本語対応）\n- 要点の自動まとめ\n- アクションアイテム抽出\n- Slack/Teams通知連携',
    deliveryDays: 1,
    paymentMethods: ['クレジットカード', 'PayPay', 'LINE Pay'],
    images: [
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800&q=80',
    ],
    tags: ['議事録', 'Zoom', '要約'],
  },
  {
    id: '4',
    title: 'SNS投稿スケジューラーAI',
    price: 5900,
    seller: 'social_ai_pro',
    sellerAvatar: 'S',
    rating: 4.3,
    reviewCount: 27,
    category: 'マーケティング',
    description: 'X(Twitter)・Instagram・TikTokの投稿文を一括生成し、最適なタイミングで自動投稿するツールです。エンゲージメント最大化のためのAI分析機能も搭載。\n\n【主な機能】\n- 複数SNS同時対応\n- 最適投稿時間の自動分析\n- ハッシュタグ自動提案\n- パフォーマンスレポート生成',
    deliveryDays: 3,
    paymentMethods: ['クレジットカード', '銀行振込'],
    images: [
      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
    ],
    tags: ['SNS', 'マーケティング', '自動投稿'],
  },
  {
    id: '5',
    title: 'ECサイト商品説明文ジェネレーター',
    price: 2800,
    seller: 'ec_ai_writer',
    sellerAvatar: 'E',
    rating: 4.6,
    reviewCount: 41,
    category: 'テキスト生成',
    description: 'Amazon・楽天・Yahoo!ショッピング向けの商品説明文を自動生成。商品名とスペックを入力するだけで、売れる説明文を即座に作成します。\n\n【主な機能】\n- 各モール形式に最適化\n- キャッチコピー自動生成\n- 箇条書き・段落の自動整形\n- A/Bテスト用バリエーション生成',
    deliveryDays: 1,
    paymentMethods: ['クレジットカード', 'PayPay', 'PayPal'],
    images: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    ],
    tags: ['EC', '商品説明', 'Amazon'],
  },
  {
    id: '6',
    title: 'コードレビューAIアシスタント',
    price: 9800,
    seller: 'dev_ai_helper',
    sellerAvatar: 'D',
    rating: 4.7,
    reviewCount: 23,
    category: '開発支援',
    description: 'GitHub PRに自動でコードレビューコメントを投稿するAIアシスタント。セキュリティ脆弱性・バグ・パフォーマンス問題を自動検出します。\n\n【主な機能】\n- GitHub Actions連携\n- 15以上の言語に対応\n- セキュリティスキャン\n- リファクタリング提案',
    deliveryDays: 2,
    paymentMethods: ['クレジットカード', '銀行振込', 'PayPal'],
    images: [
      'https://images.unsplash.com/photo-1555066931-4365d14431b9?w=800&q=80',
    ],
    tags: ['開発', 'GitHub', 'コードレビュー'],
  },
]

/* ── 取引ステータス ── */
export const STATUS_CONFIG = {
  pending:   { label: '納品待ち',     color: '#fb923c', bg: 'rgba(251,146,60,0.12)',   border: 'rgba(251,146,60,0.3)',   step: 1 },
  delivered: { label: '納品済み',     color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',   border: 'rgba(34,211,238,0.3)',   step: 2 },
  confirmed: { label: '受取確認済み', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', step: 3 },
  completed: { label: '取引完了',     color: '#34d399', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.3)',   step: 4 },
  cancelled: { label: 'キャンセル',   color: '#f87171', bg: 'rgba(248,113,113,0.12)',  border: 'rgba(248,113,113,0.3)',  step: 0 },
}

export const TIMELINE_STEPS = [
  { key: 'purchased', label: '購入完了',      icon: '✓' },
  { key: 'delivered', label: '納品済み',      icon: '📦' },
  { key: 'confirmed', label: '受取確認',      icon: '✔' },
  { key: 'completed', label: '取引完了・入金', icon: '💰' },
]

export const MOCK_TRANSACTIONS = [
  {
    id: 'txn-001',
    productId: '1',
    productTitle: 'ブログ記事自動生成AI',
    productImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
    price: 4800,
    buyer: { name: 'Hanako Suzuki', username: 'hanako_s' },
    seller: { name: 'Taro Yamada', username: 'ai_creator_taro' },
    paymentMethod: 'クレジットカード',
    status: 'delivered',
    purchasedAt: '2026-04-17 14:32',
    deliveryDeadline: '2026-04-18 14:32',
    deliveredAt: '2026-04-17 18:10',
    confirmedAt: null,
    completedAt: null,
    messages: [
      { id: 'm1', from: 'seller', type: 'text', content: 'ご購入ありがとうございます！本日中に納品いたします。', sentAt: '2026-04-17 14:45' },
      { id: 'm2', from: 'seller', type: 'delivery', content: '納品が完了しました。', deliveryUrl: 'https://drive.google.com/xxxxx', deliveryNote: 'READMEに使い方を記載しています。', sentAt: '2026-04-17 18:10' },
    ],
  },
  {
    id: 'txn-002',
    productId: '3',
    productTitle: '議事録自動要約ボット',
    productImage: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&q=80',
    price: 3500,
    buyer: { name: 'Kenji Tanaka', username: 'kenji_buyer' },
    seller: { name: 'Meeting AI', username: 'meeting_ai' },
    paymentMethod: 'PayPay',
    status: 'pending',
    purchasedAt: '2026-04-18 09:15',
    deliveryDeadline: '2026-04-19 09:15',
    deliveredAt: null,
    confirmedAt: null,
    completedAt: null,
    messages: [
      { id: 'm3', from: 'seller', type: 'text', content: 'ご購入ありがとうございます。明日中に納品予定です。', sentAt: '2026-04-18 09:30' },
    ],
  },
  {
    id: 'txn-003',
    productId: '2',
    productTitle: 'AIイラスト一括生成ツール',
    productImage: 'https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=400&q=80',
    price: 7200,
    buyer: { name: 'Taro Yamada', username: 'ai_creator_taro' },
    seller: { name: 'Pixel Lab', username: 'pixel_ai_lab' },
    paymentMethod: 'クレジットカード',
    status: 'confirmed',
    purchasedAt: '2026-04-15 11:00',
    deliveryDeadline: '2026-04-17 11:00',
    deliveredAt: '2026-04-16 15:30',
    confirmedAt: '2026-04-17 10:00',
    completedAt: null,
    messages: [
      { id: 'm4', from: 'seller', type: 'text', content: 'ご購入ありがとうございます！', sentAt: '2026-04-15 11:20' },
      { id: 'm5', from: 'seller', type: 'delivery', content: '納品完了です。GitHubリポジトリのアクセス権を付与しました。', deliveryUrl: 'https://github.com/pixel-ai-lab/tool-private', deliveryNote: 'READMEの手順に従ってください。', sentAt: '2026-04-16 15:30' },
      { id: 'm6', from: 'buyer', type: 'text', content: '受け取りました！ありがとうございます。', sentAt: '2026-04-17 10:00' },
    ],
  },
]

/* ── 管理画面データ ── */
export const ADMIN_STATS = {
  totalRevenue: 1284500,
  monthRevenue: 342000,
  totalUsers: 1842,
  newUsersThisMonth: 134,
  totalProducts: 287,
  pendingReview: 12,
  totalTransactions: 3421,
  monthTransactions: 218,
}

export const REVENUE_CHART = [
  { month: '10月', value: 210000 },
  { month: '11月', value: 285000 },
  { month: '12月', value: 198000 },
  { month: '1月',  value: 310000 },
  { month: '2月',  value: 278000 },
  { month: '3月',  value: 342000 },
]

export const PENDING_PRODUCTS = [
  { id: 'p1', title: 'SNS動画自動編集AI',    seller: 'video_creator_k',     category: 'マーケティング', price: 8800,  submittedAt: '2026-04-13 14:32', description: 'TikTok・Reels向けに動画を自動で編集・字幕追加・BGM挿入するAIツール。', image: 'https://images.unsplash.com/photo-1611162616305-c69b3396f604?w=400&q=80', status: 'pending' },
  { id: 'p2', title: '法律文書チェックAI',    seller: 'legal_ai_solutions',  category: 'テキスト生成',   price: 15000, submittedAt: '2026-04-13 11:15', description: '契約書・利用規約などの法律文書を自動でチェックし、リスク箇所を指摘するAI。', image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80', status: 'pending' },
  { id: 'p3', title: '不動産価格予測AI',      seller: 'realestate_predict',  category: 'データ分析',     price: 12000, submittedAt: '2026-04-12 18:45', description: '住所・築年数・面積を入力するだけで、AIが不動産の適正価格を予測します。', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80', status: 'pending' },
  { id: 'p4', title: 'AIチャットボット構築ツール', seller: 'bot_factory_j', category: '開発支援',       price: 9500,  submittedAt: '2026-04-12 10:20', description: 'コードなしでカスタムAIチャットボットを構築できるノーコードツール。', image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&q=80', status: 'pending' },
  { id: 'p5', title: '音声クローニングAI',    seller: 'voice_ai_lab',        category: 'その他',         price: 6800,  submittedAt: '2026-04-11 22:10', description: '3分の音声サンプルから声をクローニングし、任意のテキストを読み上げます。', image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80', status: 'pending' },
]

export const PUBLISHED_PRODUCTS = [
  { id: 'pub1', title: 'ブログ記事自動生成AI',    seller: 'ai_creator_taro', category: 'テキスト生成', price: 4800, sales: 32, status: 'published' },
  { id: 'pub2', title: 'AIイラスト一括生成ツール', seller: 'pixel_ai_lab',   category: '画像生成',     price: 7200, sales: 18, status: 'published' },
  { id: 'pub3', title: '議事録自動要約ボット',     seller: 'meeting_ai',     category: 'テキスト生成', price: 3500, sales: 54, status: 'published' },
]

export const USERS = [
  { id: 'u1',  name: 'Taro Yamada',   username: 'ai_creator_taro', email: 'taro@example.com',   role: 'seller', joinedAt: '2025-08-12', sales: 32, purchases: 5,  status: 'active',    verified: true  },
  { id: 'u2',  name: 'Pixel Lab',     username: 'pixel_ai_lab',    email: 'pixel@example.com',  role: 'seller', joinedAt: '2025-09-03', sales: 18, purchases: 2,  status: 'active',    verified: true  },
  { id: 'u3',  name: 'Meeting AI',    username: 'meeting_ai',      email: 'meet@example.com',   role: 'seller', joinedAt: '2025-07-22', sales: 54, purchases: 8,  status: 'active',    verified: true  },
  { id: 'u4',  name: 'Hanako Suzuki', username: 'hanako_s',        email: 'hanako@example.com', role: 'buyer',  joinedAt: '2025-11-01', sales: 0,  purchases: 12, status: 'active',    verified: false },
  { id: 'u5',  name: 'Dev Helper',    username: 'dev_ai_helper',   email: 'dev@example.com',    role: 'seller', joinedAt: '2025-10-15', sales: 23, purchases: 3,  status: 'active',    verified: true  },
  { id: 'u6',  name: 'Spam User',     username: 'spam_xyz',        email: 'spam@bad.com',       role: 'seller', joinedAt: '2026-01-05', sales: 0,  purchases: 0,  status: 'suspended', verified: false },
  { id: 'u7',  name: 'Kenji Tanaka',  username: 'kenji_buyer',     email: 'kenji@example.com',  role: 'buyer',  joinedAt: '2025-12-20', sales: 0,  purchases: 7,  status: 'active',    verified: false },
  { id: 'u8',  name: 'Social AI Pro', username: 'social_ai_pro',   email: 'social@example.com', role: 'seller', joinedAt: '2025-08-30', sales: 27, purchases: 1,  status: 'active',    verified: true  },
  { id: 'u9',  name: 'EC Writer',     username: 'ec_ai_writer',    email: 'ec@example.com',     role: 'seller', joinedAt: '2025-09-18', sales: 41, purchases: 4,  status: 'active',    verified: true  },
  { id: 'u10', name: 'Bad Actor',     username: 'bad_actor_99',    email: 'bad@evil.com',       role: 'seller', joinedAt: '2026-02-10', sales: 2,  purchases: 0,  status: 'banned',    verified: false },
]
