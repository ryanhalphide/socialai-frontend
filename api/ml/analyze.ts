import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface AnalyzeRequest {
  userId: string;
  platform?: string; // Optional: analyze specific platform or all
}

interface ContentTypePerformance {
  image: number;
  video: number;
  text: number;
  carousel: number;
  story: number;
  reel: number;
}

interface TimeSlot {
  day: string;
  hour: number;
  avgEngagement: number;
  postCount: number;
}

interface HashtagPerformance {
  hashtag: string;
  avgEngagement: number;
  useCount: number;
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
    const { userId, platform } = req.body as AnalyzeRequest;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch post performance data
    let query = supabase
      .from('post_performance')
      .select('*')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false })
      .limit(500);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return res.status(500).json({ error: 'Failed to fetch post data' });
    }

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        message: 'No posts found for analysis',
        recommendations: ['Start by posting content to build your performance data'],
      });
    }

    // Analyze content type performance
    const contentTypeStats = analyzeContentTypes(posts);

    // Analyze best posting times
    const bestTimes = analyzeBestPostingTimes(posts);

    // Analyze hashtag performance
    const hashtagStats = analyzeHashtags(posts);

    // Calculate overall metrics
    const overallMetrics = calculateOverallMetrics(posts);

    // Generate recommendations
    const recommendations = generateRecommendations({
      contentTypeStats,
      bestTimes,
      hashtagStats,
      overallMetrics,
      postsCount: posts.length,
    });

    // Update ML profile
    await updateMLProfile(supabase, userId, platform || 'all', {
      contentTypeStats,
      bestTimes,
      hashtagStats,
      overallMetrics,
    });

    return res.status(200).json({
      postsAnalyzed: posts.length,
      platform: platform || 'all',
      contentTypePerformance: contentTypeStats,
      bestPostingTimes: bestTimes.slice(0, 5),
      topHashtags: hashtagStats.slice(0, 10),
      overallMetrics,
      recommendations,
    });
  } catch (error) {
    console.error('Error analyzing:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function analyzeContentTypes(posts: Record<string, unknown>[]): ContentTypePerformance {
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

  const performance: ContentTypePerformance = {
    image: 0,
    video: 0,
    text: 0,
    carousel: 0,
    story: 0,
    reel: 0,
  };

  Object.entries(typeStats).forEach(([type, stats]) => {
    if (type in performance) {
      (performance as Record<string, number>)[type] = stats.count > 0
        ? Math.round((stats.total / stats.count) * 100) / 100
        : 0;
    }
  });

  return performance;
}

function analyzeBestPostingTimes(posts: Record<string, unknown>[]): TimeSlot[] {
  const timeSlots: Record<string, { total: number; count: number }> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  posts.forEach(post => {
    if (!post.posted_at) return;

    const date = new Date(post.posted_at as string);
    const day = days[date.getDay()];
    const hour = date.getHours();
    const key = `${day}-${hour}`;
    const engagement = (post.engagement_rate as number) || 0;

    if (!timeSlots[key]) {
      timeSlots[key] = { total: 0, count: 0 };
    }
    timeSlots[key].total += engagement;
    timeSlots[key].count += 1;
  });

  const slots: TimeSlot[] = Object.entries(timeSlots)
    .map(([key, stats]) => {
      const [day, hourStr] = key.split('-');
      return {
        day,
        hour: parseInt(hourStr, 10),
        avgEngagement: stats.count > 0 ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
        postCount: stats.count,
      };
    })
    .filter(slot => slot.postCount >= 2) // Only include slots with enough data
    .sort((a, b) => b.avgEngagement - a.avgEngagement);

  return slots;
}

function analyzeHashtags(posts: Record<string, unknown>[]): HashtagPerformance[] {
  const hashtagStats: Record<string, { total: number; count: number }> = {};

  posts.forEach(post => {
    const hashtags = (post.hashtags as string[]) || [];
    const engagement = (post.engagement_rate as number) || 0;

    hashtags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().replace(/^#/, '');
      if (!hashtagStats[normalizedTag]) {
        hashtagStats[normalizedTag] = { total: 0, count: 0 };
      }
      hashtagStats[normalizedTag].total += engagement;
      hashtagStats[normalizedTag].count += 1;
    });
  });

  return Object.entries(hashtagStats)
    .map(([hashtag, stats]) => ({
      hashtag: `#${hashtag}`,
      avgEngagement: stats.count > 0 ? Math.round((stats.total / stats.count) * 100) / 100 : 0,
      useCount: stats.count,
    }))
    .filter(h => h.useCount >= 2) // Only include hashtags used multiple times
    .sort((a, b) => b.avgEngagement - a.avgEngagement);
}

