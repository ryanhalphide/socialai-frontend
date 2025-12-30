import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Heart,
  MessageCircle,
  ArrowUpRight,
  Calendar,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardLayout } from '../components/layout';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  useDashboardStats,
  useEngagementTrends,
  useTopPosts,
  useFollowerGrowth,
  usePlatformStats,
  formatNumber,
} from '../hooks/convex/useAnalytics';

// Fallback data for empty states
const fallbackEngagementData = [
  { date: 'No data', instagram: 0, facebook: 0, twitter: 0, linkedin: 0 },
];

const fallbackFollowerGrowthData = [
  { date: 'No data', followers: 0, growth: 0 },
];

const fallbackContentPerformance = [
  { type: 'Images', posts: 0, engagement: 0, avgEngagement: 0 },
  { type: 'Videos', posts: 0, engagement: 0, avgEngagement: 0 },
  { type: 'Carousels', posts: 0, engagement: 0, avgEngagement: 0 },
  { type: 'Reels', posts: 0, engagement: 0, avgEngagement: 0 },
];

const fallbackPlatformDistribution = [
  { name: 'Instagram', value: 0, color: '#E1306C' },
  { name: 'Facebook', value: 0, color: '#1877F2' },
  { name: 'Twitter', value: 0, color: '#000000' },
  { name: 'LinkedIn', value: 0, color: '#0A66C2' },
  { name: 'YouTube', value: 0, color: '#FF0000' },
];

const platformColors: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  twitter: '#000000',
  x: '#000000',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  tiktok: '#000000',
};

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  x: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

