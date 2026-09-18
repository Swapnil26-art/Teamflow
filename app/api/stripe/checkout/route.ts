import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const origin =
      req.headers.get('origin') ||
      process.env.NEXTAUTH_URL ||
      'http://localhost:3000';

    if (!process.env.STRIPE_SECRET_KEY) {
      // Demo mode: no Stripe key configured, so simulate a successful
      // checkout instead of failing the purchase flow.
      return NextResponse.json({ url: `${origin}/settings/account?success=true` });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Teamflow Pro Plan',
              description: 'Unlock all premium features including unlimited AI and Speech Recognition.',
            },
            unit_amount: 499, // $4.99 per month
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/settings/account?success=true`,
      cancel_url: `${origin}/settings/account?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[STRIPE_CHECKOUT_ERROR]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
