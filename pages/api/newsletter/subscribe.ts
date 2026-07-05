import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(455).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  // Simple email verification regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    // Mimicking Resend / Mailchimp API Integration
    const apiKey = process.env.RESEND_API_KEY || 'mock_resend_api_key';
    
    // In a real environment, you would call:
    // fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ... })
    // });
    
    console.log(`Success: Registered ${email} to Resend newsletter provider with Key: ${apiKey}`);

    // Return successful response
    return res.status(200).json({
      success: true,
      message: 'Successfully subscribed! Thank you for joining my tech insights.'
    });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'A backend database or system error occurred. Please try again.'
    });
  }
}
