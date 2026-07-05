import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { amount, currency = 'jpy' } = req.body
    if (!amount || amount < 1) return res.status(400).json({ error: 'Invalid amount' })
    const paymentIntent = await stripe.paymentIntents.create({ amount, currency })
    res.json({ clientSecret: paymentIntent.client_secret })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
