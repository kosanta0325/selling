import express from 'express'
import cors from 'cors'
import multer from 'multer'
import Stripe from 'stripe'
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@supabase/supabase-js'
import { parseKey, safeFileName } from './api/_r2.js'

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

async function getFeeRate() {
  const { data } = await supabaseAdmin
    .from('platform_settings')
    .select('value')
    .eq('key', 'fee_rate')
    .single()
  return parseFloat(data?.value ?? '5')
}

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
    const user = await verifyUser(req, res)
    if (!user) return

    const { productId } = req.body
    if (!productId) return res.status(400).json({ error: 'productId is required' })

    const { data: product, error: dbError } = await supabase
      .from('products')
      .select('id, price, status, seller_id, title, images')
      .eq('id', productId)
      .single()

    if (dbError || !product) return res.status(404).json({ error: '商品が見つかりません' })
    if (product.status !== 'active') return res.status(400).json({ error: '現在購入できない商品です' })
    if (!product.seller_id) return res.status(400).json({ error: '販売者情報がない商品は購入できません' })
    if (product.seller_id === user.id) return res.status(400).json({ error: '自分の商品は購入できません' })

    const amount = product.price
    if (!amount || amount < 1) return res.status(400).json({ error: '無効な価格です' })

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
      metadata: {
        productId,
        buyerId: user.id,
        sellerId: product.seller_id,
        productTitle: (product.title || '').slice(0, 500),
        productImage: (product.images?.[0] || '').slice(0, 500),
      },
    })
    res.json({ clientSecret: paymentIntent.client_secret, amount })
  } catch (err) {
    console.error('Stripe error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/confirm-payment', async (req, res) => {
  try {
    const user = await verifyUser(req, res)
    if (!user) return

    const { paymentIntentId } = req.body
    if (!paymentIntentId) return res.status(400).json({ error: 'paymentIntentId is required' })

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: '決済が完了していません' })
    }

    const { productId, buyerId, sellerId, productTitle, productImage } = paymentIntent.metadata
    if (buyerId !== user.id) return res.status(403).json({ error: 'アクセス権限がありません' })

    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (existing) return res.json({ alreadyCreated: true, transactionId: existing.id })

    const feeRate = await getFeeRate()
    const amount = paymentIntent.amount
    const platformFee = Math.round(amount * feeRate / 100)
    const sellerPayout = amount - platformFee

    const { data: txn, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        seller_id: sellerId,
        buyer_id: buyerId,
        amount,
        platform_fee_rate: feeRate,
        platform_fee: platformFee,
        seller_payout: sellerPayout,
        product_id: productId,
        product_title: productTitle || '',
        product_image: productImage || null,
        payment_intent_id: paymentIntentId,
        status: 'pending',
        messages: [],
      })
      .select()
      .single()

    if (insertError) return res.status(500).json({ error: insertError.message })

    res.json({ transactionId: txn.id })
  } catch (err) {
    console.error('confirm-payment error:', err.message)
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

/* ── R2 直接アップロード：署名付き PUT URL を発行 ── */
app.post('/api/upload-url', async (req, res) => {
  try {
    const user = await verifyUser(req, res)
    if (!user) return

    const { transactionId, fileName, contentType, size } = req.body || {}
    if (!transactionId) return res.status(400).json({ error: 'transactionId is required' })
    if (!fileName) return res.status(400).json({ error: 'fileName is required' })
    if (typeof size !== 'number' || size <= 0) return res.status(400).json({ error: 'ファイルサイズが不正です' })
    if (size > MAX_UPLOAD_BYTES) {
      return res.status(400).json({ error: `ファイルが大きすぎます（最大${MAX_UPLOAD_BYTES / 1024 / 1024}MB）` })
    }

    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('seller_id, status')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) return res.status(404).json({ error: '取引が見つかりません' })
    if (txn.seller_id !== user.id) return res.status(403).json({ error: 'アクセス権限がありません' })
    if (txn.status === 'cancelled') return res.status(400).json({ error: 'キャンセル済みの取引には納品できません' })

    const key = `transactions/${transactionId}/${Date.now()}_${safeFileName(fileName)}`
    const type = contentType || 'application/octet-stream'

    const uploadUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: type }),
      { expiresIn: 600 }
    )

    res.json({ uploadUrl, key, contentType: type })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── R2 直接アップロード：納品として登録 ── */
app.post('/api/attach-file', async (req, res) => {
  try {
    const user = await verifyUser(req, res)
    if (!user) return

    const { key, fileName, note } = req.body || {}
    const transactionId = parseKey(key)
    if (!transactionId) return res.status(400).json({ error: '無効なキーです' })

    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('seller_id, status, messages')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) return res.status(404).json({ error: '取引が見つかりません' })
    if (txn.seller_id !== user.id) return res.status(403).json({ error: 'アクセス権限がありません' })
    if (txn.status === 'cancelled') return res.status(400).json({ error: 'キャンセル済みの取引には納品できません' })

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

    const d = new Date()
    const p = n => String(n).padStart(2, '0')
    const messages = Array.isArray(txn.messages) ? txn.messages : []
    const msg = {
      id: `m-${Date.now()}`,
      from: 'seller',
      type: 'delivery',
      content: '納品が完了しました。ファイルをダウンロードしてください。',
      r2Key: key,
      fileName: fileName || key.split('/').pop(),
      deliveryNote: typeof note === 'string' ? note.trim().slice(0, 2000) : '',
      sentAt: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`,
    }

    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ messages: [...messages, msg], r2_key: key, file_name: msg.fileName, status: 'delivered' })
      .eq('id', transactionId)

    if (updateError) return res.status(500).json({ error: `更新失敗: ${updateError.message}` })

    res.json({ ok: true, message: msg })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── R2 直接ダウンロード：署名付き GET URL を発行 ── */
app.get('/api/download-url', async (req, res) => {
  try {
    const user = await verifyUser(req, res)
    if (!user) return

    const { key, fileName } = req.query
    const transactionId = parseKey(key)
    if (!transactionId) return res.status(400).json({ error: '無効なキーです' })

    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('buyer_id, seller_id, status')
      .eq('id', transactionId)
      .single()

    if (txnError || !txn) return res.status(404).json({ error: '取引が見つかりません' })

    const isBuyer = txn.buyer_id === user.id
    const isSeller = txn.seller_id === user.id
    if (!isBuyer && !isSeller) return res.status(403).json({ error: 'アクセス権限がありません' })
    if (txn.status === 'cancelled' && !isSeller) {
      return res.status(403).json({ error: 'キャンセル済みの取引のためダウンロードできません' })
    }

    const name = fileName || key.split('/').pop()
    const url = await getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
        ResponseContentType: 'application/octet-stream',
      }),
      { expiresIn: 300 }
    )

    res.json({ url, fileName: name })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/* ── Admin: cancel transaction ── */
app.post('/api/admin-cancel-transaction', async (req, res) => {
  try {
    const user = await verifyUser(req, res)
    if (!user) return

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
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`API server running on port ${PORT}`))
