import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface GenerateSmartRequest {
  userId: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  contentType: 'text' | 'image' | 'video' | 'carousel';
  topic?: string;
  businessContext?: string;
  tone?: string;
  includeHashtags?: boolean;
  includeCTA?: boolean;
}

interface MLProfile {
  preferred_tone: Record<string, number>;
  best_posting_times: Record<string, Array<{ day: string; hour: number; engagement: number }>>;
  top_hashtags: Record<string, string[]>;
  content_type_performance: Record<string, Record<string, number>>;
  performance_baselines: Record<string, { avgEngagementRate: number }>;
}

const PLATFORM_LIMITS: Record<string, { maxLength: number; hashtagCount: number; features: string[] }> = {
  instagram: { maxLength: 2200, hashtagCount: 30, features: ['hashtags', 'emojis', 'mentions', 'stories'] },
  facebook: { maxLength: 63206, hashtagCount: 5, features: ['links', 'reactions', 'shares'] },
  twitter: { maxLength: 280, hashtagCount: 3, features: ['hashtags', 'threads', 'mentions'] },
  linkedin: { maxLength: 3000, hashtagCount: 5, features: ['professional', 'articles', 'connections'] },
  youtube: { maxLength: 5000, hashtagCount: 15, features: ['video-focused', 'timestamps', 'links'] },
  tiktok: { maxLength: 2200, hashtagCount: 5, features: ['trending', 'sounds', 'challenges'] },
};

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

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Groq API key not configured' });
  }

  try {
    const {
      userId,
      platform,
      contentType = 'text',
      topic,
      businessContext,
      tone,
      includeHashtags = true,
      includeCTA = true,
    } = req.body as GenerateSmartRequest;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!platform) {
      return res.status(400).json({ error: 'Platform is required' });
    }

    // Fetch user's ML profile for personalization
    let mlProfile: MLProfile | null = null;
    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data } = await supabase
        .from('user_ml_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      mlProfile = data as MLProfile | null;
    }

    // Build context-aware prompt
    const platformConfig = PLATFORM_LIMITS[platform];
    const systemPrompt = buildSystemPrompt(platform, platformConfig, mlProfile, tone);
    const userPrompt = buildUserPrompt({
      topic,
      businessContext,
      contentType,
      includeHashtags,
      includeCTA,
      platformConfig,
      mlProfile,
      platform,
    });

    // Generate with Groq
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.8,
      max_tokens: 1000,
    });

    const generatedContent = completion.choices[0]?.message?.content || '';

    // Parse the generated content
    const parsed = parseGeneratedContent(generatedContent, platform);

    // Calculate predicted engagement based on ML profile
    const predictedEngagement = calculatePredictedEngagement(parsed, mlProfile, platform);

    // Get best posting time
    const bestTime = getBestPostingTime(mlProfile, platform);

    return res.status(200).json({
      content: parsed.content,
      hashtags: parsed.hashtags,
      suggestedMedia: parsed.mediaPrompt,
      predictedEngagement: {
        score: predictedEngagement,
        label: predictedEngagement >= 70 ? 'High' : predictedEngagement >= 40 ? 'Medium' : 'Low',
        confidence: mlProfile ? 0.75 : 0.5,
      },
      bestPostTime: bestTime,
      platform,
      contentType,
      characterCount: parsed.content.length,
      maxCharacters: platformConfig.maxLength,
      optimizationApplied: {
        usedMLProfile: !!mlProfile,
        toneOptimized: !!mlProfile?.preferred_tone,
        hashtagsOptimized: !!mlProfile?.top_hashtags?.[platform],
      },
    });
  } catch (error) {
    console.error('Error generating smart content:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildSystemPrompt(
  platform: string,
  config: typeof PLATFORM_LIMITS[string],
  mlProfile: MLProfile | null,
  requestedTone?: string
): string {
  // Determine tone from ML profile or request
  let toneDescription = 'professional yet approachable';
  if (requestedTone) {
    toneDescription = requestedTone;
  } else if (mlProfile?.preferred_tone) {
    const tones = Object.entries(mlProfile.preferred_tone);
    const topTone = tones.sort((a, b) => b[1] - a[1])[0];
    if (topTone && topTone[1] > 0.3) {
      toneDescription = topTone[0];
    }
  }

  return `You are an expert social media strategist specializing in ${platform}. Your goal is to create highly engaging content that maximizes reach and conversions.

PLATFORM: ${platform.toUpperCase()}
CHARACTER LIMIT: ${config.maxLength}
MAX HASHTAGS: ${config.hashtagCount}
FEATURES: ${config.features.join(', ')}

WRITING STYLE:
- Tone: ${toneDescription}
- Hook readers in the first line
- Use short, punchy sentences
- Include a clear call-to-action
- Optimize for the algorithm

${mlProfile ? `
USER'S BEST PRACTICES (learned from their data):
- Top performing hashtags: ${mlProfile.top_hashtags?.[platform]?.slice(0, 5).join(', ') || 'Not enough data'}
- Average engagement rate: ${mlProfile.performance_baselines?.[platform]?.avgEngagementRate || 'Unknown'}%
` : ''}

OUTPUT FORMAT:
Provide the content in this exact format:
---CONTENT---
[The main post content here]
---HASHTAGS---
[Space-separated hashtags]
---MEDIA---
[Brief description of ideal accompanying image/video if applicable]`;
}

interface PromptParams {
  topic?: string;
  businessContext?: string;
  contentType: string;
  includeHashtags: boolean;
  includeCTA: boolean;
  platformConfig: typeof PLATFORM_LIMITS[string];
  mlProfile: MLProfile | null;
  platform: string;
}

function buildUserPrompt(params: PromptParams): string {
  const {
    topic,
    businessContext,
    contentType,
    includeHashtags,
    includeCTA,
    platformConfig,
    mlProfile,
    platform,
  } = params;

  let prompt = `Create a ${contentType} post`;

  if (topic) {
    prompt += ` about: ${topic}`;
  } else {
    prompt += ' that will resonate with the audience';
  }

  if (businessContext) {
    prompt += `\n\nBusiness context: ${businessContext}`;
  }

  prompt += '\n\nRequirements:';
  prompt += `\n- Stay within ${platformConfig.maxLength} characters`;

  if (includeHashtags) {
    const suggestedHashtags = mlProfile?.top_hashtags?.[platform]?.slice(0, 3);
    if (suggestedHashtags?.length) {
      prompt += `\n- Include hashtags (consider these top performers: ${suggestedHashtags.join(', ')})`;
    } else {
      prompt += `\n- Include up to ${platformConfig.hashtagCount} relevant hashtags`;
    }
  }

  if (includeCTA) {
    prompt += '\n- Include a clear call-to-action';
  }

  if (contentType === 'video' || contentType === 'image') {
    prompt += '\n- Suggest what the visual content should be';
  }

  return prompt;
}

interface ParsedContent {
  content: string;
  hashtags: string[];
  mediaPrompt: string | null;
}

function parseGeneratedContent(raw: string, platform: string): ParsedContent {
  const result: ParsedContent = {
    content: '',
    hashtags: [],
    mediaPrompt: null,
  };

  // Try to parse structured format
  const contentMatch = raw.match(/---CONTENT---\s*([\s\S]*?)(?:---HASHTAGS---|---MEDIA---|$)/i);
  const hashtagsMatch = raw.match(/---HASHTAGS---\s*([\s\S]*?)(?:---MEDIA---|$)/i);
  const mediaMatch = raw.match(/---MEDIA---\s*([\s\S]*?)$/i);

  if (contentMatch) {
    result.content = contentMatch[1].trim();
  } else {
    // Fallback: use the whole response
    result.content = raw.trim();
  }

  if (hashtagsMatch) {
    const hashtagText = hashtagsMatch[1].trim();
    result.hashtags = hashtagText
      .split(/\s+/)
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.toLowerCase());
  } else {
    // Extract hashtags from content
    const hashtagRegex = /#[\w]+/g;
    result.hashtags = (result.content.match(hashtagRegex) || []).map(t => t.toLowerCase());
    // Remove hashtags from content for cleaner output
    result.content = result.content.replace(hashtagRegex, '').trim();
  }

  if (mediaMatch) {
    result.mediaPrompt = mediaMatch[1].trim();
  }

  // Enforce platform limits
  const limit = PLATFORM_LIMITS[platform]?.maxLength || 2000;
  if (result.content.length > limit) {
    result.content = result.content.substring(0, limit - 3) + '...';
  }

  const hashtagLimit = PLATFORM_LIMITS[platform]?.hashtagCount || 10;
  result.hashtags = result.hashtags.slice(0, hashtagLimit);

  return result;
}

