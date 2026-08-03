import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const missing = []
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL')
    if (!SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY')
    if (missing.length) {
      return res.status(500).json({ error: `サーバー環境変数が未設定です: ${missing.join(', ')}` })
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const supabaseAnon = createClient(SUPABASE_URL, ANON_KEY)

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: '認証が必要です' })

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: '認証が無効です' })

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) return res.status(500).json({ error: `プロフィール取得失敗: ${profileError.message}` })
    if (profile?.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' })

    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { body = {} }
    }
    const { transactionId } = body || {}
    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' })

    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('status')
      .eq('id', transactionId)
      .single()

    if (txnError) return res.status(500).json({ error: `取引取得失敗: ${txnError.message}` })
    if (!txn) return res.status(404).json({ error: '取引が見つかりません' })
    if (['cancelled', 'completed'].includes(txn.status)) {
      return res.status(400).json({ error: 'この取引はキャンセルできません' })
    }

    const { error } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'cancelled' })
      .eq('id', transactionId)

    if (error) return res.status(500).json({ error: `更新失敗: ${error.message}` })

    res.json({ ok: true })
  } catch (err) {
    console.error('admin-cancel-transaction error:', err)
    res.status(500).json({ error: err.message || 'Unknown server error' })
  }
}
