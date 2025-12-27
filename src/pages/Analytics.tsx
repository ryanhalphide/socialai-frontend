import { useState } from 'react';
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

// Mock data
const engagementData = [
  { date: 'Jan 1', instagram: 4200, facebook: 2400, twitter: 1800, linkedin: 1200 },
  { date: 'Jan 8', instagram: 4800, facebook: 2800, twitter: 2100, linkedin: 1400 },
  { date: 'Jan 15', instagram: 5100, facebook: 3100, twitter: 2400, linkedin: 1600 },
  { date: 'Jan 22', instagram: 5600, facebook: 3400, twitter: 2200, linkedin: 1800 },
  { date: 'Jan 29', instagram: 6200, facebook: 3800, twitter: 2600, linkedin: 2000 },
  { date: 'Feb 5', instagram: 5800, facebook: 3600, twitter: 2800, linkedin: 2200 },
  { date: 'Feb 12', instagram: 6500, facebook: 4000, twitter: 3000, linkedin: 2400 },
];

const followerGrowthData = [
  { date: 'Week 1', followers: 12500, growth: 320 },
  { date: 'Week 2', followers: 12820, growth: 280 },
  { date: 'Week 3', followers: 13100, growth: 450 },
  { date: 'Week 4', followers: 13550, growth: 380 },
  { date: 'Week 5', followers: 13930, growth: 520 },
  { date: 'Week 6', followers: 14450, growth: 410 },
];

const contentPerformance = [
  { type: 'Images', posts: 45, engagement: 12500, avgEngagement: 278 },
  { type: 'Videos', posts: 12, engagement: 8900, avgEngagement: 742 },
  { type: 'Carousels', posts: 18, engagement: 6200, avgEngagement: 344 },
  { type: 'Stories', posts: 65, engagement: 4500, avgEngagement: 69 },
  { type: 'Reels', posts: 8, engagement: 15200, avgEngagement: 1900 },
];

const platformDistribution = [
  { name: 'Instagram', value: 35, color: '#E1306C' },
  { name: 'Facebook', value: 25, color: '#1877F2' },
  { name: 'Twitter', value: 20, color: '#000000' },
  { name: 'LinkedIn', value: 15, color: '#0A66C2' },
  { name: 'YouTube', value: 5, color: '#FF0000' },
];

const topPosts = [
  {
    id: '1',
    title: 'Product Launch Announcement',
    platform: 'instagram',
    impressions: 45200,
    engagement: 3840,
    engagementRate: 8.5,
  },
  {
    id: '2',
    title: 'Behind the Scenes Video',
    platform: 'instagram',
    impressions: 38900,
    engagement: 2920,
    engagementRate: 7.5,
  },
  {
    id: '3',
    title: 'Industry Insights Thread',
    platform: 'twitter',
    impressions: 28400,
    engagement: 1890,
    engagementRate: 6.7,
  },
  {
    id: '4',
    title: 'Customer Success Story',
    platform: 'linkedin',
    impressions: 22100,
    engagement: 1540,
    engagementRate: 7.0,
  },
  {
    id: '5',
    title: 'Weekly Tips Carousel',
    platform: 'facebook',
    impressions: 18900,
    engagement: 1120,
    engagementRate: 5.9,
  },
];

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

export function Analytics() {
  const [dateRange, setDateRange] = useState('30d');

  const stats = [
    {
      label: 'Total Followers',
      value: '14,450',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
    },
    {
      label: 'Total Impressions',
      value: '892K',
      change: '+12.5%',
      trend: 'up',
      icon: Eye,
    },
    {
      label: 'Engagement Rate',
      value: '4.8%',
      change: '+0.6%',
      trend: 'up',
      icon: Heart,
    },
    {
      label: 'Total Engagement',
      value: '42.8K',
      change: '-2.1%',
      trend: 'down',
      icon: MessageCircle,
    },
  ];

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
                  <LineChart data={followerGrowthData}>
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
                      {platformDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {platformDistribution.map((platform) => (
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
                  {topPosts.map((post) => {
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
                            {post.engagementRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
