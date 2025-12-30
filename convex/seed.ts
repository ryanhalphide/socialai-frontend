import { mutation } from "./_generated/server";

// Seed the database with test data
export const seedTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    // Create a test user first
    const userId = await ctx.db.insert("users", {
      email: "demo@socialsync.pro",
      name: "Demo User",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
      authProvider: "email",
      timezone: "America/New_York",
      language: "en",
      onboardingCompleted: true,
      subscriptionTier: "pro",
      subscriptionStatus: "active",
      aiCredits: 2500,
      createdAt: now - 30 * oneDay,
      updatedAt: now,
      lastLoginAt: now,
    });

    // Create test posts with various statuses
    const posts = [
      // Published posts
      {
        title: "Exciting Product Launch!",
        content: "We're thrilled to announce our new AI-powered social media assistant! It helps you create engaging content, schedule posts, and analyze performance all in one place. #AI #SocialMedia #ProductLaunch",
        platforms: ["instagram", "facebook", "linkedin"],
        status: "published",
        publishedAt: now - 7 * oneDay,
        hashtags: ["AI", "SocialMedia", "ProductLaunch"],
        mediaType: "image",
        mediaUrls: ["https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800"],
        wasAiGenerated: false,
        viralScore: 85,
      },
      {
        title: "Tips for Better Engagement",
        content: "Want to boost your social media engagement? Here are 5 proven tips:\n\n1. Post consistently\n2. Use relevant hashtags\n3. Engage with your audience\n4. Share valuable content\n5. Analyze and adapt\n\n#SocialMediaTips #Marketing",
        platforms: ["twitter", "linkedin"],
        status: "published",
        publishedAt: now - 5 * oneDay,
        hashtags: ["SocialMediaTips", "Marketing"],
        wasAiGenerated: true,
        aiPromptUsed: "Create tips for social media engagement",
        viralScore: 72,
      },
      {
        title: "Behind the Scenes",
        content: "Take a look at our team working hard to bring you the best social media tools! We're passionate about helping businesses grow their online presence. #BTS #TeamWork #StartupLife",
        platforms: ["instagram", "tiktok"],
        status: "published",
        publishedAt: now - 3 * oneDay,
        hashtags: ["BTS", "TeamWork", "StartupLife"],
        mediaType: "video",
        mediaUrls: ["https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"],
        wasAiGenerated: false,
        viralScore: 68,
      },
      {
        title: "Customer Success Story",
        content: "Amazing results from one of our users! Sarah increased her engagement by 300% in just 3 months using our AI recommendations. Read her full story on our blog! #SuccessStory #CustomerLove",
        platforms: ["facebook", "linkedin"],
        status: "published",
        publishedAt: now - 1 * oneDay,
        hashtags: ["SuccessStory", "CustomerLove"],
        wasAiGenerated: false,
        viralScore: 91,
      },

      // Scheduled posts
      {
        title: "New Year Marketing Strategies",
        content: "2025 is here! Time to revamp your marketing strategy. Our AI has analyzed trends and here's what's working:\n\n- Short-form video content\n- Authentic storytelling\n- Community building\n- AI-assisted content creation\n\nStart planning now! #Marketing2025 #NewYear",
        platforms: ["instagram", "twitter", "linkedin"],
        status: "scheduled",
        scheduledAt: now + 2 * oneDay + 10 * oneHour,
        hashtags: ["Marketing2025", "NewYear"],
        wasAiGenerated: true,
        aiPromptUsed: "Create a New Year marketing strategies post",
        viralScore: 78,
      },
      {
        title: "Weekly Analytics Recap",
        content: "Your weekly social media performance is in! This week:\n- 15% increase in followers\n- 28% boost in engagement\n- Top performing post: Product Launch\n\nKeep up the great work! #Analytics #GrowthMindset",
        platforms: ["facebook", "linkedin"],
        status: "scheduled",
        scheduledAt: now + 1 * oneDay + 14 * oneHour,
        hashtags: ["Analytics", "GrowthMindset"],
        wasAiGenerated: true,
        viralScore: 65,
      },
      {
        title: "Flash Sale Announcement",
        content: "FLASH SALE! Get 50% off our Pro plan for the next 48 hours! Use code NEWYEAR50 at checkout. Limited time only! #Sale #Discount #LimitedOffer",
        platforms: ["instagram", "twitter", "facebook"],
        status: "scheduled",
        scheduledAt: now + 3 * oneDay + 9 * oneHour,
        hashtags: ["Sale", "Discount", "LimitedOffer"],
        mediaType: "image",
        mediaUrls: ["https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=800"],
        wasAiGenerated: false,
        viralScore: 88,
      },

      // Draft posts
      {
        title: "Feature Spotlight: AI Content Generator",
        content: "Introducing our most requested feature - the AI Content Generator! Create engaging posts in seconds with just a few keywords. Try it today!\n\n#AIContent #Productivity #ContentCreation",
        platforms: ["instagram", "linkedin"],
        status: "draft",
        hashtags: ["AIContent", "Productivity", "ContentCreation"],
        wasAiGenerated: false,
        viralScore: 75,
      },
      {
        title: "User Poll: What features do you want?",
        content: "We're always improving! What feature would you like to see next?\n\n- Advanced analytics\n- More AI templates\n- Team collaboration\n- Competitor analysis\n\nComment below! #UserFeedback #ProductDevelopment",
        platforms: ["twitter", "instagram"],
        status: "draft",
        hashtags: ["UserFeedback", "ProductDevelopment"],
        wasAiGenerated: true,
        aiPromptUsed: "Create an engagement poll for product features",
        viralScore: 62,
      },
      {
        title: "Industry Trends Report",
        content: "Our latest industry trends report is here! Key findings:\n\n- Video content dominates engagement\n- AI tools adoption up 150%\n- Micro-influencers outperform macro\n- Authenticity matters more than ever\n\nDownload the full report (link in bio)",
        platforms: ["linkedin", "facebook"],
        status: "draft",
        hashtags: ["IndustryTrends", "SocialMediaMarketing", "Report"],
        wasAiGenerated: false,
        viralScore: 70,
      },
    ];

    const postIds = [];
    for (const post of posts) {
      const postId = await ctx.db.insert("posts", {
        userId,
        title: post.title,
        content: post.content,
        platforms: post.platforms,
        status: post.status,
        scheduledAt: post.scheduledAt,
        publishedAt: post.publishedAt,
        hashtags: post.hashtags,
        mediaType: post.mediaType,
        mediaUrls: post.mediaUrls,
        wasAiGenerated: post.wasAiGenerated,
        aiPromptUsed: post.aiPromptUsed,
        viralScore: post.viralScore,
        createdAt: now - Math.floor(Math.random() * 14 * oneDay),
        updatedAt: now,
      });
      postIds.push(postId);
    }

    // Create analytics snapshots for the past 30 days
    const platforms = ["instagram", "facebook", "twitter", "linkedin"];
    const baseMetrics = {
      instagram: { followers: 12500, engagement: 450, impressions: 25000 },
      facebook: { followers: 8200, engagement: 280, impressions: 18000 },
      twitter: { followers: 5600, engagement: 320, impressions: 15000 },
      linkedin: { followers: 3400, engagement: 180, impressions: 9000 },
    };

    // We need platform connections for analytics, so let's create mock ones
    const connectionIds: Record<string, string> = {};
    for (const platform of platforms) {
      const connectionId = await ctx.db.insert("platformConnections", {
        userId,
        platform,
        platformAccountId: `demo_${platform}_123`,
        platformUsername: `socialsync_${platform}`,
        platformDisplayName: "SocialSync Pro",
        accessToken: "mock_token_for_demo",
        isActive: true,
        followerCount: baseMetrics[platform as keyof typeof baseMetrics].followers,
        createdAt: now - 30 * oneDay,
        updatedAt: now,
      });
      connectionIds[platform] = connectionId;
    }

    // Generate 30 days of analytics
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now - day * oneDay);
      const dateStr = date.toISOString().split("T")[0];

      for (const platform of platforms) {
        const base = baseMetrics[platform as keyof typeof baseMetrics];
        // Add some variance
        const variance = 0.8 + Math.random() * 0.4; // 80-120%
        const growthFactor = 1 + (30 - day) * 0.005; // Slight growth over time

        await ctx.db.insert("analyticsSnapshots", {
          userId,
          connectionId: connectionIds[platform] as any,
          platform,
          date: dateStr,
          followers: Math.round(base.followers * growthFactor),
          following: Math.round(base.followers * 0.1),
          postsCount: 45 + (30 - day),
          impressions: Math.round(base.impressions * variance),
          reach: Math.round(base.impressions * 0.7 * variance),
          engagement: Math.round(base.engagement * variance),
          clicks: Math.round(base.engagement * 0.3 * variance),
          shares: Math.round(base.engagement * 0.15 * variance),
          saves: Math.round(base.engagement * 0.1 * variance),
          engagementRate: Number((base.engagement / base.followers * 100 * variance).toFixed(2)),
          clickThroughRate: Number((base.engagement * 0.3 / base.impressions * 100 * variance).toFixed(2)),
          createdAt: date.getTime(),
        });
      }
    }

    // Create post performance records for published posts
    for (let i = 0; i < 4; i++) {
      const postId = postIds[i];
      const post = posts[i];
      const publishedAt = post.publishedAt || now;

      for (const platform of post.platforms) {
        const baseEngagement = Math.floor(Math.random() * 500) + 100;
        await ctx.db.insert("postPerformance", {
          userId,
          postId: postId as any,
          platform,
          contentType: post.mediaType || "text",
          contentText: post.content,
          hashtags: post.hashtags,
          postedAt: publishedAt,
          impressions: baseEngagement * 50,
          reach: baseEngagement * 35,
          likes: baseEngagement,
          comments: Math.floor(baseEngagement * 0.1),
          shares: Math.floor(baseEngagement * 0.05),
          saves: Math.floor(baseEngagement * 0.03),
          clicks: Math.floor(baseEngagement * 0.15),
          engagementRate: Number((baseEngagement / 10000 * 100).toFixed(2)),
          viralityScore: post.viralScore || 50,
          wasAiGenerated: post.wasAiGenerated,
          aiPromptUsed: post.aiPromptUsed,
          userApproved: true,
          userEdited: false,
          createdAt: publishedAt,
          updatedAt: now,
        });
      }
    }

    // Create user settings
    await ctx.db.insert("userSettings", {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      notifyOnPublish: true,
      notifyOnEngagement: true,
      weeklyDigest: true,
      defaultPlatforms: ["instagram", "twitter", "linkedin"],
      defaultTone: "professional",
      autoGenerateHashtags: true,
      theme: "light",
      updatedAt: now,
    });

    return {
      success: true,
      userId,
      postsCreated: posts.length,
      analyticsSnapshots: 31 * platforms.length,
      message: "Test data seeded successfully!",
    };
  },
});

// Clear all test data
export const clearTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all tables and delete all documents
    const tables = [
      "users",
      "posts",
      "platformConnections",
      "analyticsSnapshots",
      "postPerformance",
      "userSettings",
      "scheduledPosts",
      "organizations",
      "teamMembers",
      "userMlProfiles",
      "abTests",
      "learningLogs",
      "aiContentQueue",
    ];

    let totalDeleted = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table as any).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
        totalDeleted++;
      }
    }

    return {
      success: true,
      documentsDeleted: totalDeleted,
      message: "All test data cleared!",
    };
  },
});
