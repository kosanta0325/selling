import { S3Client } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

export const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME

/** 必要な環境変数を検証し、足りなければ変数名の配列を返す */
export function missingEnv(names) {
  return names.filter(n => !process.env[n])
}

export function makeR2() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  })
}

export function makeSupabase() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  )
}

export function makeSupabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

/** Authorization ヘッダーの JWT からユーザーを取得。失敗時は null */
export async function getUserFromRequest(req, supabase) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * R2 キーを検証し transactionId を返す。
 * 期待する形式: transactions/<uuid>/<filename>
 * パストラバーサルや階層の追加を拒否する。
 */
export function parseKey(key) {
  if (typeof key !== 'string' || !key) return null
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) return null
  const parts = key.split('/')
  if (parts.length !== 3) return null
  if (parts[0] !== 'transactions') return null
  if (!UUID_RE.test(parts[1])) return null
  if (!parts[2] || parts[2] === '.' || parts[2] === '..') return null
  return parts[1]
}

/** ファイル名から R2 キーに使える安全な文字列を作る */
export function safeFileName(name) {
  return String(name || 'file')
    .replace(/[^\w.\-　-鿿豈-﫿]/g, '_')
    .slice(0, 120)
}
