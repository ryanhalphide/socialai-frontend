import { v } from "convex/values";
import { query } from "./_generated/server";

// Get dashboard stats
export const getDashboardStats = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, _args) => {
    // Try to get authenticated user, fallback to demo user
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    }

    // Fallback to demo user if no auth
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@socialsync.pro"))
        .first();
    }

    if (!user) {
      return {
        totalFollowers: 0,
        followerGrowth: 0,
        totalEngagement: 0,
        engagementGrowth: 0,
        totalPosts: 0,
        postsGrowth: 0,
        avgEngagementRate: 0,
        engagementRateGrowth: 0,
      };
    }

    // Get latest analytics snapshot for each platform
    const snapshots = await ctx.db
      .query("analyticsSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Get unique latest snapshot per platform
    const latestByPlatform = new Map<string, typeof snapshots[0]>();
    for (const snapshot of snapshots) {
      if (!latestByPlatform.has(snapshot.platform)) {
        latestByPlatform.set(snapshot.platform, snapshot);
      }
    }

    // Sum up totals
    let totalFollowers = 0;
    let totalEngagement = 0;
    let totalImpressions = 0;

    for (const snapshot of latestByPlatform.values()) {
      totalFollowers += snapshot.followers || 0;
      totalEngagement += snapshot.engagement || 0;
      totalImpressions += snapshot.impressions || 0;
    }

    // Get posts count
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === "published").length;

    // Calculate average engagement rate
    const avgEngagementRate = totalImpressions > 0
      ? (totalEngagement / totalImpressions) * 100
      : 0;

    // TODO: Calculate growth by comparing with previous period
    // For now, return placeholder growth values
    return {
      totalFollowers,
      followerGrowth: 5.2, // Placeholder
      totalEngagement,
      engagementGrowth: 12.3, // Placeholder
      totalPosts,
      postsGrowth: 8.1, // Placeholder
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      engagementRateGrowth: 2.4, // Placeholder
      publishedPosts,
    };
  },
});

// Get engagement chart data
export const getEngagementTrends = query({
  args: {
    platform: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Try to get authenticated user, fallback to demo user
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    }

    // Fallback to demo user if no auth
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@socialsync.pro"))
        .first();
    }

    if (!user) {
      return [];
    }

    const daysToFetch = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);
    const startDateStr = startDate.toISOString().split("T")[0];

    let snapshots = await ctx.db
      .query("analyticsSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by date range
    snapshots = snapshots.filter((s) => s.date >= startDateStr);

    // Filter by platform if specified
    if (args.platform) {
      snapshots = snapshots.filter((s) => s.platform === args.platform);
    }

    // Group by date and sum metrics
    const byDate = new Map<string, {
      date: string;
      impressions: number;
      reach: number;
      engagement: number;
      clicks: number;
    }>();

    for (const snapshot of snapshots) {
      const existing = byDate.get(snapshot.date) || {
        date: snapshot.date,
        impressions: 0,
        reach: 0,
        engagement: 0,
        clicks: 0,
      };

      existing.impressions += snapshot.impressions || 0;
      existing.reach += snapshot.reach || 0;
      existing.engagement += snapshot.engagement || 0;
      existing.clicks += snapshot.clicks || 0;

      byDate.set(snapshot.date, existing);
    }

    // Sort by date
    const sortedData = Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return sortedData;
  },
});

// Get top performing posts
export const getTopPosts = query({
  args: {
    limit: v.optional(v.number()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to get authenticated user, fallback to demo user
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    }

    // Fallback to demo user if no auth
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@socialsync.pro"))
        .first();
    }

    if (!user) {
      return [];
    }

    let performance = await ctx.db
      .query("postPerformance")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Filter by platform if specified
    if (args.platform) {
      performance = performance.filter((p) => p.platform === args.platform);
    }

    // Sort by engagement rate (virality score)
    performance.sort((a, b) => b.viralityScore - a.viralityScore);

    // Limit results
    const limit = args.limit || 5;
    return performance.slice(0, limit);
  },
});

