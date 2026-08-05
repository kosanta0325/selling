import { HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import {
  BUCKET, missingEnv, makeR2, makeSupabase, makeSupabaseAdmin,
  getUserFromRequest, parseKey,
} from './_r2.js'
import { MAX_UPLOAD_BYTES } from './upload-url.js'

const REQUIRED = [
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

function nowStamp() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

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
    const { key, fileName, note } = body || {}

    const transactionId = parseKey(key)
    if (!transactionId) return res.status(400).json({ error: '無効なキーです' })

    const admin = makeSupabaseAdmin()

    const { data: txn, error: txnError } = await admin
      .from('transactions')
      .select('seller_id, status, messages')
      .eq('id', transactionId)
      .single()

    if (txnError) return res.status(500).json({ error: `取引取得失敗: ${txnError.message}` })
    if (!txn) return res.status(404).json({ error: '取引が見つかりません' })
    if (txn.seller_id !== user.id) return res.status(403).json({ error: 'アクセス権限がありません' })
    if (txn.status === 'cancelled') {
      return res.status(400).json({ error: 'キャンセル済みの取引には納品できません' })
    }

    // 実際に R2 に上がったか、サイズが上限内かを確認する
    const r2 = makeR2()
    let head
    try {
      head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    } catch {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' })
    }

    if (head.ContentLength > MAX_UPLOAD_BYTES) {
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })).catch(() => {})
      return res.status(400).json({ error: `ファイルが大きすぎます（最大${MAX_UPLOAD_BYTES / 1024 / 1024}MB）` })
    }

    // 納品メッセージとステータスはサーバー側で確定させる
    const messages = Array.isArray(txn.messages) ? txn.messages : []
    const msg = {
      id: `m-${Date.now()}`,
      from: 'seller',
      type: 'delivery',
      content: '納品が完了しました。ファイルをダウンロードしてください。',
      r2Key: key,
      fileName: fileName || key.split('/').pop(),
      deliveryNote: typeof note === 'string' ? note.trim().slice(0, 2000) : '',
      sentAt: nowStamp(),
    }

    const { error: updateError } = await admin
      .from('transactions')
      .update({
        messages: [...messages, msg],
        r2_key: key,
        file_name: msg.fileName,
        status: 'delivered',
      })
      .eq('id', transactionId)

    if (updateError) return res.status(500).json({ error: `更新失敗: ${updateError.message}` })

    res.json({ ok: true, message: msg })
  } catch (err) {
    console.error('attach-file error:', err)
    res.status(500).json({ error: err.message || 'Unknown server error' })
  }
}
