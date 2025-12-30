import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface AnalyticsRow {
  platform: string;
  date: string;
  followers?: number;
  following?: number;
  posts_count?: number;
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  shares?: number;
  saves?: number;
}

interface ImportRequest {
  data: AnalyticsRow[];
  userId: string;
}

const VALID_PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'];

function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvText: string): AnalyticsRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const rows: AnalyticsRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVRow(lines[i]);
    const row: Record<string, string | number> = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      // Convert numeric fields
      if (['followers', 'following', 'posts_count', 'impressions', 'reach', 'engagement', 'clicks', 'shares', 'saves'].includes(header)) {
        row[header] = parseInt(value.replace(/,/g, ''), 10) || 0;
      } else {
        row[header] = value;
      }
    });

    // Validate required fields
    if (row.platform && row.date) {
      rows.push(row as unknown as AnalyticsRow);
    }
  }

  return rows;
}

function calculateEngagementRate(row: AnalyticsRow): number {
  const reach = row.reach || row.impressions || 0;
  if (reach === 0) return 0;

  const interactions = (row.engagement || 0) + (row.clicks || 0) + (row.shares || 0) + (row.saves || 0);
  return Math.round((interactions / reach) * 100 * 100) / 100; // 2 decimal places
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
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
    const contentType = req.headers['content-type'] || '';
    let analyticsData: AnalyticsRow[] = [];
    let userId: string = '';

    // Handle different content types
    if (contentType.includes('text/csv')) {
      // CSV upload
      const csvText = req.body as string;
      analyticsData = parseCSV(csvText);
      userId = req.headers['x-user-id'] as string;
    } else if (contentType.includes('application/json')) {
      // JSON upload
      const body = req.body as ImportRequest;
      analyticsData = body.data;
      userId = body.userId;
    } else {
      return res.status(400).json({ error: 'Unsupported content type. Use text/csv or application/json' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!analyticsData || analyticsData.length === 0) {
      return res.status(400).json({ error: 'No data to import' });
    }

    // Validate data
    const validatedData = analyticsData.filter(row => {
      const platform = row.platform?.toLowerCase();
      if (!VALID_PLATFORMS.includes(platform)) {
        console.warn(`Invalid platform: ${row.platform}`);
        return false;
      }
      if (!row.date || isNaN(Date.parse(row.date))) {
        console.warn(`Invalid date: ${row.date}`);
        return false;
      }
      return true;
    });

    if (validatedData.length === 0) {
      return res.status(400).json({ error: 'No valid data rows found' });
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Prepare records for upsert
    const records = validatedData.map(row => ({
      user_id: userId,
      platform: row.platform.toLowerCase(),
      date: row.date,
      followers: row.followers || 0,
      following: row.following || 0,
      posts_count: row.posts_count || 0,
      impressions: row.impressions || 0,
      reach: row.reach || 0,
      engagement: row.engagement || 0,
      clicks: row.clicks || 0,
      shares: row.shares || 0,
      saves: row.saves || 0,
      engagement_rate: calculateEngagementRate(row),
      click_through_rate: row.reach ? Math.round(((row.clicks || 0) / row.reach) * 100 * 100) / 100 : 0,
    }));

    // Upsert analytics data (update if exists, insert if not)
    const { data, error } = await supabase
      .from('analytics_snapshots')
      .upsert(records, {
        onConflict: 'user_id,platform,date',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to import analytics', details: error.message });
    }

    // Calculate trends
    const trends = await calculateTrends(supabase, userId);

    return res.status(200).json({
      success: true,
      imported: records.length,
      skipped: analyticsData.length - validatedData.length,
      trends,
    });
  } catch (error) {
    console.error('Error importing analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function calculateTrends(supabase: SupabaseClient, userId: string) {
  // Get last 30 days of data grouped by platform
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentData } = await supabase
    .from('analytics_snapshots')
    .select('platform, date, followers, engagement_rate, impressions')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (!recentData || recentData.length < 2) {
    return { message: 'Not enough data for trend analysis' };
  }

  // Group by platform and calculate trends
  const platformData: Record<string, typeof recentData> = {};
  recentData.forEach(row => {
    if (!platformData[row.platform]) {
      platformData[row.platform] = [];
    }
    platformData[row.platform].push(row);
  });

  const trends: Record<string, { followerGrowth: number; engagementTrend: string; impressionsTrend: string }> = {};

  for (const [platform, data] of Object.entries(platformData)) {
    if (data.length < 2) continue;

    const first = data[0];
    const last = data[data.length - 1];

    // Follower growth
    const followerGrowth = first.followers > 0
      ? Math.round(((last.followers - first.followers) / first.followers) * 100 * 10) / 10
      : 0;

    // Engagement trend (compare first half vs second half)
    const midpoint = Math.floor(data.length / 2);
    const firstHalfEngagement = data.slice(0, midpoint).reduce((sum, r) => sum + (r.engagement_rate || 0), 0) / midpoint;
    const secondHalfEngagement = data.slice(midpoint).reduce((sum, r) => sum + (r.engagement_rate || 0), 0) / (data.length - midpoint);
    const engagementTrend = secondHalfEngagement > firstHalfEngagement * 1.1 ? 'rising'
      : secondHalfEngagement < firstHalfEngagement * 0.9 ? 'falling'
        : 'stable';

    // Impressions trend
    const firstHalfImpressions = data.slice(0, midpoint).reduce((sum, r) => sum + (r.impressions || 0), 0) / midpoint;
    const secondHalfImpressions = data.slice(midpoint).reduce((sum, r) => sum + (r.impressions || 0), 0) / (data.length - midpoint);
    const impressionsTrend = secondHalfImpressions > firstHalfImpressions * 1.1 ? 'rising'
      : secondHalfImpressions < firstHalfImpressions * 0.9 ? 'falling'
        : 'stable';

    trends[platform] = {
      followerGrowth,
      engagementTrend,
      impressionsTrend,
    };
  }

  return trends;
}
