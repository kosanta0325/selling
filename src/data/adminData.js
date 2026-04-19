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
  { month: '1月', value: 310000 },
  { month: '2月', value: 278000 },
  { month: '3月', value: 342000 },
]

export const PENDING_PRODUCTS = [
  {
    id: 'p1',
    title: 'SNS動画自動編集AI',
    seller: 'video_creator_k',
    category: 'マーケティング',
    price: 8800,
    submittedAt: '2026-04-13 14:32',
    description: 'TikTok・Reels向けに動画を自動で編集・字幕追加・BGM挿入するAIツール。モバイルアプリとして提供。\n\n【機能】\n- 自動カット編集\n- 字幕自動生成\n- BGM自動マッチング',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3396f604?w=400&q=80',
    status: 'pending',
  },
  {
    id: 'p2',
    title: '法律文書チェックAI',
    seller: 'legal_ai_solutions',
    category: 'テキスト生成',
    price: 15000,
    submittedAt: '2026-04-13 11:15',
    description: '契約書・利用規約などの法律文書を自動でチェックし、リスク箇所を指摘するAI。弁護士監修済み。',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&q=80',
    status: 'pending',
  },
  {
    id: 'p3',
    title: '不動産価格予測AI',
    seller: 'realestate_predict',
    category: 'データ分析',
    price: 12000,
    submittedAt: '2026-04-12 18:45',
    description: '住所・築年数・面積を入力するだけで、AIが不動産の適正価格を予測します。',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
    status: 'pending',
  },
  {
    id: 'p4',
    title: 'AIチャットボット構築ツール',
    seller: 'bot_factory_j',
    category: '開発支援',
    price: 9500,
    submittedAt: '2026-04-12 10:20',
    description: 'コードなしでカスタムAIチャットボットを構築できるノーコードツール。',
    image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&q=80',
    status: 'pending',
  },
  {
    id: 'p5',
    title: '音声クローニングAI',
    seller: 'voice_ai_lab',
    category: 'その他',
    price: 6800,
    submittedAt: '2026-04-11 22:10',
    description: '3分の音声サンプルから声をクローニングし、任意のテキストを読み上げます。',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&q=80',
    status: 'pending',
  },
]

export const PUBLISHED_PRODUCTS = [
  { id: 'pub1', title: 'ブログ記事自動生成AI', seller: 'ai_creator_taro', category: 'テキスト生成', price: 4800, sales: 32, status: 'published' },
  { id: 'pub2', title: 'AIイラスト一括生成ツール', seller: 'pixel_ai_lab', category: '画像生成', price: 7200, sales: 18, status: 'published' },
  { id: 'pub3', title: '議事録自動要約ボット', seller: 'meeting_ai', category: 'テキスト生成', price: 3500, sales: 54, status: 'published' },
]

export const USERS = [
  { id: 'u1', name: 'Taro Yamada', username: 'ai_creator_taro', email: 'taro@example.com', role: 'seller', joinedAt: '2025-08-12', sales: 32, purchases: 5, status: 'active', verified: true },
  { id: 'u2', name: 'Pixel Lab', username: 'pixel_ai_lab', email: 'pixel@example.com', role: 'seller', joinedAt: '2025-09-03', sales: 18, purchases: 2, status: 'active', verified: true },
  { id: 'u3', name: 'Meeting AI', username: 'meeting_ai', email: 'meet@example.com', role: 'seller', joinedAt: '2025-07-22', sales: 54, purchases: 8, status: 'active', verified: true },
  { id: 'u4', name: 'Hanako Suzuki', username: 'hanako_s', email: 'hanako@example.com', role: 'buyer', joinedAt: '2025-11-01', sales: 0, purchases: 12, status: 'active', verified: false },
  { id: 'u5', name: 'Dev Helper', username: 'dev_ai_helper', email: 'dev@example.com', role: 'seller', joinedAt: '2025-10-15', sales: 23, purchases: 3, status: 'active', verified: true },
  { id: 'u6', name: 'Spam User', username: 'spam_xyz', email: 'spam@bad.com', role: 'seller', joinedAt: '2026-01-05', sales: 0, purchases: 0, status: 'suspended', verified: false },
  { id: 'u7', name: 'Kenji Tanaka', username: 'kenji_buyer', email: 'kenji@example.com', role: 'buyer', joinedAt: '2025-12-20', sales: 0, purchases: 7, status: 'active', verified: false },
  { id: 'u8', name: 'Social AI Pro', username: 'social_ai_pro', email: 'social@example.com', role: 'seller', joinedAt: '2025-08-30', sales: 27, purchases: 1, status: 'active', verified: true },
  { id: 'u9', name: 'EC Writer', username: 'ec_ai_writer', email: 'ec@example.com', role: 'seller', joinedAt: '2025-09-18', sales: 41, purchases: 4, status: 'active', verified: true },
  { id: 'u10', name: 'Bad Actor', username: 'bad_actor_99', email: 'bad@evil.com', role: 'seller', joinedAt: '2026-02-10', sales: 2, purchases: 0, status: 'banned', verified: false },
]
