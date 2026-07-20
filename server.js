import express from 'express'
import cors from 'cors'
import multer from 'multer'
import Stripe from 'stripe'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

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

/* ── JWT 検証ヘルパー ── */
async function verifyUser(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) { res.status(401).json({ error: '認証が必要です' }); return null }
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) { res.status(401).json({ error: '認証が無効です' }); return null }
  return user
}

/* ── Stripe ── */
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { productId } = req.body
    if (!productId) return res.status(400).json({ error: 'productId is required' })

    const { data: product, error: dbError } = await supabase
      .from('products')
      .select('id, price, status')
      .eq('id', productId)
      .single()

    if (dbError || !product) return res.status(404).json({ error: '商品が見つかりません' })
    if (product.status !== 'active') return res.status(400).json({ error: '現在購入できない商品です' })

    const amount = product.price
    if (!amount || amount < 1) return res.status(400).json({ error: '無効な価格です' })

    const paymentIntent = await stripe.paymentIntents.create({ amount, currency: 'jpy' })
    res.json({ clientSecret: paymentIntent.client_secret, amount })
  } catch (err) {
    console.error('Stripe error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ── R2 upload ── */
app.post('/api/upload-file', upload.single('file'), async (req, res) => {
  try {
    const user = await verifyUser(req, res)
    if (!user) return

    if (!req.file) return res.status(400).json({ error: 'No file provided' })

    const { transactionId } = req.body
    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' })

    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .select('seller_id')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) return res.status(404).json({ error: '取引が見つかりません' })
    if (txn.seller_id !== user.id) return res.status(403).json({ error: 'アクセス権限がありません' })

    const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8')
    const safeName = fileName.replace(/[^\w.\-　-鿿豈-﫿]/g, '_')
    const key = `transactions/${transactionId}/${Date.now()}_${safeName}`

    await r2.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    }))

    res.json({ key, fileName })
  } catch (err) {
    console.error('R2 upload error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/* ── R2 download ── */
app.get('/api/download-file', async (req, res) => {
  try {
    const user = await verifyUser(req, res)
    if (!user) return

    const { key, fileName } = req.query
    if (!key) return res.status(400).json({ error: 'No key provided' })

    const parts = key.split('/')
    if (parts[0] !== 'transactions' || parts.length < 3) {
      return res.status(400).json({ error: '無効なキーです' })
    }
    const transactionId = parts[1]

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
    console.error('R2 download error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on port ${PORT}`))
