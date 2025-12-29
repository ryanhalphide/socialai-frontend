// A/B Testing Types for Post Variations

export type VariantType = 'content' | 'hook' | 'cta' | 'hashtags' | 'tone' | 'length' | 'emoji';

export interface PostVariant {
  id: string;
  name: string;
  content: string;
  type: VariantType;
  description?: string;
  viralScore?: number;
  confidence?: number;
  createdAt: string;
}

export interface VariantMetrics {
  variantId: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  engagementRate: number;
  clickThroughRate: number;
  conversionRate?: number;
}

export interface ABTestConfig {
  id: string;
  name: string;
  postId?: string;
  platform: string;
  variants: PostVariant[];
  allocation: Record<string, number>; // variantId -> percentage
  status: 'draft' | 'active' | 'paused' | 'completed';
  minSampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
  duration: number; // days
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ABTestResult {
  testId: string;
  variants: Array<{
    variant: PostVariant;
    metrics: VariantMetrics;
    isWinner: boolean;
    isStatisticallySignificant: boolean;
    improvementOverControl: number; // percentage
    confidenceInterval: [number, number];
  }>;
  winner?: PostVariant;
  recommendation: string;
  insights: string[];
  sampleSize: number;
  statisticalSignificance: number;
  completedAt?: string;
}

export interface VariantSuggestion {
  type: VariantType;
  original: string;
  suggested: string;
  reasoning: string;
  expectedImpact: 'high' | 'medium' | 'low';
  confidence: number;
}

export interface ABTestAnalysis {
  originalContent: string;
  platform: string;
  suggestions: VariantSuggestion[];
  recommendedTests: Array<{
    name: string;
    description: string;
    variants: Array<{
      name: string;
      content: string;
      hypothesis: string;
    }>;
  }>;
}