// Get follower growth data
export const getFollowerGrowth = query({
  args: {
    platform: v.optional(v.string()),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Try to get authenticated user, fallback to demo user
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    }

    // Fallback to demo user if no auth
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@socialsync.pro"))
        .first();
    }

    if (!user) {
      return [];
    }

    const daysToFetch = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);
    const startDateStr = startDate.toISOString().split("T")[0];

    let snapshots = await ctx.db
      .query("analyticsSnapshots")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by date range
    snapshots = snapshots.filter((s) => s.date >= startDateStr);

    // Filter by platform if specified
    if (args.platform) {
      snapshots = snapshots.filter((s) => s.platform === args.platform);
    }

    // Group by date and sum followers
    const byDate = new Map<string, { date: string; followers: number }>();

    for (const snapshot of snapshots) {
      const existing = byDate.get(snapshot.date) || {
        date: snapshot.date,
        followers: 0,
      };

      existing.followers += snapshot.followers || 0;
      byDate.set(snapshot.date, existing);
    }

    // Sort by date
    const sortedData = Array.from(byDate.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return sortedData;
  },
});

// Get platform connection stats
export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    // Try to get authenticated user, fallback to demo user
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    }

    // Fallback to demo user if no auth
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@socialsync.pro"))
        .first();
    }

    if (!user) {
      return [];
    }

    // Get all active connections
    const connections = await ctx.db
      .query("platformConnections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const activeConnections = connections.filter((c) => c.isActive);

    // Get latest analytics for each platform
    const platformStats = await Promise.all(
      activeConnections.map(async (connection) => {
        const latestSnapshot = await ctx.db
          .query("analyticsSnapshots")
          .withIndex("by_connection", (q) => q.eq("connectionId", connection._id))
          .order("desc")
          .first();

        return {
          platform: connection.platform,
          username: connection.platformUsername,
          displayName: connection.platformDisplayName,
          avatarUrl: connection.platformAvatarUrl,
          followers: latestSnapshot?.followers || connection.followerCount || 0,
          following: latestSnapshot?.following || 0,
          posts: latestSnapshot?.postsCount || 0,
          engagementRate: latestSnapshot?.engagementRate || 0,
          isActive: connection.isActive,
          lastSyncAt: connection.lastSyncAt,
        };
      })
    );

    return platformStats;
  },
});

// Get upcoming posts (scheduled)
export const getUpcomingPosts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Try to get authenticated user, fallback to demo user
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    }

    // Fallback to demo user if no auth
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@socialsync.pro"))
        .first();
    }

    if (!user) {
      return [];
    }

    const now = Date.now();

    const scheduledPosts = await ctx.db
      .query("posts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "scheduled")
      )
      .collect();

    // Filter for future posts and sort by scheduled time
    const upcomingPosts = scheduledPosts
      .filter((p) => p.scheduledAt && p.scheduledAt > now)
      .sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0));

    const limit = args.limit || 5;
    return upcomingPosts.slice(0, limit);
  },
});

// Get AI recommendations based on ML profile
export const getRecommendations = query({
  args: {},
  handler: async (ctx) => {
    // Try to get authenticated user, fallback to demo user
    let user = null;
    const identity = await ctx.auth.getUserIdentity();

    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();
    }

    // Fallback to demo user if no auth
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@socialsync.pro"))
        .first();
    }

    if (!user) {
      return [];
    }

    // Get user's ML profile
    const mlProfile = await ctx.db
      .query("userMlProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // Generate recommendations based on profile
    const recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: "high" | "medium" | "low";
      action?: string;
    }> = [];

    if (!mlProfile || mlProfile.totalPostsAnalyzed < 5) {
      recommendations.push({
        type: "onboarding",
        title: "Create More Content",
        description:
          "Post at least 5 pieces of content so we can learn your audience's preferences and provide personalized recommendations.",
        priority: "high",
        action: "Create Post",
      });
    } else {
      // Add recommendations based on ML insights
      if (mlProfile.bestPostingTimes) {
        recommendations.push({
          type: "timing",
          title: "Optimal Posting Time",
          description:
            "Based on your audience engagement patterns, we recommend posting during your peak hours.",
          priority: "medium",
          action: "Schedule Post",
        });
      }

      if (mlProfile.topHashtags) {
        recommendations.push({
          type: "hashtags",
          title: "Use Your Top Hashtags",
          description:
            "Your best performing hashtags have been identified. Use them to increase reach.",
          priority: "medium",
        });
      }
    }

    // Check for pending AI content
    const pendingAI = await ctx.db
      .query("aiContentQueue")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending")
      )
      .collect();

    if (pendingAI.length > 0) {
      recommendations.push({
        type: "ai-content",
        title: `${pendingAI.length} AI-Generated Posts Waiting`,
        description:
          "Review and approve AI-generated content suggestions in your queue.",
        priority: "high",
        action: "Review Content",
      });
    }

    return recommendations;
  },
});
