-- Analytics Schema for Autonomous AI Social Media Copilot
-- Run this migration in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ANALYTICS SNAPSHOTS
-- Store platform metrics over time (manual import + API later)
-- ============================================
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok')),
  date DATE NOT NULL,

  -- Core metrics
  followers INT DEFAULT 0,
  following INT DEFAULT 0,
  posts_count INT DEFAULT 0,

  -- Engagement metrics
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  engagement INT DEFAULT 0,
  clicks INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,

  -- Calculated rates (stored for quick access)
  engagement_rate FLOAT DEFAULT 0,
  click_through_rate FLOAT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries for same user/platform/date
  UNIQUE(user_id, platform, date)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_analytics_user_platform ON analytics_snapshots(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics_snapshots(date DESC);

-- ============================================
-- POST PERFORMANCE TRACKING
-- Track individual post metrics for ML learning
-- ============================================
CREATE TABLE IF NOT EXISTS post_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Post identification
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok')),
  platform_post_id TEXT, -- ID from the platform (for future API sync)
  post_url TEXT,

  -- Content details
  content_type TEXT CHECK (content_type IN ('image', 'video', 'text', 'carousel', 'story', 'reel')),
  content_text TEXT,
  content_media_url TEXT,
  hashtags TEXT[], -- Array of hashtags used
  mentions TEXT[], -- Array of mentions used

  -- Timing
  posted_at TIMESTAMPTZ,
  best_engagement_hour INT, -- Hour of day when post performed best

  -- Performance metrics
  impressions INT DEFAULT 0,
  reach INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  saves INT DEFAULT 0,
  clicks INT DEFAULT 0,
  video_views INT DEFAULT 0,
  video_watch_time INT DEFAULT 0, -- in seconds

  -- Calculated scores
  engagement_rate FLOAT DEFAULT 0,
  virality_score FLOAT DEFAULT 0, -- shares/reach ratio

  -- AI-generated content tracking
  was_ai_generated BOOLEAN DEFAULT FALSE,
  ai_prompt_used TEXT,
  ai_predicted_engagement FLOAT,

  -- Learning flags
  user_approved BOOLEAN DEFAULT TRUE, -- Did user approve this content?
  user_edited BOOLEAN DEFAULT FALSE, -- Did user edit AI suggestion?

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_platform ON post_performance(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON post_performance(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON post_performance(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_ai_generated ON post_performance(was_ai_generated);

-- ============================================
-- USER ML PROFILE
-- Learned preferences and patterns for each user
-- ============================================
CREATE TABLE IF NOT EXISTS user_ml_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tone preferences (learned from user edits and approvals)
  -- Format: {"professional": 0.7, "casual": 0.2, "humorous": 0.1, "inspirational": 0.0}
  preferred_tone JSONB DEFAULT '{"professional": 0.5, "casual": 0.3, "humorous": 0.1, "inspirational": 0.1}'::jsonb,

  -- Best posting times per platform
  -- Format: {"instagram": {"monday": ["09:00", "18:00"], "tuesday": [...], ...}, ...}
  best_posting_times JSONB DEFAULT '{}'::jsonb,

  -- Top performing hashtags per platform
  -- Format: {"instagram": ["#marketing", "#startup"], "twitter": [...], ...}
  top_hashtags JSONB DEFAULT '{}'::jsonb,

  -- Content type performance scores per platform
  -- Format: {"instagram": {"image": 0.8, "video": 0.95, "carousel": 0.7}, ...}
  content_type_performance JSONB DEFAULT '{}'::jsonb,

  -- Audience insights
  -- Format: {"primary_age": "25-34", "top_locations": ["US", "UK"], "interests": [...]}
  audience_insights JSONB DEFAULT '{}'::jsonb,

  -- Writing style patterns
  -- Format: {"avg_length": 150, "emoji_usage": 0.3, "question_rate": 0.2, "cta_style": "soft"}
  writing_style JSONB DEFAULT '{}'::jsonb,

  -- Performance baselines (for comparison)
  -- Format: {"avg_engagement_rate": 0.042, "avg_reach": 1500, ...}
  performance_baselines JSONB DEFAULT '{}'::jsonb,

  -- Learning metadata
  total_posts_analyzed INT DEFAULT 0,
  last_learning_run TIMESTAMPTZ,
  model_version TEXT DEFAULT 'v1.0',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI CONTENT QUEUE
-- Queue of AI-generated content awaiting review
-- ============================================
CREATE TABLE IF NOT EXISTS ai_content_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'tiktok')),
  content_type TEXT CHECK (content_type IN ('image', 'video', 'text', 'carousel')),
  content_text TEXT NOT NULL,
  content_media_url TEXT,
  suggested_hashtags TEXT[],

  -- AI metadata
  generation_prompt TEXT,
  predicted_engagement FLOAT,
  confidence_score FLOAT,
  suggested_post_time TIMESTAMPTZ,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'edited', 'posted', 'scheduled')),
  user_feedback TEXT, -- Why rejected or what was edited

  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queue_user_status ON ai_content_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON ai_content_queue(scheduled_for) WHERE status = 'scheduled';

