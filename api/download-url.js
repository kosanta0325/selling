import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  BUCKET, missingEnv, makeR2, makeSupabase, getUserFromRequest, parseKey,
} from './_r2.js'

const REQUIRED = [
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
]

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const missing = missingEnv(REQUIRED)
    if (missing.length) {
      return res.status(500).json({ error: `サーバー環境変数が未設定です: ${missing.join(', ')}` })
    }

    const supabase = makeSupabase()
    const user = await getUserFromRequest(req, supabase)
    if (!user) return res.status(401).json({ error: '認証が必要です' })

    const { key, fileName } = req.query
    const transactionId = parseKey(key)
    if (!transactionId) return res.status(400).json({ error: '無効なキーです' })

    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .select('buyer_id, seller_id, status')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) return res.status(404).json({ error: '取引が見つかりません' })

    const isBuyer = txn.buyer_id === user.id
    const isSeller = txn.seller_id === user.id
    if (!isBuyer && !isSeller) return res.status(403).json({ error: 'アクセス権限がありません' })

    // キャンセル済み取引では購入者のダウンロードを止める（返金後にデータだけ渡らないように）
    if (txn.status === 'cancelled' && !isSeller) {
      return res.status(403).json({ error: 'キャンセル済みの取引のためダウンロードできません' })
    }

    const name = fileName || key.split('/').pop()

    const url = await getSignedUrl(
      makeR2(),
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        // ブラウザ上で実行されないよう、必ず添付ファイルとして扱わせる
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        ResponseContentType: 'application/octet-stream',
      }),
      { expiresIn: 300 } // 5分
    )

    res.json({ url, fileName: name })
  } catch (err) {
    console.error('download-url error:', err)
    res.status(500).json({ error: err.message || 'Unknown server error' })
  }
}
