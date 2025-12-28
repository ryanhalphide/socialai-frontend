import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY; // For Veo via Gemini API

interface GenerateVideoRequest {
  prompt: string;
  duration?: 5 | 8; // seconds
  aspectRatio?: '16:9' | '9:16' | '1:1';
  provider?: 'replicate' | 'veo';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      prompt,
      duration = 5,
      aspectRatio = '16:9',
      provider = 'replicate'
    } = req.body as GenerateVideoRequest;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use Replicate's video models (more accessible)
    if (provider === 'replicate') {
      if (!REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: 'Replicate API token not configured' });
      }

      // Using minimax/video-01 - a text-to-video model
      // Version as of Dec 2024
      const minimaxVideoVersion = 'c8bcc4751328608bb75043b3af7bed4eabcf1a6c0a478d50a4cf57fa04bd5101';

      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: minimaxVideoVersion,
          input: {
            prompt: `${prompt}, high quality, smooth motion, professional cinematography`,
            prompt_optimizer: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Replicate API error:', errorText);

        // Parse error for better user feedback
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.title === 'Insufficient credit') {
            return res.status(402).json({
              error: 'Video generation service requires billing setup',
              details: 'Please add credits to the Replicate account'
            });
          }
          return res.status(response.status).json({
            error: 'Failed to start video generation',
            details: errorJson.detail || errorJson.title || errorText
          });
        } catch {
          return res.status(500).json({ error: 'Failed to start video generation', details: errorText });
        }
      }

      const prediction = await response.json();

      // Return prediction ID for polling (video takes longer)
      return res.status(202).json({
        id: prediction.id,
        status: 'processing',
        message: 'Video generation started. Poll /api/video-status with the ID to check progress.',
        estimatedTime: '60-120 seconds',
      });
    }

    // Google Veo via Gemini API
    if (provider === 'veo') {
      if (!GOOGLE_AI_API_KEY) {
        return res.status(500).json({
          error: 'Google AI API key not configured',
          message: 'Veo requires a Google AI API key. Get one at https://aistudio.google.com/apikey'
        });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:predictLongRunning?key=${GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instances: [{
              prompt: prompt,
            }],
            parameters: {
              aspectRatio: aspectRatio,
              sampleCount: 1,
              durationSeconds: duration,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error('Veo API error:', error);
        return res.status(500).json({
          error: 'Failed to generate video with Veo',
          details: error
        });
      }

      const data = await response.json();

      return res.status(202).json({
        operationName: data.name,
        status: 'processing',
        message: 'Video generation started with Google Veo.',
        provider: 'veo',
      });
    }

    return res.status(400).json({ error: 'Invalid provider' });
  } catch (error) {
    console.error('Error generating video:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
