import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // JWT 検証（未認証では決済させない）
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: '認証が必要です' })

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: '認証が無効です' })

    const { productId } = req.body
    if (!productId) return res.status(400).json({ error: 'productId is required' })

    // seller_id も取得してここで検証する
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

    // メタデータに buyer/seller/product を埋め込む
    // → confirm-payment でこれを読んでサーバー側 DB 登録に使う
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
    res.status(500).json({ error: err.message })
  }
}