function calculateOverallMetrics(posts: Record<string, unknown>[]) {
  if (posts.length === 0) {
    return {
      avgEngagementRate: 0,
      avgReach: 0,
      avgLikes: 0,
      avgComments: 0,
      totalPosts: 0,
    };
  }

  const totals = posts.reduce(
    (acc, post) => ({
      engagement: acc.engagement + ((post.engagement_rate as number) || 0),
      reach: acc.reach + ((post.reach as number) || 0),
      likes: acc.likes + ((post.likes as number) || 0),
      comments: acc.comments + ((post.comments as number) || 0),
    }),
    { engagement: 0, reach: 0, likes: 0, comments: 0 }
  );

  return {
    avgEngagementRate: Math.round((totals.engagement / posts.length) * 100) / 100,
    avgReach: Math.round(totals.reach / posts.length),
    avgLikes: Math.round(totals.likes / posts.length),
    avgComments: Math.round(totals.comments / posts.length),
    totalPosts: posts.length,
  };
}

interface AnalysisData {
  contentTypeStats: ContentTypePerformance;
  bestTimes: TimeSlot[];
  hashtagStats: HashtagPerformance[];
  overallMetrics: ReturnType<typeof calculateOverallMetrics>;
  postsCount: number;
}

function generateRecommendations(data: AnalysisData): string[] {
  const recommendations: string[] = [];

  // Content type recommendations
  const contentTypes = Object.entries(data.contentTypeStats)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  if (contentTypes.length > 0) {
    const [topType, topScore] = contentTypes[0];
    const [worstType] = contentTypes[contentTypes.length - 1];

    if (topScore > 0) {
      recommendations.push(
        `Your ${topType} content performs ${Math.round(topScore * 10) / 10}% better on average. Consider creating more ${topType} posts.`
      );
    }

    if (contentTypes.length > 1 && worstType !== topType) {
      recommendations.push(
        `${worstType.charAt(0).toUpperCase() + worstType.slice(1)} posts are underperforming. Try a different approach or reduce frequency.`
      );
    }
  }

  // Posting time recommendations
  if (data.bestTimes.length > 0) {
    const topSlot = data.bestTimes[0];
    recommendations.push(
      `Best time to post: ${topSlot.day}s at ${topSlot.hour}:00 (${topSlot.avgEngagement}% avg engagement)`
    );

    // Find worst time
    if (data.bestTimes.length > 3) {
      const worstSlots = data.bestTimes.slice(-2);
      const worstTimes = worstSlots.map(s => `${s.day} ${s.hour}:00`).join(', ');
      recommendations.push(`Avoid posting at: ${worstTimes}`);
    }
  }

  // Hashtag recommendations
  if (data.hashtagStats.length > 0) {
    const topHashtags = data.hashtagStats.slice(0, 3).map(h => h.hashtag);
    recommendations.push(`Your top performing hashtags: ${topHashtags.join(', ')}`);
  }

  // Overall performance
  if (data.overallMetrics.avgEngagementRate > 0) {
    if (data.overallMetrics.avgEngagementRate >= 3) {
      recommendations.push('Great engagement rate! You\'re above industry average.');
    } else if (data.overallMetrics.avgEngagementRate < 1) {
      recommendations.push('Engagement is below average. Try asking questions and including CTAs in your posts.');
    }
  }

  // Volume recommendation
  if (data.postsCount < 10) {
    recommendations.push('Post more frequently to gather enough data for accurate analysis.');
  }

  return recommendations;
}

async function updateMLProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  platform: string,
  data: Omit<AnalysisData, 'postsCount' | 'recommendations'>
) {
  try {
    // Get existing profile or create new one
    const { data: existingProfile } = await supabase
      .from('user_ml_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    const contentTypePerformance = existingProfile?.content_type_performance || {};
    const bestPostingTimes = existingProfile?.best_posting_times || {};
    const topHashtags = existingProfile?.top_hashtags || {};
    const performanceBaselines = existingProfile?.performance_baselines || {};

    // Update platform-specific data
    if (platform !== 'all') {
      contentTypePerformance[platform] = data.contentTypeStats;
      bestPostingTimes[platform] = data.bestTimes.slice(0, 5).map(t => ({
        day: t.day,
        hour: t.hour,
        engagement: t.avgEngagement,
      }));
      topHashtags[platform] = data.hashtagStats.slice(0, 10).map(h => h.hashtag);
      performanceBaselines[platform] = data.overallMetrics;
    }

    const profileUpdate = {
      user_id: userId,
      content_type_performance: contentTypePerformance,
      best_posting_times: bestPostingTimes,
      top_hashtags: topHashtags,
      performance_baselines: performanceBaselines,
      total_posts_analyzed: (existingProfile?.total_posts_analyzed || 0) + 1,
      last_learning_run: new Date().toISOString(),
    };

    await supabase
      .from('user_ml_profile')
      .upsert(profileUpdate, { onConflict: 'user_id' });
  } catch (error) {
    console.error('Error updating ML profile:', error);
    // Don't fail the request if profile update fails
  }
}
