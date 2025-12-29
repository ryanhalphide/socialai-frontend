import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

interface ViralScoreRequest {
  content: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube';
  contentType?: 'text' | 'image' | 'video' | 'carousel' | 'story';
  hashtags?: string[];
  scheduledTime?: string;
}

interface ViralScoreResponse {
  score: number; // 0-100
  confidence: number; // 0-100
  breakdown: {
    hookStrength: number;
    emotionalResonance: number;
    clarity: number;
    callToAction: number;
    hashtagRelevance: number;
    lengthOptimization: number;
    trendAlignment: number;
    platformFit: number;
  };
  suggestions: {
    category: string;
    issue: string;
    suggestion: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  predictedEngagement: {
    likes: string;
    comments: string;
    shares: string;
    reach: string;
  };
}

const platformBestPractices: Record<string, { optimalLength: [number, number]; hashtagCount: [number, number]; bestTimes: string[] }> = {
  instagram: {
    optimalLength: [138, 150],
    hashtagCount: [5, 15],
    bestTimes: ['11:00', '13:00', '19:00', '21:00'],
  },
  twitter: {
    optimalLength: [71, 100],
    hashtagCount: [1, 3],
    bestTimes: ['09:00', '12:00', '17:00'],
  },
  facebook: {
    optimalLength: [40, 80],
    hashtagCount: [0, 3],
    bestTimes: ['13:00', '16:00', '19:00'],
  },
  linkedin: {
    optimalLength: [150, 300],
    hashtagCount: [3, 5],
    bestTimes: ['07:00', '08:00', '12:00', '17:00'],
  },
  youtube: {
    optimalLength: [200, 500],
    hashtagCount: [3, 5],
    bestTimes: ['14:00', '16:00', '21:00'],
  },
};

const systemPrompt = `You are an expert social media analyst with deep knowledge of viral content patterns, engagement algorithms, and platform-specific best practices. Your task is to analyze social media content and predict its viral potential.

Analyze the content based on these factors:
1. Hook Strength (0-100): Does the first line grab attention? Is there curiosity gap?
2. Emotional Resonance (0-100): Does it evoke strong emotions (joy, surprise, inspiration, controversy)?
3. Clarity (0-100): Is the message clear and easy to understand quickly?
4. Call to Action (0-100): Does it encourage engagement (comments, shares, saves)?
5. Hashtag Relevance (0-100): Are hashtags trending, relevant, and well-balanced?
6. Length Optimization (0-100): Is the length optimal for the platform?
7. Trend Alignment (0-100): Does it tap into current trends or timeless themes?
8. Platform Fit (0-100): Is the content style appropriate for the platform?

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "score": <overall score 0-100>,
  "confidence": <confidence in prediction 0-100>,
  "breakdown": {
    "hookStrength": <0-100>,
    "emotionalResonance": <0-100>,
    "clarity": <0-100>,
    "callToAction": <0-100>,
    "hashtagRelevance": <0-100>,
    "lengthOptimization": <0-100>,
    "trendAlignment": <0-100>,
    "platformFit": <0-100>
  },
  "suggestions": [
    {
      "category": "<category name>",
      "issue": "<what's wrong>",
      "suggestion": "<specific actionable improvement>",
      "impact": "<high|medium|low>"
    }
  ],
  "predictedEngagement": {
    "likes": "<range like '500-1.5K'>",
    "comments": "<range>",
    "shares": "<range>",
    "reach": "<range like '5K-15K'>"
  }
}

Provide 2-4 specific, actionable suggestions. Focus on high-impact improvements first.`;

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
    const {
      content,
      platform = 'instagram',
      contentType = 'text',
      hashtags = [],
      scheduledTime
    } = req.body as ViralScoreRequest;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const practices = platformBestPractices[platform];
    const hashtagsInContent = content.match(/#\w+/g) || [];
    const allHashtags = [...new Set([...hashtagsInContent, ...hashtags])];

    const userPrompt = `Analyze this ${platform.toUpperCase()} ${contentType} post for viral potential:

CONTENT:
"""
${content}
"""

METADATA:
- Platform: ${platform}
- Content Type: ${contentType}
- Character Count: ${content.length}
- Optimal Length for ${platform}: ${practices.optimalLength[0]}-${practices.optimalLength[1]} characters
- Hashtags Used: ${allHashtags.length > 0 ? allHashtags.join(', ') : 'None'}
- Optimal Hashtag Count for ${platform}: ${practices.hashtagCount[0]}-${practices.hashtagCount[1]}
${scheduledTime ? `- Scheduled Time: ${scheduledTime}` : ''}
${scheduledTime ? `- Best Posting Times for ${platform}: ${practices.bestTimes.join(', ')}` : ''}

Analyze and provide the viral score prediction in the exact JSON format specified.`;

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
        temperature: 0.3, // Lower temperature for more consistent scoring
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return res.status(500).json({ error: 'Failed to analyze content' });
    }

