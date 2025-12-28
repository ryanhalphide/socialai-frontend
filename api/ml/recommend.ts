import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface RecommendRequest {
  userId: string;
  platform?: string;
}

interface Recommendation {
  id: string;
  type: 'content' | 'timing' | 'hashtags' | 'frequency' | 'improvement' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionable: boolean;
  action?: {
    label: string;
    type: 'generate' | 'schedule' | 'analyze' | 'adjust';
    params?: Record<string, unknown>;
  };
  data?: Record<string, unknown>;
}

interface WeeklyPlan {
  day: string;
  platform: string;
  contentType: string;
  suggestedTime: string;
  topic?: string;
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
    const { userId, platform } = req.body as RecommendRequest;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user data
    let mlProfile: Record<string, unknown> | null = null;
    let recentPosts: Record<string, unknown>[] = [];
    let analytics: Record<string, unknown>[] = [];

    if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Get ML profile
      const { data: profile } = await supabase
        .from('user_ml_profile')
        .select('*')
        .eq('user_id', userId)
        .single();

      mlProfile = profile;

      // Get recent posts
      let postsQuery = supabase
        .from('post_performance')
        .select('*')
        .eq('user_id', userId)
        .order('posted_at', { ascending: false })
        .limit(100);

      if (platform) {
        postsQuery = postsQuery.eq('platform', platform);
      }

      const { data: posts } = await postsQuery;
      recentPosts = posts || [];

      // Get analytics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let analyticsQuery = supabase
        .from('analytics_snapshots')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (platform) {
        analyticsQuery = analyticsQuery.eq('platform', platform);
      }

