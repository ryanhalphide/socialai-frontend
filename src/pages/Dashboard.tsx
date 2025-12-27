import { useState } from 'react';
import {
  Users,
  TrendingUp,
  Eye,
  Heart,
} from 'lucide-react';
import {
  StatsCard,
  PlatformCard,
  UpcomingPosts,
  RecommendationsCard,
  EngagementChart,
} from '../components/dashboard';

// Mock data for demonstration
const mockStats = {
  totalFollowers: 125400,
  followersChange: 12.5,
  totalEngagement: 8.2,
  engagementChange: 3.1,
  totalImpressions: 892000,
  impressionsChange: 18.7,
  totalReach: 456000,
  reachChange: 9.2,
};

const mockPlatforms = [
  {
    platform: 'instagram' as const,
    accountName: '@acmecorp',
    followers: 45200,
    engagement: 4.2,
    postsThisWeek: 7,
    isConnected: true,
  },
  {
    platform: 'facebook' as const,
    accountName: 'Acme Corporation',
    followers: 32100,
    engagement: 2.8,
    postsThisWeek: 5,
    isConnected: true,
  },
  {
    platform: 'x' as const,
    accountName: '@acme',
    followers: 28500,
    engagement: 3.5,
    postsThisWeek: 12,
    isConnected: true,
  },
  {
    platform: 'linkedin' as const,
    accountName: 'Acme Corporation',
    followers: 19600,
    engagement: 5.1,
    postsThisWeek: 3,
    isConnected: true,
  },
];

const mockUpcomingPosts = [
  {
    id: '1',
    title: 'New Product Launch Announcement',
    platform: 'instagram',
    scheduledAt: '2025-01-02T10:00:00Z',
    status: 'scheduled' as const,
  },
  {
    id: '2',
    title: 'Behind the Scenes: Team Culture',
    platform: 'linkedin',
    scheduledAt: '2025-01-02T14:30:00Z',
    status: 'scheduled' as const,
  },
  {
    id: '3',
    title: 'Customer Success Story',
    platform: 'facebook',
    scheduledAt: '2025-01-03T09:00:00Z',
    status: 'pending_approval' as const,
  },
  {
    id: '4',
    title: 'Industry Trends Thread',
    platform: 'x',
    scheduledAt: '2025-01-03T16:00:00Z',
    status: 'draft' as const,
  },
];

const mockRecommendations = [
  {
    id: '1',
    title: 'Optimal posting time detected',
    description: 'Your Instagram audience is most active between 6-8 PM. Consider scheduling more content during this window.',
    category: 'timing' as const,
    platform: 'instagram',
    priority: 'high' as const,
    impact: '+15% engagement',
  },
  {
    id: '2',
    title: 'Trending hashtag opportunity',
    description: '#AIinBusiness is trending in your industry. Consider creating content around this topic.',
    category: 'hashtag' as const,
    priority: 'medium' as const,
    impact: '+25% reach',
  },
  {
    id: '3',
    title: 'Video content performs better',
    description: 'Your video posts get 3x more engagement. Consider increasing video content frequency.',
    category: 'content' as const,
    priority: 'high' as const,
    impact: '+40% engagement',
  },
];

const mockChartData = [
  { date: 'Dec 21', instagram: 4.2, facebook: 2.8, x: 3.5, linkedin: 5.1 },
  { date: 'Dec 22', instagram: 4.5, facebook: 2.9, x: 3.2, linkedin: 4.8 },
  { date: 'Dec 23', instagram: 4.1, facebook: 3.1, x: 3.8, linkedin: 5.0 },
  { date: 'Dec 24', instagram: 3.8, facebook: 2.7, x: 3.4, linkedin: 4.9 },
  { date: 'Dec 25', instagram: 4.0, facebook: 2.5, x: 3.0, linkedin: 4.5 },
  { date: 'Dec 26', instagram: 4.6, facebook: 3.0, x: 3.6, linkedin: 5.2 },
  { date: 'Dec 27', instagram: 4.8, facebook: 3.2, x: 3.9, linkedin: 5.4 },
];

export function Dashboard() {
  const [chartTimeRange, setChartTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

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
          value={mockStats.totalFollowers}
          change={mockStats.followersChange}
          icon={Users}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-100"
        />
        <StatsCard
          title="Avg. Engagement"
          value={`${mockStats.totalEngagement}%`}
          change={mockStats.engagementChange}
          icon={Heart}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
        />
        <StatsCard
          title="Total Impressions"
          value={mockStats.totalImpressions}
          change={mockStats.impressionsChange}
          icon={Eye}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatsCard
          title="Total Reach"
          value={mockStats.totalReach}
          change={mockStats.reachChange}
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
      </div>

      {/* Engagement Chart */}
      <EngagementChart
        data={mockChartData}
        timeRange={chartTimeRange}
        onTimeRangeChange={setChartTimeRange}
      />

      {/* Platform Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Connected Platforms</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mockPlatforms.map((platform) => (
            <PlatformCard key={platform.platform} {...platform} />
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingPosts posts={mockUpcomingPosts} />
        <RecommendationsCard
          recommendations={mockRecommendations}
          onDismiss={(id) => console.log('Dismissed:', id)}
          onApply={(id) => console.log('Applied:', id)}
        />
      </div>
    </div>
  );
}
