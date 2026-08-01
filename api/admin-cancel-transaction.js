import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '認証が必要です' })

  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: '認証が無効です' })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return res.status(403).json({ error: '管理者権限が必要です' })

  const { transactionId } = req.body
  if (!transactionId) return res.status(400).json({ error: 'transactionId is required' })

  const { data: txn } = await supabaseAdmin
    .from('transactions')
    .select('status')
    .eq('id', transactionId)
    .single()

  if (!txn) return res.status(404).json({ error: '取引が見つかりません' })
  if (['cancelled', 'completed'].includes(txn.status)) {
    return res.status(400).json({ error: 'この取引はキャンセルできません' })
  }

  const { error } = await supabaseAdmin
    .from('transactions')
    .update({ status: 'cancelled' })
    .eq('id', transactionId)

  if (error) return res.status(500).json({ error: error.message })

  res.json({ ok: true })
}
