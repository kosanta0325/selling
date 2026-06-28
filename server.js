import express from 'express'
import cors from 'cors'
import multer from 'multer'
import Stripe from 'stripe'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } })

/* ── Stripe ── */
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'jpy' } = req.body
    if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount' })
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency })
    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    console.error('Stripe error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ── R2 upload ── */
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' })

    // multer は latin1 でデコードするため UTF-8 に変換
    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
    const { transactionId } = req.body
    const safeName = fileName.replace(/[^\w.\-　-鿿豈-﫿]/g, '_')
    const key = `transactions/${transactionId}/${Date.now()}_${safeName}`

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      // ダウンロード時のファイル名をヘッダーに保存
      ContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }))

    res.json({ key, fileName })
  } catch (err) {
    console.error('R2 upload error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ── R2 download (サーバー経由でストリーム) ── */
app.get('/api/download-file', async (req, res) => {
  try {
    const { key, fileName } = req.query
    if (!key) return res.status(400).json({ error: 'No key provided' })

    const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
    const obj = await r2.send(cmd)

    const name = fileName || key.split('/').pop()
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(name)}`)
    res.setHeader('Content-Type', obj.ContentType || 'application/octet-stream')
    if (obj.ContentLength) res.setHeader('Content-Length', obj.ContentLength)

    obj.Body.pipe(res)
  } catch (err) {
    console.error('R2 download error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on port ${PORT}`))
