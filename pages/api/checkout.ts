import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message?: string;
  url?: string;
};

// Course pricing catalog mapping
const courseCatalog: Record<string, { priceId: string; amount: number; name: string }> = {
  'oracle-plsql': {
    priceId: 'price_oracle_plsql_123',
    amount: 4900, // $49.00
    name: 'Mastering Oracle PL/SQL for Financial Systems'
  },
  'banking-etl': {
    priceId: 'price_banking_etl_456',
    amount: 7900, // $79.00
    name: 'Banking Data Reconciliation Pipelines'
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(455).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { courseId, email } = req.body;

  if (!courseId || !courseCatalog[courseId]) {
    return res.status(400).json({ success: false, message: 'Invalid or missing Course ID.' });
  }

  if (!email) {
    return res.status(400).json({ success: false, message: 'Customer email address is required.' });
  }

  try {
    const stripeApiKey = process.env.STRIPE_SECRET_KEY || 'mock_stripe_secret_key';
    const selectedCourse = courseCatalog[courseId];

    // Mocking Stripe Checkout Session creation call
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{ price: selectedCourse.priceId, quantity: 1 }],
    //   customer_email: email,
    //   mode: 'payment',
    //   success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    //   cancel_url: `${req.headers.origin}/courses`,
    // });

    console.log(`Success: Formed Stripe session for ${selectedCourse.name} under account ${email}`);

    // Return mock Stripe Session Checkout URL
    const mockSessionUrl = `https://checkout.stripe.com/c/pay/mock_session_for_${courseId}_user_${encodeURIComponent(email)}`;
    
    return res.status(200).json({
      success: true,
      url: mockSessionUrl
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize checkout session. Please try again.'
    });
  }
}
