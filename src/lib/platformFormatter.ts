/**
 * Platform-specific content formatting utilities
 * Optimizes content for each social media platform
 */

export type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';

export interface FormattedPost {
  platform: Platform;
  content: string;
  hashtags: string[];
  mentions: string[];
  characterCount: number;
  isWithinLimit: boolean;
  maxCharacters: number;
  warnings: string[];
  suggestions: string[];
}

interface PlatformConfig {
  maxLength: number;
  maxHashtags: number;
  hashtagPosition: 'inline' | 'end' | 'first-comment';
  supportsEmoji: boolean;
  supportsLinks: boolean;
  linkShortening: boolean;
  mentionFormat: string;
  lineBreakStyle: 'single' | 'double';
  optimalLength: { min: number; max: number };
}

const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  instagram: {
    maxLength: 2200,
    maxHashtags: 30,
    hashtagPosition: 'end',
    supportsEmoji: true,
    supportsLinks: false, // Links in bio only
    linkShortening: false,
    mentionFormat: '@{username}',
    lineBreakStyle: 'double',
    optimalLength: { min: 138, max: 150 },
  },
  facebook: {
    maxLength: 63206,
    maxHashtags: 5,
    hashtagPosition: 'end',
    supportsEmoji: true,
    supportsLinks: true,
    linkShortening: false,
    mentionFormat: '@{username}',
    lineBreakStyle: 'double',
    optimalLength: { min: 40, max: 80 },
  },
  twitter: {
    maxLength: 280,
    maxHashtags: 3,
    hashtagPosition: 'inline',
    supportsEmoji: true,
    supportsLinks: true,
    linkShortening: true, // t.co
    mentionFormat: '@{username}',
    lineBreakStyle: 'single',
    optimalLength: { min: 71, max: 100 },
  },
  linkedin: {
    maxLength: 3000,
    maxHashtags: 5,
    hashtagPosition: 'end',
    supportsEmoji: true,
    supportsLinks: true,
    linkShortening: false,
    mentionFormat: '@{username}',
    lineBreakStyle: 'double',
    optimalLength: { min: 50, max: 150 },
  },
  youtube: {
    maxLength: 5000,
    maxHashtags: 15,
    hashtagPosition: 'end',
    supportsEmoji: true,
    supportsLinks: true,
    linkShortening: false,
    mentionFormat: '@{username}',
    lineBreakStyle: 'double',
    optimalLength: { min: 200, max: 500 },
  },
  tiktok: {
    maxLength: 2200,
    maxHashtags: 5,
    hashtagPosition: 'inline',
    supportsEmoji: true,
    supportsLinks: false, // Link in bio
    linkShortening: false,
    mentionFormat: '@{username}',
    lineBreakStyle: 'single',
    optimalLength: { min: 50, max: 150 },
  },
};

/**
 * Format content for a specific platform
 */
export function formatForPlatform(
  content: string,
  platform: Platform,
  hashtags: string[] = [],
  mentions: string[] = []
): FormattedPost {
  const config = PLATFORM_CONFIGS[platform];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Clean and normalize content
  let formattedContent = normalizeContent(content, config);

  // Format mentions
  const formattedMentions = mentions.map(m => m.startsWith('@') ? m : `@${m}`);

  // Format hashtags
  let formattedHashtags = hashtags
    .map(h => h.startsWith('#') ? h : `#${h}`)
    .slice(0, config.maxHashtags);

  if (hashtags.length > config.maxHashtags) {
    warnings.push(`Limited to ${config.maxHashtags} hashtags (had ${hashtags.length})`);
  }

  // Handle hashtag positioning
  if (config.hashtagPosition === 'end' && formattedHashtags.length > 0) {
    const hashtagString = formattedHashtags.join(' ');
    const separator = config.lineBreakStyle === 'double' ? '\n\n' : '\n';
    formattedContent = `${formattedContent}${separator}${hashtagString}`;
  } else if (config.hashtagPosition === 'first-comment') {
    // Hashtags go in first comment, return them separately
    suggestions.push('Add hashtags as the first comment for better reach');
  }

  // Handle links
  if (!config.supportsLinks && containsLink(formattedContent)) {
    warnings.push(`${platform} doesn't support clickable links. Consider using "link in bio"`);
    suggestions.push('Add your link to your bio instead');
  }

  // Check length
  const characterCount = formattedContent.length;
  const isWithinLimit = characterCount <= config.maxLength;

  if (!isWithinLimit) {
    warnings.push(`Content exceeds ${platform} limit (${characterCount}/${config.maxLength})`);
    formattedContent = truncateContent(formattedContent, config.maxLength);
  }

  // Optimal length suggestions
  if (characterCount < config.optimalLength.min) {
    suggestions.push(`Consider adding more content. Optimal length is ${config.optimalLength.min}-${config.optimalLength.max} characters.`);
  } else if (characterCount > config.optimalLength.max && characterCount < config.maxLength) {
    suggestions.push(`Content is longer than optimal. Consider shortening to ${config.optimalLength.max} characters for best engagement.`);
  }

  // Platform-specific suggestions
  addPlatformSuggestions(platform, formattedContent, suggestions);

  return {
    platform,
    content: formattedContent,
    hashtags: formattedHashtags,
    mentions: formattedMentions,
    characterCount: formattedContent.length,
    isWithinLimit,
    maxCharacters: config.maxLength,
    warnings,
    suggestions,
  };
}

/**
 * Normalize content for platform
 */
