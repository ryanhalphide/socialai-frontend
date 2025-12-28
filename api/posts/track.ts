import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface TrackPostRequest {
  userId: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';
  postUrl?: string;
  platformPostId?: string;
  contentType: 'text' | 'image' | 'video' | 'carousel' | 'story' | 'reel';
  contentText: string;
  contentMediaUrl?: string;
  hashtags?: string[];
  mentions?: string[];
  wasAiGenerated?: boolean;
  aiPromptUsed?: string;
  aiPredictedEngagement?: number;
}

interface UpdateMetricsRequest {
  postId: string;
  userId: string;
  impressions?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  videoViews?: number;
  videoWatchTime?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    if (req.method === 'POST') {
      // Track a new post
      return await handleTrackNewPost(req, res, supabase);
    } else if (req.method === 'PUT') {
      // Update post metrics
      return await handleUpdateMetrics(req, res, supabase);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in post tracking:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleTrackNewPost(
  req: VercelRequest,
  res: VercelResponse,
  supabase: ReturnType<typeof createClient>
) {
  const {
    userId,
    platform,
    postUrl,
    platformPostId,
    contentType,
    contentText,
    contentMediaUrl,
    hashtags = [],
    mentions = [],
    wasAiGenerated = false,
    aiPromptUsed,
    aiPredictedEngagement,
  } = req.body as TrackPostRequest;

  if (!userId || !platform || !contentText) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['userId', 'platform', 'contentText'],
    });
  }

  const postData = {
    user_id: userId,
    platform,
    platform_post_id: platformPostId || null,
    post_url: postUrl || null,
    content_type: contentType || 'text',
    content_text: contentText,
    content_media_url: contentMediaUrl || null,
    hashtags,
    mentions,
    posted_at: new Date().toISOString(),
    was_ai_generated: wasAiGenerated,
    ai_prompt_used: aiPromptUsed || null,
    ai_predicted_engagement: aiPredictedEngagement || null,
    user_approved: true,
  };

  const { data, error } = await supabase
    .from('post_performance')
    .insert(postData)
    .select()
    .single();

  if (error) {
    console.error('Error inserting post:', error);
    return res.status(500).json({ error: 'Failed to track post', details: error.message });
  }

  // Also update learning log if AI-generated
  if (wasAiGenerated) {
    await supabase.from('learning_log').insert({
      user_id: userId,
      event_type: 'preference_update',
      event_description: `User posted AI-generated ${contentType} content to ${platform}`,
      new_value: {
        platform,
        contentType,
        hashtagCount: hashtags.length,
        contentLength: contentText.length,
      },
      source_posts: [data.id],
    });
  }

  return res.status(201).json({
    success: true,
    postId: data.id,
    message: 'Post tracked successfully. Update metrics when available.',
  });
}

async function handleUpdateMetrics(
  req: VercelRequest,
  res: VercelResponse,
  supabase: ReturnType<typeof createClient>
) {
  const {
    postId,
    userId,
    impressions,
    reach,
    likes,
    comments,
    shares,
    saves,
    clicks,
    videoViews,
    videoWatchTime,
  } = req.body as UpdateMetricsRequest;

  if (!postId || !userId) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['postId', 'userId'],
    });
  }

  // Verify post belongs to user
  const { data: existingPost } = await supabase
    .from('post_performance')
    .select('id, user_id, impressions, likes, comments, shares, reach')
    .eq('id', postId)
    .eq('user_id', userId)
    .single();

  if (!existingPost) {
    return res.status(404).json({ error: 'Post not found or unauthorized' });
  }

  // Calculate engagement rate
  const totalEngagement = (likes || 0) + (comments || 0) + (shares || 0) + (saves || 0);
  const reachValue = reach || impressions || 1;
  const engagementRate = Math.round((totalEngagement / reachValue) * 100 * 100) / 100;

  // Calculate virality score (shares/reach)
  const viralityScore = reach ? Math.round(((shares || 0) / reach) * 100 * 100) / 100 : 0;

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    engagement_rate: engagementRate,
    virality_score: viralityScore,
  };

  // Only update fields that were provided
  if (impressions !== undefined) updates.impressions = impressions;
  if (reach !== undefined) updates.reach = reach;
  if (likes !== undefined) updates.likes = likes;
  if (comments !== undefined) updates.comments = comments;
  if (shares !== undefined) updates.shares = shares;
  if (saves !== undefined) updates.saves = saves;
  if (clicks !== undefined) updates.clicks = clicks;
  if (videoViews !== undefined) updates.video_views = videoViews;
  if (videoWatchTime !== undefined) updates.video_watch_time = videoWatchTime;

  const { data, error } = await supabase
    .from('post_performance')
    .update(updates)
    .eq('id', postId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating metrics:', error);
    return res.status(500).json({ error: 'Failed to update metrics', details: error.message });
  }

  // Check if this is a significant change and log learning
  const oldEngagement = existingPost.likes + existingPost.comments + existingPost.shares;
  const newEngagement = (likes || 0) + (comments || 0) + (shares || 0);

  if (newEngagement > oldEngagement * 1.5) {
    await supabase.from('learning_log').insert({
      user_id: userId,
      event_type: 'performance_insight',
      event_description: 'Post showing strong engagement growth',
      old_value: { engagement: oldEngagement },
      new_value: { engagement: newEngagement, engagementRate },
      confidence: 0.8,
      source_posts: [postId],
    });
  }

  return res.status(200).json({
    success: true,
    postId: data.id,
    engagementRate,
    viralityScore,
    message: 'Metrics updated successfully',
  });
}
