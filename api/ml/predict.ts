import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface PredictRequest {
  userId: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  content: string;
  contentType?: 'text' | 'image' | 'video' | 'carousel';
  hashtags?: string[];
  postTime?: string; // ISO timestamp for when planning to post
}

interface PredictionResult {
  predictedEngagement: {
    min: number;
    max: number;
    expected: number;
  };
  predictedReach: {
    min: number;
    max: number;
    expected: number;
  };
  confidence: number;
  factors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    score: number;
    suggestion?: string;
  }>;
  optimizations: string[];
  comparedToAverage: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      userId,
      platform,
      content,
      contentType = 'text',
      hashtags = [],
      postTime,
    } = req.body as PredictRequest;

    if (!userId || !platform || !content) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['userId', 'platform', 'content'],
      });
    }

    // Get ML profile if available
    let mlProfile: Record<string, unknown> | null = null;
    let historicalPosts: Record<string, unknown>[] = [];

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      const { data: profile } = await supabase
        .from('user_ml_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      mlProfile = profile;

      // Get recent posts for comparison
      const { data: posts } = await supabase
        .from('post_performance')
        .select('engagement_rate, reach, content_type, hashtags, posted_at')
        .eq('user_id', userId)
        .eq('platform', platform)
        .order('posted_at', { ascending: false })
        .limit(50);

      historicalPosts = posts || [];
    }

    // Calculate prediction
    const prediction = calculatePrediction({
      content,
      contentType,
      hashtags,
      postTime,
      platform,
      mlProfile,
      historicalPosts,
    });

    return res.status(200).json(prediction);
  } catch (error) {
    console.error('Error predicting:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

interface PredictionInput {
  content: string;
  contentType: string;
  hashtags: string[];
  postTime?: string;
  platform: string;
  mlProfile: Record<string, unknown> | null;
  historicalPosts: Record<string, unknown>[];
}

function calculatePrediction(input: PredictionInput): PredictionResult {
  const { content, contentType, hashtags, postTime, platform, mlProfile, historicalPosts } = input;

  const factors: PredictionResult['factors'] = [];
  let baseScore = 50; // Start at 50%
  let confidence = 0.5; // Base confidence

  // 1. Content length analysis
  const lengthFactor = analyzeContentLength(content, platform);
  factors.push(lengthFactor);
  baseScore += lengthFactor.score;

  // 2. Content type impact
  const typeFactor = analyzeContentType(contentType, platform, mlProfile);
  factors.push(typeFactor);
  baseScore += typeFactor.score;

  // 3. Hashtag analysis
  const hashtagFactor = analyzeHashtags(hashtags, platform, mlProfile);
  factors.push(hashtagFactor);
  baseScore += hashtagFactor.score;

  // 4. Posting time analysis
  if (postTime) {
    const timeFactor = analyzePostingTime(postTime, platform, mlProfile);
    factors.push(timeFactor);
    baseScore += timeFactor.score;
  }

  // 5. Content quality signals
  const qualityFactor = analyzeContentQuality(content);
  factors.push(qualityFactor);
  baseScore += qualityFactor.score;

  // 6. Historical performance baseline
  if (historicalPosts.length > 0) {
    confidence += 0.2;

    const avgEngagement = historicalPosts.reduce(
      (sum, p) => sum + ((p.engagement_rate as number) || 0), 0
    ) / historicalPosts.length;

    // Adjust base score based on user's historical performance
    if (avgEngagement > 3) baseScore += 10;
    else if (avgEngagement < 1) baseScore -= 10;
  }

  // 7. ML profile boost
  if (mlProfile) {
    confidence += 0.15;
  }

  // Normalize score to 0-100
  const normalizedScore = Math.min(100, Math.max(0, baseScore));

  // Calculate engagement range
  const variance = 100 - confidence * 100;
  const minEngagement = Math.max(0, normalizedScore - variance * 0.3);
  const maxEngagement = Math.min(100, normalizedScore + variance * 0.3);

  // Calculate reach prediction
  const avgReach = historicalPosts.length > 0
    ? historicalPosts.reduce((sum, p) => sum + ((p.reach as number) || 0), 0) / historicalPosts.length
    : getPlatformDefaultReach(platform);

  const reachMultiplier = normalizedScore / 50; // 1x at 50, 2x at 100, 0x at 0
  const expectedReach = Math.round(avgReach * reachMultiplier);

  // Generate optimizations
  const optimizations: string[] = [];
  factors
    .filter(f => f.impact === 'negative')
    .forEach(f => {
      if (f.suggestion) optimizations.push(f.suggestion);
    });

  // Compare to average
  const avgScore = historicalPosts.length > 0
    ? historicalPosts.reduce((sum, p) => sum + ((p.engagement_rate as number) || 0), 0) / historicalPosts.length
    : 2.5;

  const comparison = normalizedScore > avgScore * 1.2
    ? `${((normalizedScore / avgScore - 1) * 100).toFixed(0)}% above your average`
    : normalizedScore < avgScore * 0.8
      ? `${((1 - normalizedScore / avgScore) * 100).toFixed(0)}% below your average`
      : 'In line with your average performance';

  return {
    predictedEngagement: {
      min: Math.round(minEngagement * 10) / 10,
      max: Math.round(maxEngagement * 10) / 10,
      expected: Math.round(normalizedScore * 10) / 10,
    },
    predictedReach: {
      min: Math.round(expectedReach * 0.7),
      max: Math.round(expectedReach * 1.3),
      expected: expectedReach,
    },
    confidence: Math.round(confidence * 100) / 100,
    factors,
    optimizations,
    comparedToAverage: comparison,
  };
}

function analyzeContentLength(content: string, platform: string): PredictionResult['factors'][0] {
  const length = content.length;

  const optimalLengths: Record<string, { min: number; max: number }> = {
    instagram: { min: 138, max: 150 },
    facebook: { min: 40, max: 80 },
    twitter: { min: 71, max: 100 },
    linkedin: { min: 50, max: 150 },
    youtube: { min: 200, max: 500 },
    tiktok: { min: 50, max: 150 },
  };

  const optimal = optimalLengths[platform] || { min: 100, max: 200 };

  if (length >= optimal.min && length <= optimal.max) {
    return {
      factor: 'Content Length',
      impact: 'positive',
      score: 8,
    };
  } else if (length < optimal.min) {
    return {
      factor: 'Content Length',
      impact: 'negative',
      score: -5,
      suggestion: `Add more content. Optimal length is ${optimal.min}-${optimal.max} characters.`,
    };
  } else {
    return {
      factor: 'Content Length',
      impact: 'neutral',
      score: 0,
      suggestion: `Consider shortening to ${optimal.max} characters for optimal engagement.`,
    };
  }
}

function analyzeContentType(
  contentType: string,
  platform: string,
  mlProfile: Record<string, unknown> | null
): PredictionResult['factors'][0] {
  // Platform-specific type preferences
  const typeBoosts: Record<string, Record<string, number>> = {
    instagram: { video: 15, carousel: 12, image: 8, text: 0 },
    facebook: { video: 12, image: 8, text: 5, carousel: 6 },
    twitter: { text: 8, image: 10, video: 6, carousel: 4 },
    linkedin: { text: 10, image: 8, video: 12, carousel: 6 },
    youtube: { video: 15, text: 0, image: 0, carousel: 0 },
    tiktok: { video: 15, text: 2, image: 4, carousel: 0 },
  };

  let score = typeBoosts[platform]?.[contentType] || 0;

  // Override with ML profile if available
  if (mlProfile?.content_type_performance) {
    const platformPerf = (mlProfile.content_type_performance as Record<string, Record<string, number>>)[platform];
    if (platformPerf && platformPerf[contentType] !== undefined) {
      const userScore = platformPerf[contentType];
      score = userScore > 3 ? 12 : userScore > 1 ? 6 : -5;
    }
  }

  if (score > 8) {
    return {
      factor: 'Content Type',
      impact: 'positive',
      score,
    };
  } else if (score < 0) {
    return {
      factor: 'Content Type',
      impact: 'negative',
      score,
      suggestion: `Consider using video or image content for better engagement on ${platform}.`,
    };
  } else {
    return {
      factor: 'Content Type',
      impact: 'neutral',
      score,
    };
  }
}

function analyzeHashtags(
  hashtags: string[],
  platform: string,
  mlProfile: Record<string, unknown> | null
): PredictionResult['factors'][0] {
  if (hashtags.length === 0) {
    return {
      factor: 'Hashtags',
      impact: 'negative',
      score: -5,
      suggestion: 'Add relevant hashtags to increase discoverability.',
    };
  }

  const optimalCounts: Record<string, { min: number; max: number }> = {
    instagram: { min: 5, max: 15 },
    facebook: { min: 1, max: 3 },
    twitter: { min: 1, max: 2 },
    linkedin: { min: 3, max: 5 },
    youtube: { min: 3, max: 8 },
    tiktok: { min: 3, max: 5 },
  };

  const optimal = optimalCounts[platform] || { min: 3, max: 5 };
  const count = hashtags.length;

  let score = 0;
  let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
  let suggestion: string | undefined;

  if (count >= optimal.min && count <= optimal.max) {
    score = 8;
    impact = 'positive';
  } else if (count < optimal.min) {
    score = 2;
    impact = 'neutral';
    suggestion = `Add ${optimal.min - count} more hashtags for better reach.`;
  } else {
    score = -3;
    impact = 'negative';
    suggestion = `Reduce to ${optimal.max} hashtags. Too many can look spammy.`;
  }

  // Boost for using top-performing hashtags from profile
  if (mlProfile?.top_hashtags) {
    const topHashtags = (mlProfile.top_hashtags as Record<string, string[]>)[platform] || [];
    const matchingTop = hashtags.filter(h =>
      topHashtags.some(th => th.toLowerCase() === h.toLowerCase())
    );
    if (matchingTop.length > 0) {
      score += matchingTop.length * 2;
      impact = 'positive';
    }
  }

  return { factor: 'Hashtags', impact, score, suggestion };
}

function analyzePostingTime(
  postTime: string,
  platform: string,
  mlProfile: Record<string, unknown> | null
): PredictionResult['factors'][0] {
  const date = new Date(postTime);
  const hour = date.getHours();
  const day = date.getDay();

  // Default peak hours
  const peakHours: Record<string, number[]> = {
    instagram: [9, 10, 11, 12, 17, 18, 19],
    facebook: [9, 10, 11, 12, 13, 14, 15],
    twitter: [8, 9, 10, 11, 12, 17, 18],
    linkedin: [7, 8, 9, 10, 11, 12, 17],
    youtube: [12, 13, 14, 15, 16, 17, 18, 19, 20],
    tiktok: [11, 12, 19, 20, 21, 22],
  };

  const isPeakHour = peakHours[platform]?.includes(hour) || false;
  const isWeekend = day === 0 || day === 6;

  // Weekend adjustment (some platforms do better, some worse)
  const weekendBoost: Record<string, number> = {
    instagram: 5,
    facebook: 3,
    twitter: -2,
    linkedin: -8,
    youtube: 5,
    tiktok: 8,
  };

  let score = isPeakHour ? 8 : 0;
  score += isWeekend ? (weekendBoost[platform] || 0) : 0;

  // Override with ML profile
  if (mlProfile?.best_posting_times) {
    const times = (mlProfile.best_posting_times as Record<string, Array<{ hour: number }>>)[platform];
    if (times && times.length > 0) {
      const isOptimal = times.some(t => t.hour === hour);
      if (isOptimal) score += 10;
    }
  }

  if (score > 5) {
    return {
      factor: 'Posting Time',
      impact: 'positive',
      score,
    };
  } else if (score < 0) {
    return {
      factor: 'Posting Time',
      impact: 'negative',
      score,
      suggestion: `Consider posting during peak hours: ${peakHours[platform]?.join(', ')}:00`,
    };
  } else {
    return {
      factor: 'Posting Time',
      impact: 'neutral',
      score,
      suggestion: 'This is not a peak time, but results may vary.',
    };
  }
}

function analyzeContentQuality(content: string): PredictionResult['factors'][0] {
  let score = 0;
  const suggestions: string[] = [];

  // Check for question (drives engagement)
  if (content.includes('?')) score += 5;
  else suggestions.push('Add a question to encourage comments');

  // Check for CTA
  const ctaWords = ['click', 'link', 'comment', 'share', 'follow', 'subscribe', 'join', 'learn', 'discover', 'check out', 'save'];
  const hasCTA = ctaWords.some(word => content.toLowerCase().includes(word));
  if (hasCTA) score += 5;
  else suggestions.push('Add a call-to-action');

  // Check for emoji usage
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu;
  const emojiCount = (content.match(emojiRegex) || []).length;
  if (emojiCount >= 1 && emojiCount <= 5) score += 3;
  else if (emojiCount > 5) score -= 2;

  // Check for line breaks (readability)
  if (content.includes('\n')) score += 2;

  // Hook quality (first line)
  const firstLine = content.split('\n')[0];
  if (firstLine.length > 20 && firstLine.length < 100) score += 2;

  const impact: 'positive' | 'negative' | 'neutral' =
    score > 5 ? 'positive' : score < 0 ? 'negative' : 'neutral';

  return {
    factor: 'Content Quality',
    impact,
    score,
    suggestion: suggestions[0],
  };
}

function getPlatformDefaultReach(platform: string): number {
  const defaults: Record<string, number> = {
    instagram: 500,
    facebook: 300,
    twitter: 400,
    linkedin: 250,
    youtube: 1000,
    tiktok: 800,
  };
  return defaults[platform] || 400;
}
