import { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  Eye,
  Heart,
  Loader2,
} from 'lucide-react';
import {
  StatsCard,
  PlatformCard,
  UpcomingPosts,
  RecommendationsCard,
  EngagementChart,
} from '../components/dashboard';
import {
  useDashboardStats,
  useEngagementTrends,
  usePlatformStats,
  useUpcomingPosts,
  useRecommendations,
} from '../hooks/convex/useAnalytics';

// Fallback mock data for when Convex is not connected yet
const fallbackStats = {
  totalFollowers: 0,
  followerGrowth: 0,
  totalEngagement: 0,
  engagementGrowth: 0,
  totalPosts: 0,
  postsGrowth: 0,
  avgEngagementRate: 0,
  engagementRateGrowth: 0,
};

const fallbackPlatforms = [
  {
    platform: 'instagram' as const,
    accountName: 'Not connected',
    followers: 0,
    engagement: 0,
    postsThisWeek: 0,
    isConnected: false,
  },
  {
    platform: 'facebook' as const,
    accountName: 'Not connected',
    followers: 0,
    engagement: 0,
    postsThisWeek: 0,
    isConnected: false,
  },
  {
    platform: 'x' as const,
    accountName: 'Not connected',
    followers: 0,
    engagement: 0,
    postsThisWeek: 0,
    isConnected: false,
  },
  {
    platform: 'linkedin' as const,
    accountName: 'Not connected',
    followers: 0,
    engagement: 0,
    postsThisWeek: 0,
    isConnected: false,
  },
];

const fallbackRecommendations = [
  {
    id: '1',
    title: 'Connect your social accounts',
    description: 'Link your social media accounts to start tracking analytics and get personalized recommendations.',
    category: 'growth' as const,
    priority: 'high' as const,
    impact: 'Get started',
  },
  {
    id: '2',
    title: 'Create your first post',
    description: 'Start creating content to build your content library and schedule posts across platforms.',
    category: 'content' as const,
    priority: 'medium' as const,
    impact: 'Build momentum',
  },
];

export function Dashboard() {
  const [chartTimeRange, setChartTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Convex data
  const dashboardStats = useDashboardStats();
  const engagementTrends = useEngagementTrends(undefined, chartTimeRange === '7d' ? 7 : chartTimeRange === '30d' ? 30 : 90);
  const platformStats = usePlatformStats();
  const upcomingPosts = useUpcomingPosts(4);
  const recommendations = useRecommendations();

  // Use real data if available, otherwise fall back to defaults
  const stats = dashboardStats ?? fallbackStats;

  // Transform platform stats for PlatformCard
  type PlatformStatType = { platform: string; displayName?: string; username: string; followers: number; engagementRate: number; posts: number; isActive: boolean };
  const platforms = useMemo(() => {
    if (!platformStats || platformStats.length === 0) {
      return fallbackPlatforms;
    }
    return platformStats.map((p: PlatformStatType) => ({
      platform: p.platform as 'instagram' | 'facebook' | 'x' | 'linkedin' | 'youtube' | 'tiktok',
      accountName: p.displayName || p.username || 'Connected',
      followers: p.followers,
      engagement: p.engagementRate,
      postsThisWeek: p.posts,
      isConnected: p.isActive,
    }));
  }, [platformStats]);

  // Transform upcoming posts
  type UpcomingPostType = { _id: string; title?: string; content: string; platforms: string[]; scheduledAt?: number; status: string };
  const upcomingPostsList = useMemo(() => {
    if (!upcomingPosts || upcomingPosts.length === 0) {
      return [];
    }
    return upcomingPosts.map((post: UpcomingPostType) => ({
      id: post._id,
      title: post.title || post.content.slice(0, 40) + '...',
      platform: post.platforms[0] || 'instagram',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : new Date().toISOString(),
      status: post.status as 'draft' | 'scheduled' | 'pending_approval',
    }));
  }, [upcomingPosts]);

  // Transform recommendations
  type RecommendationType = { type: string; title: string; description: string; priority: 'high' | 'medium' | 'low'; action?: string };
  const recommendationsList = useMemo(() => {
    if (!recommendations || recommendations.length === 0) {
      return fallbackRecommendations;
    }
    return recommendations.map((rec: RecommendationType, index: number) => ({
      id: String(index + 1),
      title: rec.title,
      description: rec.description,
      category: (rec.type === 'timing' ? 'timing' : rec.type === 'hashtags' ? 'hashtag' : 'content') as 'timing' | 'hashtag' | 'content',
      platform: undefined,
      priority: rec.priority,
      impact: rec.action || 'Improve performance',
    }));
  }, [recommendations]);

  // Transform chart data
  type EngagementTrendType = { date: string; engagement: number; reach: number; clicks: number; impressions: number };
  const chartData = useMemo(() => {
    if (!engagementTrends || engagementTrends.length === 0) {
      // Return empty chart data
      return [];
    }
    return engagementTrends.map((trend: EngagementTrendType) => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      instagram: trend.engagement / 1000, // Normalize for chart display
      facebook: trend.reach / 1000,
      x: trend.clicks / 100,
      linkedin: trend.impressions / 10000,
    }));
  }, [engagementTrends]);

  const isLoading = dashboardStats === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's an overview of your social media performance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Followers"
          value={stats.totalFollowers}
          change={stats.followerGrowth}
          icon={Users}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-100"
        />
        <StatsCard
          title="Avg. Engagement"
          value={`${stats.avgEngagementRate}%`}
          change={stats.engagementRateGrowth}
          icon={Heart}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
        />
        <StatsCard
          title="Total Engagement"
          value={stats.totalEngagement}
          change={stats.engagementGrowth}
          icon={Eye}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Total Posts"
          value={stats.totalPosts}
          change={stats.postsGrowth}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
      </div>

      {/* Engagement Chart */}
      <EngagementChart
        data={chartData.length > 0 ? chartData : [{ date: 'No data', instagram: 0, facebook: 0, x: 0, linkedin: 0 }]}
        timeRange={chartTimeRange}
        onTimeRangeChange={setChartTimeRange}
      />

      {/* Platform Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Connected Platforms</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map((p) => (
            <PlatformCard
              key={p.platform}
              platform={p.platform as 'instagram' | 'facebook' | 'x' | 'linkedin' | 'youtube' | 'tiktok'}
              accountName={p.accountName}
              followers={p.followers}
              engagement={p.engagement}
              postsThisWeek={p.postsThisWeek}
              isConnected={p.isConnected}
            />
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingPosts posts={upcomingPostsList} />
        <RecommendationsCard
          recommendations={recommendationsList}
          onDismiss={(id) => console.log('Dismissed:', id)}
          onApply={(id) => console.log('Applied:', id)}
        />
      </div>
    </div>
  );
}
