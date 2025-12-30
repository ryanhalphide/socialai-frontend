import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    // Core identity
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),

    // Auth metadata
    authProvider: v.string(), // 'email', 'google', 'github'
    externalId: v.optional(v.string()), // OAuth provider ID
    tokenIdentifier: v.optional(v.string()), // Convex auth token identifier

    // Account settings
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    onboardingCompleted: v.boolean(),

    // Subscription/billing
    subscriptionTier: v.string(), // 'free', 'pro', 'enterprise'
    subscriptionStatus: v.string(), // 'active', 'trial', 'canceled'
    aiCredits: v.number(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_token", ["tokenIdentifier"])
    .index("by_external_id", ["authProvider", "externalId"]),

  // Organizations/Teams
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("users"),
    logoUrl: v.optional(v.string()),
    plan: v.string(), // 'free', 'pro', 'enterprise'
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  // Team members
  teamMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(), // 'owner', 'admin', 'member', 'viewer'
    invitedBy: v.optional(v.id("users")),
    invitedAt: v.number(),
    joinedAt: v.optional(v.number()),
    status: v.string(), // 'pending', 'active', 'deactivated'
  })
    .index("by_org", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_user", ["organizationId", "userId"]),

  // Platform connections (OAuth tokens)
  platformConnections: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),

    // Platform info
    platform: v.string(), // 'instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok'
    platformAccountId: v.string(),
    platformUsername: v.string(),
    platformDisplayName: v.optional(v.string()),
    platformAvatarUrl: v.optional(v.string()),

    // OAuth tokens
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    tokenExpiresAt: v.optional(v.number()),
    scope: v.optional(v.array(v.string())),

    // Connection metadata
    isActive: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    followerCount: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"])
    .index("by_platform_account", ["platform", "platformAccountId"]),

  // Posts/Content
  posts: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),

    // Content
    title: v.optional(v.string()),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(v.string()), // 'image', 'video', 'carousel'
    hashtags: v.optional(v.array(v.string())),
    mentions: v.optional(v.array(v.string())),

    // Targeting
    platforms: v.array(v.string()),
    platformSpecificContent: v.optional(v.any()), // Platform-specific overrides

    // Status & Scheduling
    status: v.string(), // 'draft', 'scheduled', 'pending_approval', 'publishing', 'published', 'failed'
    scheduledAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),

    // AI metadata
    wasAiGenerated: v.boolean(),
    aiPromptUsed: v.optional(v.string()),
    viralScore: v.optional(v.number()),
    viralScoreBreakdown: v.optional(v.any()),

    // Publishing results (per platform)
    publishResults: v.optional(v.any()), // { instagram: { postId, url }, ... }

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_scheduled", ["scheduledAt"])
    .index("by_org", ["organizationId"]),

  // Scheduled posts queue
  scheduledPosts: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),

    platform: v.string(),
    connectionId: v.id("platformConnections"),

    scheduledAt: v.number(),
    status: v.string(), // 'pending', 'processing', 'completed', 'failed'

    attempts: v.number(),
    lastAttemptAt: v.optional(v.number()),
    error: v.optional(v.string()),

    platformPostId: v.optional(v.string()),
    platformPostUrl: v.optional(v.string()),
  })
    .index("by_scheduled", ["scheduledAt", "status"])
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  // Analytics snapshots (daily metrics per platform)
  analyticsSnapshots: defineTable({
    userId: v.id("users"),
    connectionId: v.id("platformConnections"),
    platform: v.string(),
    date: v.string(), // ISO date string YYYY-MM-DD

    // Core metrics
    followers: v.number(),
    following: v.number(),
    postsCount: v.number(),

    // Engagement metrics
    impressions: v.number(),
    reach: v.number(),
    engagement: v.number(),
    clicks: v.number(),
    shares: v.number(),
    saves: v.number(),

    // Calculated rates
    engagementRate: v.number(),
    clickThroughRate: v.number(),

    createdAt: v.number(),
  })
    .index("by_user_platform_date", ["userId", "platform", "date"])
    .index("by_user", ["userId"])
    .index("by_connection", ["connectionId"]),

  // Post performance metrics
  postPerformance: defineTable({
    userId: v.id("users"),
    postId: v.optional(v.id("posts")),
    connectionId: v.optional(v.id("platformConnections")),

    platform: v.string(),
    platformPostId: v.optional(v.string()),
    postUrl: v.optional(v.string()),

    // Content details
    contentType: v.string(), // 'image', 'video', 'carousel', 'text'
    contentText: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    mentions: v.optional(v.array(v.string())),

    // Timing
    postedAt: v.number(),
    bestEngagementHour: v.optional(v.number()),

    // Metrics
    impressions: v.number(),
    reach: v.number(),
    likes: v.number(),
    comments: v.number(),
    shares: v.number(),
    saves: v.number(),
    clicks: v.number(),
    videoViews: v.optional(v.number()),
    videoWatchTime: v.optional(v.number()),

    // Calculated scores
    engagementRate: v.number(),
    viralityScore: v.number(),

    // AI tracking
    wasAiGenerated: v.boolean(),
    aiPromptUsed: v.optional(v.string()),
    aiPredictedEngagement: v.optional(v.number()),

    // Learning flags
    userApproved: v.boolean(),
    userEdited: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_platform", ["userId", "platform"])
    .index("by_post", ["postId"])
    .index("by_posted_at", ["postedAt"]),

  // User ML profiles
  userMlProfiles: defineTable({
    userId: v.id("users"),

    // Learned preferences (stored as JSON)
    preferredTone: v.optional(v.any()),
    bestPostingTimes: v.optional(v.any()),
    topHashtags: v.optional(v.any()),
    contentTypePerformance: v.optional(v.any()),
    audienceInsights: v.optional(v.any()),
    writingStyle: v.optional(v.any()),
    performanceBaselines: v.optional(v.any()),

    // Learning metadata
    totalPostsAnalyzed: v.number(),
    lastLearningRun: v.optional(v.number()),
    modelVersion: v.string(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // A/B Tests
  abTests: defineTable({
    userId: v.id("users"),

    name: v.string(),
    platform: v.string(),
    experimentType: v.string(), // 'content', 'timing', 'hashtags', 'format'
    hypothesis: v.optional(v.string()),

    // Variants (stored as JSON array)
    variants: v.array(v.any()),
    allocation: v.any(), // Percentage allocation per variant

    // Configuration
    minSampleSize: v.number(),
    confidenceLevel: v.number(),
    duration: v.number(), // days

    // Status & Results
    status: v.string(), // 'draft', 'active', 'paused', 'completed'
    winner: v.optional(v.string()),
    winnerConfidence: v.optional(v.number()),
    insightsLearned: v.optional(v.string()),

    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // Learning log (ML events)
  learningLogs: defineTable({
    userId: v.id("users"),

    eventType: v.string(), // 'preference_update', 'pattern_detected', 'performance_insight', 'recommendation_generated'
    eventDescription: v.string(),

    oldValue: v.optional(v.any()),
    newValue: v.optional(v.any()),
    confidence: v.optional(v.number()),

    sourcePosts: v.optional(v.array(v.id("posts"))),

    createdAt: v.number(),
  })
    .index("by_user_time", ["userId", "createdAt"]),

  // User settings/preferences
  userSettings: defineTable({
    userId: v.id("users"),

    // Notification preferences
    emailNotifications: v.boolean(),
    pushNotifications: v.boolean(),
    notifyOnPublish: v.boolean(),
    notifyOnEngagement: v.boolean(),
    weeklyDigest: v.boolean(),

    // Content preferences
    defaultPlatforms: v.optional(v.array(v.string())),
    defaultTone: v.optional(v.string()),
    autoGenerateHashtags: v.boolean(),

    // Display preferences
    theme: v.string(), // 'light', 'dark', 'system'
    dashboardLayout: v.optional(v.any()),

    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // AI content queue (generated content awaiting approval)
  aiContentQueue: defineTable({
    userId: v.id("users"),

    platform: v.string(),
    contentType: v.string(),
    contentText: v.string(),
    contentMediaUrl: v.optional(v.string()),
    suggestedHashtags: v.optional(v.array(v.string())),

    // AI metadata
    generationPrompt: v.optional(v.string()),
    predictedEngagement: v.optional(v.number()),
    confidenceScore: v.optional(v.number()),
    suggestedPostTime: v.optional(v.number()),

    // Status
    status: v.string(), // 'pending', 'approved', 'rejected', 'edited', 'posted', 'scheduled'
    userFeedback: v.optional(v.string()),

    // Scheduling
    scheduledFor: v.optional(v.number()),
    postedAt: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_status", ["userId", "status"])
    .index("by_scheduled", ["scheduledFor"]),
});
