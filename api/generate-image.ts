import type { VercelRequest, VercelResponse } from '@vercel/node';

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;

interface GenerateImageRequest {
  prompt: string;
  style?: 'realistic' | 'artistic' | 'minimalist' | 'vibrant' | 'professional';
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  model?: 'flux' | 'sdxl';
}

const styleEnhancements: Record<string, string> = {
  realistic: 'photorealistic, high quality, detailed, professional photography',
  artistic: 'artistic, creative, stylized, visually striking',
  minimalist: 'minimalist, clean, simple, modern design',
  vibrant: 'vibrant colors, dynamic, eye-catching, bold',
  professional: 'professional, corporate, polished, business-appropriate',
};

const aspectRatioSizes: Record<string, { width: number; height: number }> = {
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
  '9:16': { width: 768, height: 1344 },
  '4:5': { width: 896, height: 1120 },
};

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

  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'Replicate API token not configured' });
  }

  try {
    const {
      prompt,
      style = 'professional',
      aspectRatio = '1:1',
      model = 'flux'
    } = req.body as GenerateImageRequest;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const styleEnhancement = styleEnhancements[style] || styleEnhancements.professional;
    const enhancedPrompt = `${prompt}, ${styleEnhancement}`;
    const size = aspectRatioSizes[aspectRatio] || aspectRatioSizes['1:1'];

    // Use Flux Schnell for fast generation
    // Flux Schnell latest version (as of Dec 2024)
    const fluxVersion = 'c846a69991daf4c0e5d016514849d14ee5b2e6846ce6b9d6f21369e564cfe51e';
    const sdxlVersion = '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';

    // Map our aspect ratio to Flux's supported aspect ratios
    const fluxAspectRatios: Record<string, string> = {
      '1:1': '1:1',
      '16:9': '16:9',
      '9:16': '9:16',
      '4:5': '4:5',
    };

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: model === 'flux' ? fluxVersion : sdxlVersion,
        input: model === 'flux'
          ? {
              prompt: enhancedPrompt,
              aspect_ratio: fluxAspectRatios[aspectRatio] || '1:1',
              num_outputs: 1,
              output_format: 'webp',
              output_quality: 90,
            }
          : {
              prompt: enhancedPrompt,
              width: size.width,
              height: size.height,
              num_outputs: 1,
              negative_prompt: 'blurry, low quality, distorted, deformed',
              num_inference_steps: 30,
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
            error: 'Image generation service requires billing setup',
            details: 'Please add credits to the Replicate account'
          });
        }
        return res.status(response.status).json({
          error: 'Failed to start image generation',
          details: errorJson.detail || errorJson.title || errorText
        });
      } catch {
        return res.status(500).json({ error: 'Failed to start image generation', details: errorText });
      }
    }

    const prediction = await response.json();

    // Poll for completion (Replicate is async)
    let result = prediction;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        },
      });

      result = await pollResponse.json();
      attempts++;
    }

    if (result.status === 'failed') {
      return res.status(500).json({ error: 'Image generation failed', details: result.error });
    }

    if (result.status !== 'succeeded') {
      return res.status(504).json({ error: 'Image generation timed out' });
    }

    const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;

    return res.status(200).json({
      imageUrl,
      prompt: enhancedPrompt,
      style,
      aspectRatio,
      model,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
