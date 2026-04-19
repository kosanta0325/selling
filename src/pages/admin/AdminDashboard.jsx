import { ADMIN_STATS, REVENUE_CHART } from '../../data/adminData.js'

const STAT_CARDS = [
  { label: '今月の売上', value: `¥${ADMIN_STATS.monthRevenue.toLocaleString()}`, sub: `累計 ¥${ADMIN_STATS.totalRevenue.toLocaleString()}`, icon: '◈', color: '#22d3ee', glow: 'rgba(34,211,238,0.2)' },
  { label: '今月の取引数', value: ADMIN_STATS.monthTransactions, sub: `累計 ${ADMIN_STATS.totalTransactions.toLocaleString()}件`, icon: '◉', color: '#a78bfa', glow: 'rgba(167,139,250,0.2)' },
  { label: '総ユーザー数', value: ADMIN_STATS.totalUsers.toLocaleString(), sub: `今月 +${ADMIN_STATS.newUsersThisMonth}人`, icon: '◎', color: '#34d399', glow: 'rgba(52,211,153,0.2)' },
  { label: '審査待ち商品', value: ADMIN_STATS.pendingReview, sub: `公開中 ${ADMIN_STATS.totalProducts}件`, icon: '◆', color: '#fb923c', glow: 'rgba(251,146,60,0.2)', alert: true },
]

const maxVal = Math.max(...REVENUE_CHART.map(d => d.value))

export default function AdminDashboard() {
  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>ダッシュボード</h1>
        <span style={styles.pageDate}>2026年4月13日</span>
      </div>

      {/* Stat cards */}
      <div style={styles.statsGrid}>
        {STAT_CARDS.map(card => (
          <div key={card.label} style={{ ...styles.statCard, ...(card.alert ? styles.statCardAlert : {}) }}>
            <div style={{ ...styles.statIcon, color: card.color, boxShadow: `0 0 16px ${card.glow}`, backgroundColor: `${card.glow}` }}>
              {card.icon}
            </div>
            <div style={styles.statContent}>
              <div style={styles.statLabel}>{card.label}</div>
              <div style={{ ...styles.statValue, color: card.color }}>{card.value}</div>
              <div style={styles.statSub}>{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h2 style={styles.chartTitle}>月次売上推移</h2>
          <span style={styles.chartBadge}>過去6ヶ月</span>
        </div>
        <div style={styles.chartArea}>
          {REVENUE_CHART.map((d, i) => {
            const pct = d.value / maxVal
            return (
              <div key={i} style={styles.barGroup}>
                <div style={styles.barLabel}>¥{(d.value / 10000).toFixed(0)}万</div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, height: `${pct * 100}%` }} />
                </div>
                <div style={styles.barMonth}>{d.month}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom row */}
      <div style={styles.bottomRow}>
        {/* Recent activity */}
        <div style={styles.activityCard}>
          <h2 style={styles.sectionTitle}>最近の取引</h2>
          <div style={styles.activityList}>
            {[
              { user: 'hanako_s', product: 'ブログ記事自動生成AI', amount: 4800, time: '5分前' },
              { user: 'kenji_buyer', product: '議事録自動要約ボット', amount: 3500, time: '23分前' },
              { user: 'tanaka_m', product: 'AIイラスト一括生成ツール', amount: 7200, time: '1時間前' },
              { user: 'sato_k', product: 'SNS投稿スケジューラーAI', amount: 5900, time: '2時間前' },
              { user: 'nakamura_r', product: 'コードレビューAIアシスタント', amount: 9800, time: '3時間前' },
            ].map((item, i) => (
              <div key={i} style={styles.activityItem}>
                <div style={styles.activityAvatar}>{item.user[0].toUpperCase()}</div>
                <div style={styles.activityInfo}>
                  <div style={styles.activityUser}>{item.user}</div>
                  <div style={styles.activityProduct}>{item.product}</div>
                </div>
                <div style={styles.activityRight}>
                  <div style={styles.activityAmount}>+¥{item.amount.toLocaleString()}</div>
                  <div style={styles.activityTime}>{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div style={styles.categoryCard}>
          <h2 style={styles.sectionTitle}>カテゴリ別売上</h2>
          <div style={styles.categoryList}>
            {[
              { name: 'テキスト生成', pct: 42, color: '#a78bfa' },
              { name: '画像生成', pct: 28, color: '#22d3ee' },
              { name: '開発支援', pct: 18, color: '#34d399' },
              { name: 'マーケティング', pct: 9, color: '#fb923c' },
              { name: 'その他', pct: 3, color: '#64748b' },
            ].map((cat, i) => (
              <div key={i} style={styles.categoryItem}>
                <div style={styles.catTop}>
                  <span style={styles.catName}>{cat.name}</span>
                  <span style={{ ...styles.catPct, color: cat.color }}>{cat.pct}%</span>
                </div>
                <div style={styles.catBarTrack}>
                  <div style={{ ...styles.catBarFill, width: `${cat.pct}%`, backgroundColor: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '32px 32px 60px',
    maxWidth: 1100,
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 800,
    color: '#f1f5f9',
    letterSpacing: '-0.5px',
  },
  pageDate: {
    fontSize: 13,
    color: '#475569',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    padding: '18px 20px',
    border: '1px solid rgba(139,92,246,0.1)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
  },
  statCardAlert: {
    borderColor: 'rgba(251,146,60,0.25)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    flexShrink: 0,
  },
  statContent: {},
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
    letterSpacing: '0.03em',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: 3,
  },
  statSub: {
    fontSize: 11,
    color: '#475569',
  },
  chartCard: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    padding: '22px 24px',
    border: '1px solid rgba(139,92,246,0.1)',
    marginBottom: 20,
  },
  chartHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: '#e2e8f0',
  },
  chartBadge: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: '3px 9px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  chartArea: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 12,
    height: 160,
  },
  barGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  },
  barLabel: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 6,
    whiteSpace: 'nowrap',
  },
  barTrack: {
    flex: 1,
    width: '60%',
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    background: 'linear-gradient(to top, #7c3aed, #22d3ee)',
    borderRadius: 6,
    transition: 'height 0.5s ease',
  },
  barMonth: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  activityCard: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    padding: '20px 22px',
    border: '1px solid rgba(139,92,246,0.1)',
  },
  categoryCard: {
    backgroundColor: '#0e0e20',
    borderRadius: 14,
    padding: '20px 22px',
    border: '1px solid rgba(139,92,246,0.1)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: 16,
    letterSpacing: '0.02em',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  activityAvatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #7c3aed, #0891b2)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activityUser: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
  },
  activityProduct: {
    fontSize: 11,
    color: '#475569',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  activityRight: {
    textAlign: 'right',
    flexShrink: 0,
  },
  activityAmount: {
    fontSize: 13,
    fontWeight: 700,
    color: '#34d399',
  },
  activityTime: {
    fontSize: 10,
    color: '#334155',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  categoryItem: {},
  catTop: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  catName: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 500,
  },
  catPct: {
    fontSize: 12,
    fontWeight: 700,
  },
  catBarTrack: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  catBarFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.5s ease',
    opacity: 0.8,
  },
}
