import type { VercelRequest, VercelResponse } from '@vercel/node';

// Video status polling endpoint
const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'Replicate API token not configured' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Prediction ID is required' });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', errorText);
      return res.status(response.status).json({ error: 'Failed to fetch video status' });
    }

    const prediction = await response.json();

    // Map Replicate status to our format
    let status: 'processing' | 'succeeded' | 'failed' = 'processing';
    if (prediction.status === 'succeeded') {
      status = 'succeeded';
    } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
      status = 'failed';
    }

    // Get video URL from output
    let videoUrl: string | null = null;
    if (prediction.output) {
      // minimax/video-01 returns output as a string URL
      videoUrl = typeof prediction.output === 'string'
        ? prediction.output
        : Array.isArray(prediction.output)
          ? prediction.output[0]
          : null;
    }

    return res.status(200).json({
      id: prediction.id,
      status,
      videoUrl,
      error: prediction.error || null,
      logs: prediction.logs || null,
    });
  } catch (error) {
    console.error('Error fetching video status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
