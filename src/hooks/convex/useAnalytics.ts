import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export interface DashboardStats {
  totalFollowers: number;
  followerGrowth: number;
  totalEngagement: number;
  engagementGrowth: number;
  totalPosts: number;
  postsGrowth: number;
  avgEngagementRate: number;
  engagementRateGrowth: number;
  publishedPosts?: number;
}

export interface EngagementTrend {
  date: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
}

export interface TopPost {
  _id: string;
  platform: string;
  contentText?: string;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  viralityScore: number;
  postedAt: number;
}

export interface FollowerGrowth {
  date: string;
  followers: number;
}

export interface PlatformStat {
  platform: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  followers: number;
  following: number;
  posts: number;
  engagementRate: number;
  isActive: boolean;
  lastSyncAt?: number;
}

export interface Recommendation {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action?: string;
}

export function useDashboardStats(startDate?: string, endDate?: string): DashboardStats | undefined {
  return useQuery(api.analytics.getDashboardStats, { startDate, endDate });
}

export function useEngagementTrends(platform?: string, days?: number): EngagementTrend[] | undefined {
  return useQuery(api.analytics.getEngagementTrends, { platform, days });
}

export function useTopPosts(limit?: number, platform?: string): TopPost[] | undefined {
  return useQuery(api.analytics.getTopPosts, { limit, platform });
}

export function useFollowerGrowth(platform?: string, days?: number): FollowerGrowth[] | undefined {
  return useQuery(api.analytics.getFollowerGrowth, { platform, days });
}

export function usePlatformStats(): PlatformStat[] | undefined {
  return useQuery(api.analytics.getPlatformStats, {});
}

export function useUpcomingPosts(limit?: number): Array<{ _id: string; title?: string; content: string; platforms: string[]; scheduledAt?: number; status: string }> | undefined {
  return useQuery(api.analytics.getUpcomingPosts, { limit });
}

export function useRecommendations(): Recommendation[] | undefined {
  return useQuery(api.analytics.getRecommendations, {});
}

// Helper to format large numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Helper to format percentage with sign
export function formatGrowth(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}
