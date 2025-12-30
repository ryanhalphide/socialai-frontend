import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List posts with optional filters
export const list = query({
  args: {
    status: v.optional(v.string()),
    platform: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    // Get user by token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      return [];
    }

    let postsQuery = ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const posts = await postsQuery.collect();

    // Apply filters in memory (Convex doesn't support multiple index filters)
    let filtered = posts;

    if (args.status) {
      filtered = filtered.filter((p) => p.status === args.status);
    }

    if (args.platform) {
      const platform = args.platform;
      filtered = filtered.filter((p) => p.platforms.includes(platform));
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

// Get a single post by ID
export const get = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const post = await ctx.db.get(args.postId);

    // Verify ownership
    if (post) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .first();

      if (!user || post.userId !== user._id) {
        return null;
      }
    }

    return post;
  },
});

// Get scheduled posts
export const getScheduled = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "scheduled")
      )
      .order("asc")
      .collect();

    // Sort by scheduledAt
    const sorted = posts.sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0));

    if (args.limit) {
      return sorted.slice(0, args.limit);
    }

    return sorted;
  },
});

// Get drafts
export const getDrafts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      return [];
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "draft")
      )
      .order("desc")
      .collect();

    if (args.limit) {
      return posts.slice(0, args.limit);
    }

    return posts;
  },
});

// Create a new post
export const create = mutation({
  args: {
    title: v.optional(v.string()),
    content: v.string(),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    mentions: v.optional(v.array(v.string())),
    platforms: v.array(v.string()),
    platformSpecificContent: v.optional(v.any()),
    status: v.string(),
    scheduledAt: v.optional(v.number()),
    wasAiGenerated: v.optional(v.boolean()),
    aiPromptUsed: v.optional(v.string()),
    viralScore: v.optional(v.number()),
    viralScoreBreakdown: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const postId = await ctx.db.insert("posts", {
      userId: user._id,
      title: args.title,
      content: args.content,
      mediaUrls: args.mediaUrls,
      mediaType: args.mediaType,
      hashtags: args.hashtags,
      mentions: args.mentions,
      platforms: args.platforms,
      platformSpecificContent: args.platformSpecificContent,
      status: args.status,
      scheduledAt: args.scheduledAt,
      wasAiGenerated: args.wasAiGenerated ?? false,
      aiPromptUsed: args.aiPromptUsed,
      viralScore: args.viralScore,
      viralScoreBreakdown: args.viralScoreBreakdown,
      createdAt: now,
      updatedAt: now,
    });

    return postId;
  },
});

// Update an existing post
export const update = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    mediaUrls: v.optional(v.array(v.string())),
    mediaType: v.optional(v.string()),
    hashtags: v.optional(v.array(v.string())),
    mentions: v.optional(v.array(v.string())),
    platforms: v.optional(v.array(v.string())),
    platformSpecificContent: v.optional(v.any()),
    status: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    viralScore: v.optional(v.number()),
    viralScoreBreakdown: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || post.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const { postId, ...updates } = args;

    // Filter out undefined values
    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    await ctx.db.patch(args.postId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return args.postId;
  },
});

// Delete a post
export const remove = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || post.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.postId);
    return true;
  },
});

// Duplicate a post
export const duplicate = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const original = await ctx.db.get(args.postId);
    if (!original) {
      throw new Error("Post not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || original.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    const newPostId = await ctx.db.insert("posts", {
      userId: user._id,
      title: original.title ? `${original.title} (copy)` : undefined,
      content: original.content,
      mediaUrls: original.mediaUrls,
      mediaType: original.mediaType,
      hashtags: original.hashtags,
      mentions: original.mentions,
      platforms: original.platforms,
      platformSpecificContent: original.platformSpecificContent,
      status: "draft",
      wasAiGenerated: original.wasAiGenerated,
      aiPromptUsed: original.aiPromptUsed,
      viralScore: original.viralScore,
      viralScoreBreakdown: original.viralScoreBreakdown,
      createdAt: now,
      updatedAt: now,
    });

    return newPostId;
  },
});

// Schedule a post
export const schedule = mutation({
  args: {
    postId: v.id("posts"),
    scheduledAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || post.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.postId, {
      status: "scheduled",
      scheduledAt: args.scheduledAt,
      updatedAt: Date.now(),
    });

    return args.postId;
  },
});

// Publish a post immediately (mark as published)
export const publish = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user || post.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();

    await ctx.db.patch(args.postId, {
      status: "published",
      publishedAt: now,
      updatedAt: now,
    });

    return args.postId;
  },
});

// Get post stats (counts by status)
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { total: 0, drafts: 0, scheduled: 0, published: 0 };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();

    if (!user) {
      return { total: 0, drafts: 0, scheduled: 0, published: 0 };
    }

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return {
      total: posts.length,
      drafts: posts.filter((p) => p.status === "draft").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      published: posts.filter((p) => p.status === "published").length,
    };
  },
});
