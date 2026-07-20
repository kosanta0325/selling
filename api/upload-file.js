import Busboy from 'busboy'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: false },
}

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

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // JWT をヘッダーから取得（multipart body より先に検証）
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: '認証が必要です' })

  return new Promise((resolve) => {
    const busboy = Busboy({ headers: req.headers })
    const chunks = []
    let fileName = ''
    let mimeType = 'application/octet-stream'
    let transactionId = ''

    busboy.on('field', (name, value) => {
      if (name === 'transactionId') transactionId = value
    })

    busboy.on('file', (_field, file, info) => {
      fileName = info.filename
      mimeType = info.mimeType
      file.on('data', chunk => chunks.push(chunk))
    })

    busboy.on('finish', async () => {
      try {
        if (!chunks.length) {
          res.status(400).json({ error: 'No file provided' })
          return resolve()
        }
        if (!transactionId) {
          res.status(400).json({ error: 'transactionId is required' })
          return resolve()
        }

        // JWT 検証
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) {
          res.status(401).json({ error: '認証が無効です' })
          return resolve()
        }

        // リクエスト者がその取引の seller か確認
        const { data: txn, error: txnError } = await supabase
          .from('transactions')
          .select('seller_id')
          .eq('id', transactionId)
          .single()

        if (txnError || !txn) {
          res.status(404).json({ error: '取引が見つかりません' })
          return resolve()
        }
        if (txn.seller_id !== user.id) {
          res.status(403).json({ error: 'アクセス権限がありません' })
          return resolve()
        }

        const buffer = Buffer.concat(chunks)
        const safeName = fileName.replace(/[^\w.\-　-鿿豈-﫿]/g, '_')
        const key = `transactions/${transactionId}/${Date.now()}_${safeName}`

        await r2.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        }))

        res.json({ key, fileName })
        resolve()
      } catch (err) {
        res.status(500).json({ error: err.message })
        resolve()
      }
    })

    busboy.on('error', (err) => {
      res.status(500).json({ error: err.message })
      resolve()
    })

    req.pipe(busboy)
  })
}
