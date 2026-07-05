import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  received: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(455).json({ received: false, message: `Method ${req.method} Not Allowed` });
  }

  // Retrieve raw body if needed for Stripe Signature verification
  const payload = req.body;
  const sig = req.headers['stripe-signature'];

  console.log(`Received Stripe Webhook Event. Signature Header: ${sig}`);

  try {
    // In a real environment, you verify the webhook:
    // const event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    
    // We mock a successful payment event
    const eventType = payload.type || 'checkout.session.completed';

    if (eventType === 'checkout.session.completed') {
      const session = payload.data?.object || {
        customer_email: 'customer@example.com',
        amount_total: 4900,
        currency: 'usd',
        id: 'cs_test_mock_session_id',
        metadata: { courseId: 'oracle-plsql' }
      };

      const email = session.customer_email;
      const courseId = session.metadata?.courseId || 'unknown';
      const orderToken = `TOKEN_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Simulate Database insertion
      console.log(`[DB] INSERT INTO course_orders (course_id, stripe_session_id, customer_email, amount_paid, payment_status, access_token) VALUES ('${courseId}', '${session.id}', '${email}', ${session.amount_total}, 'PAID', '${orderToken}')`);

      // Mock sending course access email using Resend/SendGrid
      console.log(`[EMAIL] Dispatching course delivery email to: ${email}`);
      console.log(`[EMAIL] Message: "Your purchase of ${courseId} is complete. Download token: ${orderToken}"`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ received: false, message: 'Webhook processing failed.' });
  }
}
