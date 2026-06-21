import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Guard against non-POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { code } = request.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return response.status(500).json({ message: 'Server configuration error: Key missing' });
    }

    if (code === adminPassword) {
      return response.status(200).json({
        success: true,
        message: 'CREDENTIALS AUTHENTICATED SUCCESSFULLY VIA EDGE GATEWAY.',
      });
    } else {
      return response.status(401).json({ message: 'Invalid Admin Access Token' });
    }
  } catch (error) {
    return response.status(500).json({ message: 'Internal Server Error' });
  }
}