-- ============================================
-- A/B TEST EXPERIMENTS
-- Track content variations for learning
-- ============================================
CREATE TABLE IF NOT EXISTS ab_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Experiment setup
  experiment_type TEXT CHECK (experiment_type IN ('content', 'timing', 'hashtags', 'format')),
  hypothesis TEXT,

  -- Variants
  variant_a_id UUID REFERENCES post_performance(id),
  variant_b_id UUID REFERENCES post_performance(id),

  -- Results
  winner TEXT CHECK (winner IN ('a', 'b', 'tie', 'pending')),
  confidence_level FLOAT,
  insights_learned TEXT,

  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- LEARNING LOG
-- Track what the AI has learned over time
-- ============================================
CREATE TABLE IF NOT EXISTS learning_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Learning event
  event_type TEXT CHECK (event_type IN ('preference_update', 'pattern_detected', 'performance_insight', 'recommendation_generated')),
  event_description TEXT NOT NULL,

  -- Data
  old_value JSONB,
  new_value JSONB,
  confidence FLOAT,

  -- Source
  source_posts UUID[], -- Posts that contributed to this learning

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user timeline
CREATE INDEX IF NOT EXISTS idx_learning_user_time ON learning_log(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Ensure users can only access their own data
-- ============================================

-- Enable RLS on all tables
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ml_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_log ENABLE ROW LEVEL SECURITY;

-- Policies for analytics_snapshots
CREATE POLICY "Users can view own analytics" ON analytics_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics" ON analytics_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analytics" ON analytics_snapshots
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analytics" ON analytics_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for post_performance
CREATE POLICY "Users can view own posts" ON post_performance
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON post_performance
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON post_performance
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON post_performance
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for user_ml_profile
CREATE POLICY "Users can view own ML profile" ON user_ml_profile
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own ML profile" ON user_ml_profile
  FOR ALL USING (auth.uid() = user_id);

-- Policies for ai_content_queue
CREATE POLICY "Users can view own content queue" ON ai_content_queue
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own content queue" ON ai_content_queue
  FOR ALL USING (auth.uid() = user_id);

-- Policies for ab_experiments
CREATE POLICY "Users can view own experiments" ON ab_experiments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own experiments" ON ab_experiments
  FOR ALL USING (auth.uid() = user_id);

-- Policies for learning_log
CREATE POLICY "Users can view own learning log" ON learning_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own learning log" ON learning_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate(
  p_likes INT,
  p_comments INT,
  p_shares INT,
  p_reach INT
) RETURNS FLOAT AS $$
BEGIN
  IF p_reach = 0 OR p_reach IS NULL THEN
    RETURN 0;
  END IF;
  RETURN ROUND(((COALESCE(p_likes, 0) + COALESCE(p_comments, 0) + COALESCE(p_shares, 0))::FLOAT / p_reach * 100)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's best posting times
CREATE OR REPLACE FUNCTION get_best_posting_times(p_user_id UUID, p_platform TEXT)
RETURNS TABLE (day_of_week TEXT, hour_of_day INT, avg_engagement FLOAT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(pp.posted_at, 'Day') as day_of_week,
    EXTRACT(HOUR FROM pp.posted_at)::INT as hour_of_day,
    AVG(pp.engagement_rate) as avg_engagement
  FROM post_performance pp
  WHERE pp.user_id = p_user_id
    AND pp.platform = p_platform
    AND pp.posted_at IS NOT NULL
  GROUP BY TO_CHAR(pp.posted_at, 'Day'), EXTRACT(HOUR FROM pp.posted_at)
  ORDER BY avg_engagement DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_analytics_snapshots_updated_at
  BEFORE UPDATE ON analytics_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_post_performance_updated_at
  BEFORE UPDATE ON post_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_ml_profile_updated_at
  BEFORE UPDATE ON user_ml_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_ai_content_queue_updated_at
  BEFORE UPDATE ON ai_content_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