export function Analytics() {
  const [dateRange, setDateRange] = useState('30d');

  // Calculate days based on date range
  const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;

  // Convex data hooks
  const dashboardStats = useDashboardStats();
  const engagementTrends = useEngagementTrends(undefined, days);
  const topPostsData = useTopPosts(5);
  const followerGrowthData = useFollowerGrowth(undefined, days);
  const platformStats = usePlatformStats();

  const isLoading = dashboardStats === undefined;

  // Transform engagement trends for chart
  const engagementData = useMemo(() => {
    if (!engagementTrends || engagementTrends.length === 0) {
      return fallbackEngagementData;
    }
    return engagementTrends.map((trend: { date: string; engagement: number; reach: number; clicks: number; impressions: number }) => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      instagram: Math.round(trend.engagement / 4),
      facebook: Math.round(trend.reach / 4),
      twitter: Math.round(trend.clicks),
      linkedin: Math.round(trend.impressions / 10),
    }));
  }, [engagementTrends]);

  // Transform follower growth for chart
  const followerChartData = useMemo(() => {
    if (!followerGrowthData || followerGrowthData.length === 0) {
      return fallbackFollowerGrowthData;
    }
    let prevFollowers = 0;
    return followerGrowthData.map((data: { date: string; followers: number }, index: number) => {
      const growth = index > 0 ? data.followers - prevFollowers : 0;
      prevFollowers = data.followers;
      return {
        date: new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        followers: data.followers,
        growth: growth,
      };
    });
  }, [followerGrowthData]);

  // Transform platform stats for pie chart
  type PlatformStatType = { platform: string; followers: number };
  const platformDistribution = useMemo(() => {
    if (!platformStats || platformStats.length === 0) {
      return fallbackPlatformDistribution;
    }
    const total = platformStats.reduce((sum: number, p: PlatformStatType) => sum + p.followers, 0);
    if (total === 0) return fallbackPlatformDistribution;

    return platformStats.map((p: PlatformStatType) => ({
      name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      value: Math.round((p.followers / total) * 100),
      color: platformColors[p.platform] || '#6B7280',
    }));
  }, [platformStats]);

  // Transform top posts for table
  type TopPostType = { _id: string; contentText?: string; platform: string; likes: number; comments: number; shares: number; engagementRate: number };
  const topPosts = useMemo(() => {
    if (!topPostsData || topPostsData.length === 0) {
      return [];
    }
    return topPostsData.map((post: TopPostType) => ({
      id: post._id,
      title: post.contentText?.slice(0, 40) || 'Untitled Post',
      platform: post.platform,
      impressions: post.likes + post.comments + post.shares,
      engagement: post.likes + post.comments + post.shares,
      engagementRate: post.engagementRate,
    }));
  }, [topPostsData]);

  // Content performance (mock for now - would need separate query)
  const contentPerformance = fallbackContentPerformance;

  // Build stats array from real data
  const stats = useMemo(() => {
    const data = dashboardStats || {
      totalFollowers: 0,
      followerGrowth: 0,
      totalEngagement: 0,
      engagementGrowth: 0,
      avgEngagementRate: 0,
      engagementRateGrowth: 0,
    };

    // Calculate total impressions from engagement trends
    const totalImpressions = engagementTrends?.reduce((sum: number, t: { impressions: number }) => sum + t.impressions, 0) || 0;

    return [
      {
        label: 'Total Followers',
        value: formatNumber(data.totalFollowers),
        change: `${data.followerGrowth >= 0 ? '+' : ''}${data.followerGrowth.toFixed(1)}%`,
        trend: data.followerGrowth >= 0 ? 'up' : 'down',
        icon: Users,
      },
      {
        label: 'Total Impressions',
        value: formatNumber(totalImpressions),
        change: '+0.0%',
        trend: 'up' as const,
        icon: Eye,
      },
      {
        label: 'Engagement Rate',
        value: `${data.avgEngagementRate.toFixed(1)}%`,
        change: `${data.engagementRateGrowth >= 0 ? '+' : ''}${data.engagementRateGrowth.toFixed(1)}%`,
        trend: data.engagementRateGrowth >= 0 ? 'up' : 'down',
        icon: Heart,
      },
      {
        label: 'Total Engagement',
        value: formatNumber(data.totalEngagement),
        change: `${data.engagementGrowth >= 0 ? '+' : ''}${data.engagementGrowth.toFixed(1)}%`,
        trend: data.engagementGrowth >= 0 ? 'up' : 'down',
        icon: MessageCircle,
      },
    ];
  }, [dashboardStats, engagementTrends]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 mt-1">
              Track your social media performance and growth
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    dateRange === range
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <Button variant="secondary">
              <Calendar className="h-4 w-4 mr-1" />
              Custom Range
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-primary-50">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div
                      className={`flex items-center gap-1 text-sm font-medium ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {stat.trend === 'up' ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement by Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="instagram"
                      stackId="1"
                      stroke="#E1306C"
                      fill="#E1306C"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="facebook"
                      stackId="1"
                      stroke="#1877F2"
                      fill="#1877F2"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="twitter"
                      stackId="1"
                      stroke="#000000"
                      fill="#000000"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="linkedin"
                      stackId="1"
                      stroke="#0A66C2"
                      fill="#0A66C2"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Follower Growth */}
          <Card>
            <CardHeader>
              <CardTitle>Follower Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={followerChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="followers"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={{ fill: '#6366F1', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Performance & Platform Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Performance */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Content Performance by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={contentPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="type" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="avgEngagement"
                      fill="#6366F1"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Platform Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {platformDistribution.map((entry: { name: string; value: number; color: string }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {platformDistribution.map((platform: { name: string; value: number; color: string }) => (
                  <div
                    key={platform.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: platform.color }}
                      />
                      <span className="text-gray-600">{platform.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {platform.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Performing Posts</CardTitle>
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {topPosts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Post
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Platform
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Impressions
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Engagement
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPosts.map((post: { id: string; title: string; platform: string; impressions: number; engagement: number; engagementRate: number }) => {
                      const Icon = platformIcons[post.platform];
                      return (
                        <tr
                          key={post.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">
                              {post.title}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {Icon && (
                              <Icon className="h-5 w-5 text-gray-600" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {post.impressions.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            {post.engagement.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {post.engagementRate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No post performance data available yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Connect your social accounts and publish content to see analytics
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
