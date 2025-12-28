import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface GenerateTextRequest {
  prompt: string;
  platform?: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube';
  contentType?: 'post' | 'caption' | 'hashtags' | 'thread';
  tone?: 'professional' | 'casual' | 'humorous' | 'inspiring';
}

const platformLimits: Record<string, number> = {
  twitter: 280,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  youtube: 5000,
};

const systemPrompts: Record<string, string> = {
  post: `You are a social media content expert. Generate engaging, platform-optimized content that drives engagement. Be concise, impactful, and include a clear call-to-action when appropriate.`,
  caption: `You are an expert at writing compelling social media captions. Create captions that are attention-grabbing, relatable, and encourage engagement. Use appropriate emojis sparingly.`,
  hashtags: `You are a hashtag strategy expert. Generate relevant, trending, and niche hashtags that will maximize reach and engagement. Return only hashtags, separated by spaces.`,
  thread: `You are an expert at creating viral Twitter/X threads. Break down complex topics into engaging, bite-sized tweets that build narrative momentum. Number each tweet.`,
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

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Groq API key not configured' });
  }

  try {
    const { prompt, platform = 'instagram', contentType = 'post', tone = 'professional' } = req.body as GenerateTextRequest;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const charLimit = platformLimits[platform] || 2200;
    const systemPrompt = systemPrompts[contentType] || systemPrompts.post;

    const userPrompt = `
Platform: ${platform.toUpperCase()}
Character limit: ${charLimit}
Tone: ${tone}
Content type: ${contentType}

User request: ${prompt}

Generate the content now. ${contentType === 'hashtags' ? 'Return only hashtags.' : `Keep it under ${charLimit} characters.`}
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return res.status(500).json({ error: 'Failed to generate content' });
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || '';

    return res.status(200).json({
      content: generatedText.trim(),
      platform,
      contentType,
      charCount: generatedText.trim().length,
      charLimit,
    });
  } catch (error) {
    console.error('Error generating text:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
