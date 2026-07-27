import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// 書き込み用: service role key で RLS をバイパス
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// 認証検証用: anon key
const supabaseAnon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // JWT 検証
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: '認証が必要です' })

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    if (authError || !user) return res.status(401).json({ error: '認証が無効です' })

    const { paymentIntentId } = req.body
    if (!paymentIntentId) return res.status(400).json({ error: 'paymentIntentId is required' })

    // Stripe に問い合わせて決済状態を検証（クライアントの申告を信用しない）
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: '決済が完了していません' })
    }

    const { productId, buyerId, sellerId, productTitle, productImage } = paymentIntent.metadata

    // リクエスト者が実際の購入者か確認
    if (buyerId !== user.id) {
      return res.status(403).json({ error: 'アクセス権限がありません' })
    }

    // 冪等性: 同じ paymentIntentId で二重登録しない
    const { data: existing } = await supabaseAdmin
      .from('transactions')
      .select('id')
      .eq('payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (existing) return res.json({ alreadyCreated: true, transactionId: existing.id })

    // サーバー側でトランザクションを登録（決済成功が確認済みの状態でのみ実行）
    const { data: txn, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        seller_id: sellerId,
        buyer_id: buyerId,
        amount: paymentIntent.amount,
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
    res.status(500).json({ error: err.message })
  }
}