    const data = await response.json();
    const responseText = data.choices[0]?.message?.content || '';

    // Parse the JSON response
    let viralScore: ViralScoreResponse;
    try {
      // Clean up response - remove any markdown formatting
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      viralScore = JSON.parse(cleanedResponse);

      // Validate and clamp scores to 0-100
      viralScore.score = Math.min(100, Math.max(0, Math.round(viralScore.score)));
      viralScore.confidence = Math.min(100, Math.max(0, Math.round(viralScore.confidence)));

      // Validate breakdown scores
      for (const key of Object.keys(viralScore.breakdown) as (keyof typeof viralScore.breakdown)[]) {
        viralScore.breakdown[key] = Math.min(100, Math.max(0, Math.round(viralScore.breakdown[key])));
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      // Return a fallback response with basic analysis
      viralScore = generateFallbackScore(content, platform, allHashtags, practices);
    }

    return res.status(200).json({
      ...viralScore,
      platform,
      contentType,
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error analyzing viral score:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Fallback scoring based on heuristics when AI fails
function generateFallbackScore(
  content: string,
  platform: string,
  hashtags: string[],
  practices: typeof platformBestPractices[string]
): ViralScoreResponse {
  const contentLength = content.length;
  const [minLen, maxLen] = practices.optimalLength;
  const [minTags, maxTags] = practices.hashtagCount;

  // Length score
  let lengthScore = 70;
  if (contentLength >= minLen && contentLength <= maxLen) {
    lengthScore = 95;
  } else if (contentLength < minLen * 0.5 || contentLength > maxLen * 2) {
    lengthScore = 40;
  }

  // Hashtag score
  let hashtagScore = 70;
  if (hashtags.length >= minTags && hashtags.length <= maxTags) {
    hashtagScore = 90;
  } else if (hashtags.length === 0 && minTags > 0) {
    hashtagScore = 50;
  } else if (hashtags.length > maxTags * 2) {
    hashtagScore = 40;
  }

  // Hook score (check for question, exclamation, or emoji at start)
  const hasHook = /^[A-Z]|^\p{Emoji}|^\?|^!/u.test(content.trim());
  const hookScore = hasHook ? 75 : 55;

  // CTA score (check for action words)
  const ctaWords = /\b(comment|share|save|follow|click|link|bio|dm|tell me|let me know|thoughts\?|agree\?)\b/i;
  const ctaScore = ctaWords.test(content) ? 80 : 50;

  // Calculate overall
  const breakdown = {
    hookStrength: hookScore,
    emotionalResonance: 65,
    clarity: 70,
    callToAction: ctaScore,
    hashtagRelevance: hashtagScore,
    lengthOptimization: lengthScore,
    trendAlignment: 60,
    platformFit: 70,
  };

  const weights = {
    hookStrength: 0.2,
    emotionalResonance: 0.15,
    clarity: 0.1,
    callToAction: 0.15,
    hashtagRelevance: 0.1,
    lengthOptimization: 0.1,
    trendAlignment: 0.1,
    platformFit: 0.1,
  };

  const overallScore = Math.round(
    Object.entries(breakdown).reduce((sum, [key, value]) => {
      return sum + value * (weights[key as keyof typeof weights] || 0.1);
    }, 0)
  );

  const suggestions: ViralScoreResponse['suggestions'] = [];

  if (lengthScore < 70) {
    suggestions.push({
      category: 'Length',
      issue: contentLength < minLen ? 'Content is too short' : 'Content is too long',
      suggestion: `Aim for ${minLen}-${maxLen} characters for optimal ${platform} engagement`,
      impact: 'medium',
    });
  }

  if (hashtagScore < 70) {
    suggestions.push({
      category: 'Hashtags',
      issue: hashtags.length === 0 ? 'No hashtags used' : 'Hashtag count not optimal',
      suggestion: `Use ${minTags}-${maxTags} relevant hashtags for better discoverability`,
      impact: 'medium',
    });
  }

  if (hookScore < 70) {
    suggestions.push({
      category: 'Hook',
      issue: 'Opening could be stronger',
      suggestion: 'Start with a question, bold statement, or attention-grabbing hook',
      impact: 'high',
    });
  }

  if (ctaScore < 70) {
    suggestions.push({
      category: 'Engagement',
      issue: 'Missing call to action',
      suggestion: 'Add a question or invitation for comments to boost engagement',
      impact: 'high',
    });
  }

  return {
    score: overallScore,
    confidence: 60, // Lower confidence for fallback
    breakdown,
    suggestions,
    predictedEngagement: {
      likes: overallScore > 70 ? '200-800' : '50-200',
      comments: overallScore > 70 ? '20-80' : '5-20',
      shares: overallScore > 70 ? '10-50' : '2-10',
      reach: overallScore > 70 ? '2K-8K' : '500-2K',
    },
  };
}