      const { data: analyticsData } = await analyticsQuery;
      analytics = analyticsData || [];
    }

    // Generate recommendations
    const recommendations = generateRecommendations(mlProfile, recentPosts, analytics, platform);

    // Generate weekly content plan
    const weeklyPlan = generateWeeklyPlan(mlProfile, platform);

    // Calculate health score
    const healthScore = calculateHealthScore(recentPosts, analytics);

    return res.status(200).json({
      recommendations,
      weeklyPlan,
      healthScore,
      dataAnalyzed: {
        posts: recentPosts.length,
        analyticsSnapshots: analytics.length,
        hasMLProfile: !!mlProfile,
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateRecommendations(
  mlProfile: Record<string, unknown> | null,
  posts: Record<string, unknown>[],
  analytics: Record<string, unknown>[],
  platform?: string
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  let idCounter = 1;

  // 1. Content Type Recommendations
  if (mlProfile?.content_type_performance && platform) {
    const perf = (mlProfile.content_type_performance as Record<string, Record<string, number>>)[platform];
    if (perf) {
      const types = Object.entries(perf).sort(([, a], [, b]) => b - a);
      if (types.length >= 2) {
        const [bestType, bestScore] = types[0];
        const [worstType, worstScore] = types[types.length - 1];

        if (bestScore > worstScore * 1.5) {
          recommendations.push({
            id: `rec-${idCounter++}`,
            type: 'content',
            priority: 'high',
            title: `Focus on ${bestType} content`,
            description: `Your ${bestType} posts get ${((bestScore / worstScore - 1) * 100).toFixed(0)}% more engagement than ${worstType}. Consider shifting your content mix.`,
            actionable: true,
            action: {
              label: `Generate ${bestType}`,
              type: 'generate',
              params: { contentType: bestType, platform },
            },
            data: { performance: perf },
          });
        }
      }
    }
  }

  // 2. Posting Frequency
  const recentPostsCount = posts.filter(p => {
    const date = new Date(p.posted_at as string);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;

  const optimalWeeklyPosts: Record<string, number> = {
    instagram: 4,
    facebook: 5,
    twitter: 14,
    linkedin: 3,
    youtube: 2,
    tiktok: 7,
  };

  const optimal = platform ? optimalWeeklyPosts[platform] || 4 : 4;

  if (recentPostsCount < optimal * 0.5) {
    recommendations.push({
      id: `rec-${idCounter++}`,
      type: 'frequency',
      priority: 'high',
      title: 'Post more frequently',
      description: `You've only posted ${recentPostsCount} times this week. Aim for ${optimal} posts per week for optimal growth.`,
      actionable: true,
      action: {
        label: 'Generate content batch',
        type: 'generate',
        params: { count: optimal - recentPostsCount },
      },
    });
  } else if (recentPostsCount > optimal * 1.5) {
    recommendations.push({
      id: `rec-${idCounter++}`,
      type: 'frequency',
      priority: 'low',
      title: 'Quality over quantity',
      description: `You're posting frequently (${recentPostsCount}/week). Consider focusing on quality - each post should add value.`,
      actionable: false,
    });
  }

  // 3. Timing Recommendations
  if (mlProfile?.best_posting_times && platform) {
    const times = (mlProfile.best_posting_times as Record<string, Array<{ day: string; hour: number; engagement: number }>>)[platform];
    if (times && times.length > 0) {
      const bestTime = times[0];
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'timing',
        priority: 'medium',
        title: `Best time: ${bestTime.day} at ${bestTime.hour}:00`,
        description: `Based on your data, ${bestTime.day}s at ${bestTime.hour}:00 get ${bestTime.engagement.toFixed(1)}% higher engagement.`,
        actionable: true,
        action: {
          label: 'Schedule post',
          type: 'schedule',
          params: { day: bestTime.day, hour: bestTime.hour },
        },
      });
    }
  }

  // 4. Hashtag Recommendations
  if (mlProfile?.top_hashtags && platform) {
    const hashtags = (mlProfile.top_hashtags as Record<string, string[]>)[platform];
    if (hashtags && hashtags.length > 0) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'hashtags',
        priority: 'medium',
        title: 'Use your top hashtags',
        description: `These hashtags perform best: ${hashtags.slice(0, 5).join(', ')}`,
        actionable: false,
        data: { hashtags: hashtags.slice(0, 10) },
      });
    }
  }

  // 5. Engagement Trend
  if (analytics.length >= 7) {
    const recentAnalytics = analytics.slice(0, 7);
    const avgRecent = recentAnalytics.reduce((sum, a) => sum + ((a.engagement_rate as number) || 0), 0) / 7;

    const olderAnalytics = analytics.slice(7, 14);
    if (olderAnalytics.length >= 7) {
      const avgOlder = olderAnalytics.reduce((sum, a) => sum + ((a.engagement_rate as number) || 0), 0) / 7;

      if (avgRecent < avgOlder * 0.8) {
        recommendations.push({
          id: `rec-${idCounter++}`,
          type: 'trend',
          priority: 'high',
          title: 'Engagement declining',
          description: `Your engagement has dropped ${((1 - avgRecent / avgOlder) * 100).toFixed(0)}% in the last week. Time to try something new!`,
          actionable: true,
          action: {
            label: 'Analyze patterns',
            type: 'analyze',
          },
        });
      } else if (avgRecent > avgOlder * 1.2) {
        recommendations.push({
          id: `rec-${idCounter++}`,
          type: 'trend',
          priority: 'low',
          title: 'Great momentum!',
          description: `Your engagement is up ${((avgRecent / avgOlder - 1) * 100).toFixed(0)}% this week. Keep doing what you're doing!`,
          actionable: false,
        });
      }
    }
  }

  // 6. AI Content Performance
  const aiPosts = posts.filter(p => p.was_ai_generated);
  const userPosts = posts.filter(p => !p.was_ai_generated);

  if (aiPosts.length >= 5 && userPosts.length >= 5) {
    const aiAvg = aiPosts.reduce((sum, p) => sum + ((p.engagement_rate as number) || 0), 0) / aiPosts.length;
    const userAvg = userPosts.reduce((sum, p) => sum + ((p.engagement_rate as number) || 0), 0) / userPosts.length;

    if (aiAvg > userAvg * 1.2) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'improvement',
        priority: 'medium',
        title: 'AI content performing well',
        description: `AI-generated content is getting ${((aiAvg / userAvg - 1) * 100).toFixed(0)}% better engagement. Use AI more for ideas and drafts.`,
        actionable: true,
        action: {
          label: 'Generate with AI',
          type: 'generate',
        },
      });
    } else if (userAvg > aiAvg * 1.2) {
      recommendations.push({
        id: `rec-${idCounter++}`,
        type: 'improvement',
        priority: 'medium',
        title: 'Your voice resonates',
        description: `Your original content outperforms AI by ${((userAvg / aiAvg - 1) * 100).toFixed(0)}%. Use AI for ideas but keep your unique voice.`,
        actionable: false,
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 8); // Return top 8
}

function generateWeeklyPlan(
  mlProfile: Record<string, unknown> | null,
  platform?: string
): WeeklyPlan[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const plan: WeeklyPlan[] = [];

  // Default platforms if not specified
  const platforms = platform
    ? [platform]
    : ['instagram', 'twitter', 'linkedin'];

  // Default content type distribution
  const contentTypes = ['image', 'video', 'text', 'carousel'];

  // Default times
  const defaultTimes: Record<string, string> = {
    instagram: '11:00 AM',
    twitter: '9:00 AM',
    linkedin: '10:00 AM',
    facebook: '1:00 PM',
    youtube: '5:00 PM',
    tiktok: '7:00 PM',
  };

  days.forEach((day, index) => {
    platforms.forEach(plat => {
      // Determine if we should post on this day
      const shouldPost = getShouldPost(plat, day);
      if (!shouldPost) return;

      // Get best time from ML profile or default
      let time = defaultTimes[plat] || '12:00 PM';
      if (mlProfile?.best_posting_times) {
        const times = (mlProfile.best_posting_times as Record<string, Array<{ day: string; hour: number }>>)[plat];
        if (times) {
          const dayTime = times.find(t => t.day.toLowerCase() === day.toLowerCase());
          if (dayTime) {
            const hour = dayTime.hour;
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
            time = `${hour12}:00 ${ampm}`;
          }
        }
      }

      // Get best content type from ML profile or rotate
      let contentType = contentTypes[index % contentTypes.length];
      if (mlProfile?.content_type_performance) {
        const perf = (mlProfile.content_type_performance as Record<string, Record<string, number>>)[plat];
        if (perf) {
          const bestType = Object.entries(perf).sort(([, a], [, b]) => b - a)[0];
          if (bestType) contentType = bestType[0];
        }
      }

      plan.push({
        day,
        platform: plat,
        contentType,
        suggestedTime: time,
      });
    });
  });

  return plan;
}

function getShouldPost(platform: string, day: string): boolean {
  // Platform-specific posting schedules
  const schedules: Record<string, string[]> = {
    instagram: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
    twitter: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    linkedin: ['Tuesday', 'Wednesday', 'Thursday'],
    facebook: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    youtube: ['Friday', 'Saturday'],
    tiktok: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
  };

  return schedules[platform]?.includes(day) ?? true;
}

function calculateHealthScore(
  posts: Record<string, unknown>[],
  analytics: Record<string, unknown>[]
): { score: number; factors: Array<{ name: string; score: number; max: number }> } {
  const factors: Array<{ name: string; score: number; max: number }> = [];

  // 1. Posting consistency (0-25)
  const weeklyPosts = posts.filter(p => {
    const date = new Date(p.posted_at as string);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }).length;

  const consistencyScore = Math.min(25, weeklyPosts * 5);
  factors.push({ name: 'Posting Consistency', score: consistencyScore, max: 25 });

  // 2. Engagement rate (0-25)
  const avgEngagement = posts.length > 0
    ? posts.reduce((sum, p) => sum + ((p.engagement_rate as number) || 0), 0) / posts.length
    : 0;
  const engagementScore = Math.min(25, avgEngagement * 5);
  factors.push({ name: 'Engagement Rate', score: Math.round(engagementScore), max: 25 });

  // 3. Growth trend (0-25)
  let growthScore = 12.5; // Neutral
  if (analytics.length >= 14) {
    const recent = analytics.slice(0, 7).reduce((sum, a) => sum + ((a.followers as number) || 0), 0) / 7;
    const older = analytics.slice(7, 14).reduce((sum, a) => sum + ((a.followers as number) || 0), 0) / 7;
    if (older > 0) {
      const growth = (recent - older) / older;
      growthScore = Math.min(25, Math.max(0, 12.5 + growth * 250));
    }
  }
  factors.push({ name: 'Growth Trend', score: Math.round(growthScore), max: 25 });

  // 4. Content variety (0-25)
  const contentTypes = new Set(posts.map(p => p.content_type));
  const varietyScore = Math.min(25, contentTypes.size * 6);
  factors.push({ name: 'Content Variety', score: varietyScore, max: 25 });

  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);

  return {
    score: Math.round(totalScore),
    factors,
  };
}
