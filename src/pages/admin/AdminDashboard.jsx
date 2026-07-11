import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentTx, setRecentTx] = useState([])
  const [revenueChart, setRevenueChart] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      { data: allUsers },
      { data: newUsers },
      { data: products },
      { data: allTx },
      { data: monthTx },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id').gte('created_at', startOfMonth),
      supabase.from('products').select('id, status, category'),
      supabase.from('transactions').select('id, amount, created_at, buyer:profiles!buyer_id(username), product:products!product_id(title)').order('created_at', { ascending: false }),
      supabase.from('transactions').select('amount').gte('created_at', startOfMonth),
    ])

    const totalRevenue = (allTx || []).reduce((s, t) => s + (t.amount || 0), 0)
    const monthRevenue = (monthTx || []).reduce((s, t) => s + (t.amount || 0), 0)

    setStats({
      totalUsers: allUsers?.length || 0,
      newUsersThisMonth: newUsers?.length || 0,
      totalProducts: (products || []).filter(p => p.status === 'active').length,
      pendingReview: (products || []).filter(p => p.status === 'pending').length,
      totalTransactions: allTx?.length || 0,
      monthTransactions: monthTx?.length || 0,
      totalRevenue,
      monthRevenue,
    })

    setRecentTx((allTx || []).slice(0, 5))

    // 過去6ヶ月の売上集計
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const label = `${d.getMonth() + 1}月`
      const total = (allTx || [])
        .filter(t => {
          const td = new Date(t.created_at)
          return td >= d && td < end
        })
        .reduce((s, t) => s + (t.amount || 0), 0)
      months.push({ month: label, value: total })
    }
    setRevenueChart(months)

    // カテゴリ別商品数
    const catCount = {}
    ;(products || []).forEach(p => {
      if (p.category) catCount[p.category] = (catCount[p.category] || 0) + 1
    })
    const total = Object.values(catCount).reduce((s, v) => s + v, 0) || 1
    const COLORS = ['#2438A6', '#E8542F', '#16a34a', '#d97706', '#5A6180']
    const cats = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], i) => ({ name, pct: Math.round(count / total * 100), color: COLORS[i] }))
    setCategoryData(cats)

    setLoading(false)
  }

  const maxVal = Math.max(...revenueChart.map(d => d.value), 1)

  const STAT_CARDS = stats ? [
    { label: '今月の売上', value: `¥${stats.monthRevenue.toLocaleString()}`, sub: `累計 ¥${stats.totalRevenue.toLocaleString()}`, icon: '◈', color: '#2438A6', glow: 'rgba(36,56,166,0.1)' },
    { label: '今月の取引数', value: stats.monthTransactions, sub: `累計 ${stats.totalTransactions.toLocaleString()}件`, icon: '◉', color: '#2438A6', glow: 'rgba(36,56,166,0.1)' },
    { label: '総ユーザー数', value: stats.totalUsers.toLocaleString(), sub: `今月 +${stats.newUsersThisMonth}人`, icon: '◎', color: '#16a34a', glow: 'rgba(22,163,74,0.1)' },
    { label: '審査待ち商品', value: stats.pendingReview, sub: `公開中 ${stats.totalProducts}件`, icon: '◆', color: '#E8542F', glow: 'rgba(232,84,47,0.1)', alert: true },
  ] : []

  const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) {
    return <div style={{ padding: 40, color: '#5A6180', fontSize: 13 }}>読み込み中...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>ダッシュボード</h1>
        <span style={styles.pageDate}>{today}</span>
      </div>

      <div style={styles.statsGrid}>
        {STAT_CARDS.map(card => (
          <div key={card.label} style={{ ...styles.statCard, ...(card.alert ? styles.statCardAlert : {}) }}>
            <div style={{ ...styles.statIcon, color: card.color, boxShadow: `0 0 16px ${card.glow}`, backgroundColor: card.glow }}>
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

      <div style={styles.chartCard}>
        <div style={styles.chartHeader}>
          <h2 style={styles.chartTitle}>月次売上推移</h2>
          <span style={styles.chartBadge}>過去6ヶ月</span>
        </div>
        <div style={styles.chartArea}>
          {revenueChart.map((d, i) => {
            const pct = d.value / maxVal
            return (
              <div key={i} style={styles.barGroup}>
                <div style={styles.barLabel}>{d.value > 0 ? `¥${(d.value / 10000).toFixed(1)}万` : '¥0'}</div>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, height: `${pct * 100}%` }} />
                </div>
                <div style={styles.barMonth}>{d.month}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={styles.bottomRow}>
        <div style={styles.activityCard}>
          <h2 style={styles.sectionTitle}>最近の取引</h2>
          {recentTx.length === 0 ? (
            <div style={{ color: '#8A90A8', fontSize: 13, padding: '20px 0' }}>取引なし</div>
          ) : (
            <div style={styles.activityList}>
              {recentTx.map((tx, i) => (
                <div key={i} style={styles.activityItem}>
                  <div style={styles.activityAvatar}>{(tx.buyer?.username || '?')[0].toUpperCase()}</div>
                  <div style={styles.activityInfo}>
                    <div style={styles.activityUser}>{tx.buyer?.username || '不明'}</div>
                    <div style={styles.activityProduct}>{tx.product?.title || '—'}</div>
                  </div>
                  <div style={styles.activityRight}>
                    <div style={styles.activityAmount}>+¥{(tx.amount || 0).toLocaleString()}</div>
                    <div style={styles.activityTime}>{new Date(tx.created_at).toLocaleDateString('ja-JP')}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.categoryCard}>
          <h2 style={styles.sectionTitle}>カテゴリ別商品数</h2>
          {categoryData.length === 0 ? (
            <div style={{ color: '#8A90A8', fontSize: 13, padding: '20px 0' }}>データなし</div>
          ) : (
            <div style={styles.categoryList}>
              {categoryData.map((cat, i) => (
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
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { padding: '32px 32px 60px', maxWidth: 1100 },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: '#101B3E', letterSpacing: '-0.5px', fontFamily: "'Sora', sans-serif" },
  pageDate: { fontSize: 13, color: '#5A6180' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 },
  statCard: { backgroundColor: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #D8DCE9', display: 'flex', alignItems: 'flex-start', gap: 14 },
  statCardAlert: { borderColor: 'rgba(232,84,47,0.3)' },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
  statContent: {},
  statLabel: { fontSize: 11, color: '#5A6180', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 3 },
  statSub: { fontSize: 11, color: '#8A90A8' },
  chartCard: { backgroundColor: '#fff', borderRadius: 14, padding: '22px 24px', border: '1px solid #D8DCE9', marginBottom: 20 },
  chartHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  chartTitle: { fontSize: 15, fontWeight: 700, color: '#101B3E' },
  chartBadge: { fontSize: 11, color: '#5A6180', backgroundColor: '#F6F7F4', padding: '3px 9px', borderRadius: 6, border: '1px solid #D8DCE9' },
  chartArea: { display: 'flex', alignItems: 'flex-end', gap: 12, height: 160 },
  barGroup: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' },
  barLabel: { fontSize: 10, color: '#5A6180', marginBottom: 6, whiteSpace: 'nowrap' },
  barTrack: { flex: 1, width: '60%', backgroundColor: 'rgba(36,56,166,0.08)', borderRadius: 6, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', background: '#2438A6', borderRadius: 6, transition: 'height 0.5s ease' },
  barMonth: { fontSize: 11, color: '#5A6180', marginTop: 6 },
  bottomRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  activityCard: { backgroundColor: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid #D8DCE9' },
  categoryCard: { backgroundColor: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid #D8DCE9' },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#5A6180', marginBottom: 16, letterSpacing: '0.02em' },
  activityList: { display: 'flex', flexDirection: 'column', gap: 12 },
  activityItem: { display: 'flex', alignItems: 'center', gap: 10 },
  activityAvatar: { width: 30, height: 30, borderRadius: '50%', background: '#2438A6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  activityInfo: { flex: 1, minWidth: 0 },
  activityUser: { fontSize: 12, fontWeight: 600, color: '#5A6180' },
  activityProduct: { fontSize: 11, color: '#8A90A8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  activityRight: { textAlign: 'right', flexShrink: 0 },
  activityAmount: { fontSize: 13, fontWeight: 700, color: '#16a34a' },
  activityTime: { fontSize: 10, color: '#8A90A8' },
  categoryList: { display: 'flex', flexDirection: 'column', gap: 14 },
  categoryItem: {},
  catTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 5 },
  catName: { fontSize: 12, color: '#5A6180', fontWeight: 500 },
  catPct: { fontSize: 12, fontWeight: 700 },
  catBarTrack: { height: 5, backgroundColor: 'rgba(36,56,166,0.08)', borderRadius: 3, overflow: 'hidden' },
  catBarFill: { height: '100%', borderRadius: 3, transition: 'width 0.5s ease', opacity: 0.85 },
}
