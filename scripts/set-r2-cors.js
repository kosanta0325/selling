/**
 * R2 バケットの CORS ポリシーを設定する。
 *
 *   npm run r2:cors                          # 既定のオリジンを設定
 *   npm run r2:cors -- https://example.com   # オリジンを指定（複数可）
 *
 * 実行後、設定内容を読み戻して表示する。
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3'

const DEFAULT_ORIGINS = [
  'https://selling-kohl.vercel.app',
  'http://localhost:3000',
]

const REQUIRED = [
  'CLOUDFLARE_R2_ENDPOINT',
  'CLOUDFLARE_R2_ACCESS_KEY_ID',
  'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_BUCKET_NAME',
]

const missing = REQUIRED.filter(n => !process.env[n])
if (missing.length) {
  console.error(`環境変数が不足しています: ${missing.join(', ')}`)
  console.error('.env に設定してから実行してください。')
  process.exit(1)
}

const origins = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ORIGINS
const Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const rule = {
  AllowedOrigins: origins,
  AllowedMethods: ['PUT', 'GET'],
  AllowedHeaders: ['Content-Type'],
  ExposeHeaders: ['ETag'],
  MaxAgeSeconds: 3600,
}

console.log(`バケット: ${Bucket}`)
console.log(`許可するオリジン:\n  ${origins.join('\n  ')}`)

await r2.send(new PutBucketCorsCommand({
  Bucket,
  CORSConfiguration: { CORSRules: [rule] },
}))

console.log('\n設定しました。読み戻して確認します...\n')

const current = await r2.send(new GetBucketCorsCommand({ Bucket }))
console.log(JSON.stringify(current.CORSRules, null, 2))
