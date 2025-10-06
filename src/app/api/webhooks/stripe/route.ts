import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return new NextResponse('No signature', { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new NextResponse('Webhook Error', { status: 400 })
    }

    const supabase = await createClient()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
          console.log('Processing successful payment for booking:', bookingId)

          // Update booking to CONFIRMED
          const { error: bookingError } = await supabase
            .from('bookings')
            .update({
              status: 'CONFIRMED',
              payment_intent_id: session.payment_intent as string,
              confirmed_at: new Date().toISOString(),
            })
            .eq('id', bookingId)

          if (bookingError) {
            console.error('Error updating booking:', bookingError)
          }

          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              booking_id: bookingId,
              stripe_payment_intent_id: session.payment_intent as string,
              amount_pence: session.amount_total || 0,
              currency: session.currency || 'gbp',
              status: 'SUCCEEDED',
              payment_method: 'card',
            })

          if (paymentError) {
            console.error('Error creating payment record:', paymentError)
          }

          console.log('Successfully confirmed booking:', bookingId)
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId

        if (bookingId) {
          console.log('Payment session expired for booking:', bookingId)

          // Optionally cancel the booking after some time
          // You might want to add logic to cancel bookings that weren't paid within X hours
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const bookingId = paymentIntent.metadata?.bookingId

        if (bookingId) {
          console.log('Payment failed for booking:', bookingId)

          // Update payment record
          await supabase
            .from('payments')
            .update({ status: 'FAILED' })
            .eq('booking_id', bookingId)
            .eq('stripe_payment_intent_id', paymentIntent.id)
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const paymentIntentId = charge.payment_intent as string

        if (paymentIntentId) {
          console.log('Refund processed for payment intent:', paymentIntentId)

          // Update payment record
          await supabase
            .from('payments')
            .update({ status: 'REFUNDED' })
            .eq('stripe_payment_intent_id', paymentIntentId)

          // Optionally update booking status
          const { data: payment } = await supabase
            .from('payments')
            .select('booking_id')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single()

          if (payment) {
            await supabase
              .from('bookings')
              .update({
                status: 'CANCELLED',
                cancellation_reason: 'Payment refunded',
                cancelled_at: new Date().toISOString(),
              })
              .eq('id', payment.booking_id)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return new NextResponse('Webhook error', { status: 500 })
  }
}
