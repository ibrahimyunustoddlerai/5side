import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-09-30.clover',
  typescript: true,
})

export interface CreateCheckoutSessionParams {
  bookingId: string
  pitchName: string
  locationName: string
  startTime: Date
  endTime: Date
  amountPence: number
  successUrl: string
  cancelUrl: string
  customerEmail?: string
}

export async function createCheckoutSession({
  bookingId,
  pitchName,
  locationName,
  startTime,
  endTime,
  amountPence,
  successUrl,
  cancelUrl,
  customerEmail,
}: CreateCheckoutSessionParams) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `${pitchName} - ${locationName}`,
            description: `Booking from ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`,
          },
          unit_amount: amountPence,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      bookingId,
    },
    payment_intent_data: {
      metadata: {
        bookingId,
      },
    },
  })

  return session
}

export async function constructWebhookEvent(
  body: string,
  signature: string
): Promise<Stripe.Event> {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  )
}