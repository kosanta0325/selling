import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  BUCKET, missingEnv, makeR2, makeSupabase, makeSupabaseAdmin,
  getUserFromRequest, safeFileName,
} from './_r2.js'

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024 // 100MB

const REQUIRED = [
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const missing = missingEnv(REQUIRED)
    if (missing.length) {
      return res.status(500).json({ error: `サーバー環境変数が未設定です: ${missing.join(', ')}` })
    }

    const supabase = makeSupabase()
    const user = await getUserFromRequest(req, supabase)
    if (!user) return res.status(401).json({ error: '認証が必要です' })

    let body = req.body
    if (typeof body === 'string') {
      try { body = JSON.parse(body) } catch { body = {} }
    }
    const { transactionId, fileName, contentType, size } = body || {}

    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' })
    if (!fileName) return res.status(400).json({ error: 'fileName is required' })

    if (typeof size !== 'number' || size <= 0) {
      return res.status(400).json({ error: 'ファイルサイズが不正です' })
    }
    if (size > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: `ファイルが大きすぎます（最大${MAX_UPLOAD_BYTES / 1024 / 1024}MB）` })
    }

    // その取引の販売者本人かつ、キャンセル済みでないことを確認。
    // RLS で anon からは読めないため、JWT 検証済みの上で service role を使う。
    const { data: txn, error: txnError } = await makeSupabaseAdmin()
      .from('transactions')
      .select('seller_id, status')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) return res.status(404).json({ error: '取引が見つかりません' })
    if (txn.seller_id !== user.id) return res.status(403).json({ error: 'アクセス権限がありません' })
    if (txn.status === 'cancelled') {
      return res.status(400).json({ error: 'キャンセル済みの取引には納品できません' })
    }

    // キーはサーバー側で決定する（クライアントに決めさせない）
    const key = `transactions/${transactionId}/${Date.now()}_${safeFileName(fileName)}`
    const type = contentType || 'application/octet-stream'

    const uploadUrl = await getSignedUrl(
      makeR2(),
      new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: type }),
      { expiresIn: 600 } // 10分
    )

    res.json({ uploadUrl, key, contentType: type })
  } catch (err) {
    console.error('upload-url error:', err)
    res.status(500).json({ error: err.message || 'Unknown server error' })
  }
}
