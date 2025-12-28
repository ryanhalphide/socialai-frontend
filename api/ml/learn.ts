import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface LearnRequest {
  userId: string;
  platform?: string;
  daysToAnalyze?: number;
}

interface LearningInsight {
  type: 'tone' | 'timing' | 'content_type' | 'hashtags' | 'length';
  insight: string;
  confidence: number;
  recommendation: string;
  data: Record<string, unknown>;
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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  try {
    const { userId, platform, daysToAnalyze = 30 } = req.body as LearnRequest;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch recent post performance
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToAnalyze);

    let query = supabase
      .from('post_performance')
      .select('*')
      .eq('user_id', userId)
      .gte('posted_at', startDate.toISOString())
      .order('posted_at', { ascending: false });

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return res.status(500).json({ error: 'Failed to fetch post data' });
    }

    if (!posts || posts.length < 5) {
      return res.status(200).json({
        message: 'Not enough data for learning',
        postsAnalyzed: posts?.length || 0,
        minimumRequired: 5,
        insights: [],
      });
    }

    // Run learning algorithms
    const insights: LearningInsight[] = [];

    // 1. Learn optimal posting times
    const timingInsight = learnOptimalTiming(posts);
    if (timingInsight) insights.push(timingInsight);

    // 2. Learn content type preferences
    const contentTypeInsight = learnContentTypePerformance(posts);
    if (contentTypeInsight) insights.push(contentTypeInsight);

    // 3. Learn optimal content length
    const lengthInsight = learnOptimalLength(posts);
    if (lengthInsight) insights.push(lengthInsight);

    // 4. Learn hashtag effectiveness
    const hashtagInsight = learnHashtagEffectiveness(posts);
    if (hashtagInsight) insights.push(hashtagInsight);

    // 5. Learn from AI-generated vs user content
    const aiInsight = learnAIvsUserContent(posts);
    if (aiInsight) insights.push(aiInsight);

    // Update ML profile with learned patterns
    await updateMLProfile(supabase, userId, platform || 'all', posts, insights);

    // Log the learning run
    await supabase.from('learning_log').insert({
      user_id: userId,
      event_type: 'preference_update',
      event_description: `Learning run completed. Analyzed ${posts.length} posts from last ${daysToAnalyze} days.`,
      new_value: {
        postsAnalyzed: posts.length,
        insightsGenerated: insights.length,
        platforms: [...new Set(posts.map(p => p.platform))],
      },
      confidence: 0.85,
    });

    return res.status(200).json({
      success: true,
      postsAnalyzed: posts.length,
      daysAnalyzed: daysToAnalyze,
      insights,
      profileUpdated: true,
    });
  } catch (error) {
    console.error('Error in learning:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function learnOptimalTiming(posts: Record<string, unknown>[]): LearningInsight | null {
  const timeSlots: Record<string, { total: number; count: number }> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  posts.forEach(post => {
    if (!post.posted_at || !post.engagement_rate) return;

    const date = new Date(post.posted_at as string);
    const day = days[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;

    if (!timeSlots[key]) {
      timeSlots[key] = { total: 0, count: 0 };
    }
    timeSlots[key].total += post.engagement_rate as number;
    timeSlots[key].count += 1;
  });

  const slots = Object.entries(timeSlots)
    .map(([key, stats]) => ({
      key,
      avg: stats.count > 0 ? stats.total / stats.count : 0,
      count: stats.count,
    }))
    .filter(s => s.count >= 2)
    .sort((a, b) => b.avg - a.avg);

  if (slots.length === 0) return null;

  const best = slots[0];
  const [bestDay, bestHour] = best.key.split('-');
  const worst = slots[slots.length - 1];
  const [worstDay, worstHour] = worst.key.split('-');

  const improvement = best.avg - worst.avg;

  return {
    type: 'timing',
    insight: `Best posting time: ${bestDay} at ${bestHour}:00 (${best.avg.toFixed(2)}% avg engagement)`,
    confidence: Math.min(0.9, 0.5 + (slots[0].count * 0.1)),
    recommendation: `Post on ${bestDay}s around ${bestHour}:00 for ${improvement.toFixed(1)}% higher engagement than ${worstDay} ${worstHour}:00`,
    data: {
      bestSlot: { day: bestDay, hour: parseInt(bestHour), avgEngagement: best.avg },
      worstSlot: { day: worstDay, hour: parseInt(worstHour), avgEngagement: worst.avg },
      allSlots: slots.slice(0, 5),
    },
  };
}

function learnContentTypePerformance(posts: Record<string, unknown>[]): LearningInsight | null {
  const typeStats: Record<string, { total: number; count: number }> = {};

  posts.forEach(post => {
    const type = (post.content_type as string) || 'text';
    const engagement = (post.engagement_rate as number) || 0;

    if (!typeStats[type]) {
      typeStats[type] = { total: 0, count: 0 };
    }
    typeStats[type].total += engagement;
    typeStats[type].count += 1;
  });

  const types = Object.entries(typeStats)
    .map(([type, stats]) => ({
      type,
      avg: stats.count > 0 ? stats.total / stats.count : 0,
      count: stats.count,
    }))
    .filter(t => t.count >= 2)
    .sort((a, b) => b.avg - a.avg);

  if (types.length < 2) return null;

  const best = types[0];
  const worst = types[types.length - 1];
  const multiplier = worst.avg > 0 ? (best.avg / worst.avg).toFixed(1) : 'significantly';

  return {
    type: 'content_type',
    insight: `${best.type} content performs ${multiplier}x better than ${worst.type}`,
    confidence: Math.min(0.85, 0.5 + (best.count * 0.05)),
    recommendation: `Focus on creating more ${best.type} content. Consider reducing ${worst.type} posts.`,
    data: {
      performance: types.reduce((acc, t) => ({ ...acc, [t.type]: t.avg }), {}),
      counts: types.reduce((acc, t) => ({ ...acc, [t.type]: t.count }), {}),
    },
  };
}

function learnOptimalLength(posts: Record<string, unknown>[]): LearningInsight | null {
  const lengthBuckets: Record<string, { total: number; count: number }> = {
    short: { total: 0, count: 0 },      // < 100 chars
    medium: { total: 0, count: 0 },     // 100-300 chars
    long: { total: 0, count: 0 },       // 300-500 chars
    veryLong: { total: 0, count: 0 },   // > 500 chars
  };

  posts.forEach(post => {
    const text = (post.content_text as string) || '';
    const engagement = (post.engagement_rate as number) || 0;
    const length = text.length;

    let bucket: string;
    if (length < 100) bucket = 'short';
    else if (length < 300) bucket = 'medium';
    else if (length < 500) bucket = 'long';
    else bucket = 'veryLong';

    lengthBuckets[bucket].total += engagement;
    lengthBuckets[bucket].count += 1;
  });

  const buckets = Object.entries(lengthBuckets)
    .map(([bucket, stats]) => ({
      bucket,
      avg: stats.count > 0 ? stats.total / stats.count : 0,
      count: stats.count,
    }))
    .filter(b => b.count >= 2)
    .sort((a, b) => b.avg - a.avg);

  if (buckets.length < 2) return null;

  const best = buckets[0];
  const lengthRanges: Record<string, string> = {
    short: 'under 100 characters',
    medium: '100-300 characters',
    long: '300-500 characters',
    veryLong: 'over 500 characters',
  };

  return {
    type: 'length',
    insight: `Posts with ${lengthRanges[best.bucket]} perform best (${best.avg.toFixed(2)}% avg engagement)`,
    confidence: Math.min(0.8, 0.4 + (best.count * 0.05)),
    recommendation: `Aim for ${lengthRanges[best.bucket]} in your posts.`,
    data: {
      performance: buckets.reduce((acc, b) => ({ ...acc, [b.bucket]: b.avg }), {}),
      optimalLength: best.bucket,
    },
  };
}

function learnHashtagEffectiveness(posts: Record<string, unknown>[]): LearningInsight | null {
  const hashtagStats: Record<string, { total: number; count: number }> = {};

  posts.forEach(post => {
    const hashtags = (post.hashtags as string[]) || [];
    const engagement = (post.engagement_rate as number) || 0;

    hashtags.forEach(tag => {
      const normalized = tag.toLowerCase().replace(/^#/, '');
      if (!hashtagStats[normalized]) {
        hashtagStats[normalized] = { total: 0, count: 0 };
      }
      hashtagStats[normalized].total += engagement;
      hashtagStats[normalized].count += 1;
    });
  });

  const hashtags = Object.entries(hashtagStats)
    .map(([tag, stats]) => ({
      tag: `#${tag}`,
      avg: stats.count > 0 ? stats.total / stats.count : 0,
      count: stats.count,
    }))
    .filter(h => h.count >= 2)
    .sort((a, b) => b.avg - a.avg);

  if (hashtags.length < 3) return null;

  const top5 = hashtags.slice(0, 5);
  const bottom3 = hashtags.slice(-3);

  return {
    type: 'hashtags',
    insight: `Top performing hashtags: ${top5.map(h => h.tag).join(', ')}`,
    confidence: Math.min(0.75, 0.4 + (top5[0].count * 0.05)),
    recommendation: `Use these hashtags more: ${top5.slice(0, 3).map(h => h.tag).join(', ')}. Avoid: ${bottom3.map(h => h.tag).join(', ')}`,
    data: {
      topHashtags: top5,
      bottomHashtags: bottom3,
      totalHashtagsAnalyzed: hashtags.length,
    },
  };
}

function learnAIvsUserContent(posts: Record<string, unknown>[]): LearningInsight | null {
  const aiStats = { total: 0, count: 0 };
  const userStats = { total: 0, count: 0 };

  posts.forEach(post => {
    const engagement = (post.engagement_rate as number) || 0;
    const wasAI = post.was_ai_generated as boolean;

    if (wasAI) {
      aiStats.total += engagement;
      aiStats.count += 1;
    } else {
      userStats.total += engagement;
      userStats.count += 1;
    }
  });

  if (aiStats.count < 3 || userStats.count < 3) return null;

  const aiAvg = aiStats.total / aiStats.count;
  const userAvg = userStats.total / userStats.count;
  const winner = aiAvg > userAvg ? 'AI' : 'user';
  const improvement = Math.abs(aiAvg - userAvg);

  return {
    type: 'tone',
    insight: `${winner === 'AI' ? 'AI-generated' : 'Your original'} content performs ${improvement.toFixed(2)}% better`,
    confidence: Math.min(0.7, 0.4 + (Math.min(aiStats.count, userStats.count) * 0.03)),
    recommendation: winner === 'AI'
      ? 'Continue using AI-generated content as a starting point, then personalize'
      : 'Your personal touch resonates with your audience. Use AI for ideas but keep your voice',
    data: {
      aiPerformance: { avg: aiAvg, count: aiStats.count },
      userPerformance: { avg: userAvg, count: userStats.count },
      winner,
    },
  };
}

async function updateMLProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  platform: string,
  posts: Record<string, unknown>[],
  insights: LearningInsight[]
) {
  // Get existing profile
  const { data: existingProfile } = await supabase
    .from('user_ml_profile')
    .select('*')
    .eq('user_id', userId)
    .single();

  const profile = existingProfile || {
    user_id: userId,
    preferred_tone: {},
    best_posting_times: {},
    top_hashtags: {},
    content_type_performance: {},
    performance_baselines: {},
  };

  // Update based on insights
  insights.forEach(insight => {
    switch (insight.type) {
      case 'timing':
        if (platform !== 'all') {
          profile.best_posting_times[platform] = insight.data.allSlots;
        }
        break;

      case 'content_type':
        if (platform !== 'all') {
          profile.content_type_performance[platform] = insight.data.performance;
        }
        break;

      case 'hashtags':
        if (platform !== 'all') {
          profile.top_hashtags[platform] = (insight.data.topHashtags as Array<{tag: string}>).map(h => h.tag);
        }
        break;
    }
  });

  // Calculate baselines
  const totalEngagement = posts.reduce((sum, p) => sum + ((p.engagement_rate as number) || 0), 0);
  const avgEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;

  if (platform !== 'all') {
    profile.performance_baselines[platform] = {
      avgEngagementRate: Math.round(avgEngagement * 100) / 100,
      postsAnalyzed: posts.length,
      lastUpdated: new Date().toISOString(),
    };
  }

  profile.total_posts_analyzed = posts.length;
  profile.last_learning_run = new Date().toISOString();
  profile.model_version = 'v1.1';

  // Upsert profile
  await supabase
    .from('user_ml_profile')
    .upsert(profile, { onConflict: 'user_id' });
}