function normalizeContent(content: string, config: PlatformConfig): string {
  let normalized = content.trim();

  // Normalize line breaks
  if (config.lineBreakStyle === 'double') {
    // Convert single line breaks to double for readability
    normalized = normalized.replace(/\n(?!\n)/g, '\n\n');
  }

  // Remove excessive whitespace
  normalized = normalized.replace(/[ \t]+/g, ' ');
  normalized = normalized.replace(/\n{3,}/g, '\n\n');

  return normalized;
}

/**
 * Check if content contains a URL
 */
function containsLink(content: string): boolean {
  const urlPattern = /https?:\/\/[^\s]+/i;
  return urlPattern.test(content);
}

/**
 * Truncate content to fit platform limit
 */
function truncateContent(content: string, maxLength: number): string {
  if (content.length <= maxLength) return content;

  // Try to cut at a sentence boundary
  const truncated = content.slice(0, maxLength - 3);
  const lastSentence = truncated.lastIndexOf('. ');
  const lastNewline = truncated.lastIndexOf('\n');

  const cutPoint = Math.max(lastSentence, lastNewline);

  if (cutPoint > maxLength * 0.7) {
    return content.slice(0, cutPoint + 1);
  }

  // Fall back to word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Add platform-specific suggestions
 */
function addPlatformSuggestions(
  platform: Platform,
  content: string,
  suggestions: string[]
): void {
  const hasQuestion = content.includes('?');
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(content);
  const hasCTA = /click|link|comment|share|follow|subscribe|join|learn|discover|try|check out/i.test(content);

  switch (platform) {
    case 'instagram':
      if (!hasEmoji) {
        suggestions.push('Adding emojis can increase engagement by 15%');
      }
      if (!hasCTA) {
        suggestions.push('Include a call-to-action like "Double tap if you agree" or "Save for later"');
      }
      break;

    case 'twitter':
      if (content.length > 200 && !content.includes('🧵')) {
        suggestions.push('Consider making this a thread for better engagement');
      }
      if (!hasQuestion) {
        suggestions.push('Questions often drive more replies and engagement');
      }
      break;

    case 'linkedin':
      if (!content.includes('\n')) {
        suggestions.push('Use line breaks to make content more scannable');
      }
      if (content.toLowerCase().startsWith('i ')) {
        suggestions.push('Starting with a hook instead of "I" can increase engagement');
      }
      break;

    case 'youtube':
      if (!content.includes('subscribe') && !content.includes('Subscribe')) {
        suggestions.push('Include a subscribe CTA in your description');
      }
      break;

    case 'tiktok':
      if (!hasEmoji) {
        suggestions.push('Emojis perform well on TikTok');
      }
      if (content.length > 100) {
        suggestions.push('Shorter captions often perform better on TikTok');
      }
      break;

    case 'facebook':
      if (!hasQuestion && !hasCTA) {
        suggestions.push('Ask a question to encourage comments');
      }
      break;
  }
}

/**
 * Get platform-specific URLs for posting
 */
export function getPlatformPostUrl(platform: Platform): string {
  const urls: Record<Platform, string> = {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    twitter: 'https://twitter.com/compose/tweet',
    linkedin: 'https://www.linkedin.com/feed/',
    youtube: 'https://studio.youtube.com/',
    tiktok: 'https://www.tiktok.com/upload',
  };
  return urls[platform];
}

/**
 * Get recommended image/video aspect ratios for platform
 */
export function getMediaRecommendations(platform: Platform): {
  imageRatios: string[];
  videoRatios: string[];
  maxVideoLength: number;
} {
  const recommendations: Record<Platform, ReturnType<typeof getMediaRecommendations>> = {
    instagram: {
      imageRatios: ['1:1', '4:5', '1.91:1'],
      videoRatios: ['1:1', '4:5', '9:16'],
      maxVideoLength: 60, // Reels up to 90s
    },
    facebook: {
      imageRatios: ['1:1', '4:5', '16:9'],
      videoRatios: ['16:9', '1:1', '9:16'],
      maxVideoLength: 240, // 4 mins for optimal
    },
    twitter: {
      imageRatios: ['16:9', '1:1'],
      videoRatios: ['16:9', '1:1'],
      maxVideoLength: 140,
    },
    linkedin: {
      imageRatios: ['1.91:1', '1:1'],
      videoRatios: ['16:9', '1:1'],
      maxVideoLength: 600, // 10 mins
    },
    youtube: {
      imageRatios: ['16:9'],
      videoRatios: ['16:9'],
      maxVideoLength: 43200, // 12 hours
    },
    tiktok: {
      imageRatios: ['9:16'],
      videoRatios: ['9:16'],
      maxVideoLength: 180, // 3 mins
    },
  };
  return recommendations[platform];
}

/**
 * Format content for multiple platforms at once
 */
export function formatForAllPlatforms(
  content: string,
  platforms: Platform[],
  hashtags: string[] = [],
  mentions: string[] = []
): Record<Platform, FormattedPost> {
  const result: Partial<Record<Platform, FormattedPost>> = {};

  for (const platform of platforms) {
    result[platform] = formatForPlatform(content, platform, hashtags, mentions);
  }

  return result as Record<Platform, FormattedPost>;
}

/**
 * Calculate optimal posting time based on platform defaults
 */
export function getDefaultBestTime(platform: Platform): { day: string; time: string } {
  const defaults: Record<Platform, { day: string; time: string }> = {
    instagram: { day: 'Wednesday', time: '11:00 AM' },
    facebook: { day: 'Thursday', time: '1:00 PM' },
    twitter: { day: 'Tuesday', time: '9:00 AM' },
    linkedin: { day: 'Tuesday', time: '10:00 AM' },
    youtube: { day: 'Friday', time: '5:00 PM' },
    tiktok: { day: 'Tuesday', time: '7:00 PM' },
  };
  return defaults[platform];
}
