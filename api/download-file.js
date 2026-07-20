import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const { key, fileName } = req.query
    if (!key) return res.status(400).json({ error: 'No key provided' })

    // JWT 検証
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: '認証が必要です' })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: '認証が無効です' })

    // key = "transactions/<transactionId>/..." の形式から transactionId を抽出
    const parts = key.split('/')
    if (parts[0] !== 'transactions' || parts.length < 3) {
      return res.status(400).json({ error: '無効なキーです' })
    }
    const transactionId = parts[1]

    // リクエスト者がその取引の buyer または seller か確認
    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) return res.status(404).json({ error: '取引が見つかりません' })
    if (txn.buyer_id !== user.id && txn.seller_id !== user.id) {
      return res.status(403).json({ error: 'アクセス権限がありません' })
    }

    const obj = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))

    const name = fileName || key.split('/').pop()
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`)
    res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream')
    if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength)

    obj.Body.pipe(res)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
