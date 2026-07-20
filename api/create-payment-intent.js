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
    res.status(500).json({ error: err.message })
  }
}