function calculatePredictedEngagement(
  parsed: ParsedContent,
  mlProfile: MLProfile | null,
  platform: string
): number {
  let score = 50; // Base score

  // Boost for using top hashtags
  if (mlProfile?.top_hashtags?.[platform]) {
    const topHashtags = mlProfile.top_hashtags[platform];
    const matchingHashtags = parsed.hashtags.filter(h =>
      topHashtags.some(th => th.toLowerCase() === h.toLowerCase())
    );
    score += matchingHashtags.length * 5;
  }

  // Content length optimization (sweet spots vary by platform)
  const contentLength = parsed.content.length;
  const platformLengthOptimums: Record<string, [number, number]> = {
    twitter: [100, 280],
    instagram: [150, 300],
    linkedin: [300, 700],
    facebook: [100, 250],
    youtube: [200, 500],
    tiktok: [50, 150],
  };

  const [min, max] = platformLengthOptimums[platform] || [100, 300];
  if (contentLength >= min && contentLength <= max) {
    score += 10;
  }

  // Boost for including CTA words
  const ctaWords = ['click', 'link', 'comment', 'share', 'follow', 'subscribe', 'join', 'learn', 'discover', 'try'];
  const hasCTA = ctaWords.some(word => parsed.content.toLowerCase().includes(word));
  if (hasCTA) {
    score += 8;
  }

  // Boost for question (increases comments)
  if (parsed.content.includes('?')) {
    score += 7;
  }

  // Boost for emoji usage (platform dependent)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu;
  const emojiCount = (parsed.content.match(emojiRegex) || []).length;
  if (['instagram', 'tiktok', 'facebook'].includes(platform) && emojiCount >= 1 && emojiCount <= 5) {
    score += 5;
  }

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}

function getBestPostingTime(mlProfile: MLProfile | null, platform: string): { day: string; time: string } | null {
  if (!mlProfile?.best_posting_times?.[platform]?.length) {
    // Default recommendations by platform
    const defaults: Record<string, { day: string; time: string }> = {
      instagram: { day: 'Wednesday', time: '11:00 AM' },
      facebook: { day: 'Thursday', time: '1:00 PM' },
      twitter: { day: 'Tuesday', time: '9:00 AM' },
      linkedin: { day: 'Tuesday', time: '10:00 AM' },
      youtube: { day: 'Friday', time: '5:00 PM' },
      tiktok: { day: 'Tuesday', time: '7:00 PM' },
    };
    return defaults[platform] || null;
  }

  const bestSlot = mlProfile.best_posting_times[platform][0];
  const hour = bestSlot.hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

  return {
    day: bestSlot.day,
    time: `${hour12}:00 ${ampm}`,
  };
}
