import { useState, useCallback, useRef } from 'react';
import type {
  PostVariant,
  ABTestConfig,
  ABTestResult,
  ABTestAnalysis,
  VariantType,
} from '../types/abtest';

interface UseABTestOptions {
  platform: string;
  autoGenerateVariants?: boolean;
}

interface UseABTestReturn {
  // State
  variants: PostVariant[];
  testConfig: ABTestConfig | null;
  analysis: ABTestAnalysis | null;
  results: ABTestResult | null;
  isAnalyzing: boolean;
  isGenerating: boolean;
  error: string | null;

  // Actions
  analyzeContent: (content: string) => Promise<void>;
  generateVariants: (content: string, types?: VariantType[]) => Promise<void>;
  addVariant: (variant: Omit<PostVariant, 'id' | 'createdAt'>) => void;
  updateVariant: (id: string, updates: Partial<PostVariant>) => void;
  removeVariant: (id: string) => void;
  duplicateVariant: (id: string) => void;
  setAllocation: (variantId: string, percentage: number) => void;
  createTest: (name: string, config?: Partial<ABTestConfig>) => ABTestConfig;
  simulateResults: () => ABTestResult;
  reset: () => void;
}

function generateId(): string {
  return `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useABTest(options: UseABTestOptions): UseABTestReturn {
  const { platform } = options;

  const [variants, setVariants] = useState<PostVariant[]>([]);
  const [testConfig, setTestConfig] = useState<ABTestConfig | null>(null);
  const [analysis, setAnalysis] = useState<ABTestAnalysis | null>(null);
  const [results, setResults] = useState<ABTestResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const analyzeContent = useCallback(async (content: string) => {
    if (!content || content.trim().length < 20) {
      setError('Content must be at least 20 characters');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', content, platform }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, [platform]);

  const generateVariants = useCallback(async (
    content: string,
    types: VariantType[] = ['hook', 'cta', 'tone']
  ) => {
    if (!content || content.trim().length < 20) {
      setError('Content must be at least 20 characters');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ab-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', content, platform, types }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to generate variants');
      }

      const data = await response.json();

      // Add generated variants
      const newVariants: PostVariant[] = data.variants.map((v: {
        name: string;
        content: string;
        type: VariantType;
        description?: string;
        viralScore?: number;
      }) => ({
        id: generateId(),
        name: v.name,
        content: v.content,
        type: v.type,
        description: v.description,
        viralScore: v.viralScore,
        createdAt: new Date().toISOString(),
      }));

      setVariants(prev => [...prev, ...newVariants]);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [platform]);

  const addVariant = useCallback((variant: Omit<PostVariant, 'id' | 'createdAt'>) => {
    const newVariant: PostVariant = {
      ...variant,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setVariants(prev => [...prev, newVariant]);
  }, []);

  const updateVariant = useCallback((id: string, updates: Partial<PostVariant>) => {
    setVariants(prev => prev.map(v =>
      v.id === id ? { ...v, ...updates } : v
    ));
  }, []);

  const removeVariant = useCallback((id: string) => {
    setVariants(prev => prev.filter(v => v.id !== id));
  }, []);

  const duplicateVariant = useCallback((id: string) => {
    setVariants(prev => {
      const original = prev.find(v => v.id === id);
      if (!original) return prev;

      const duplicate: PostVariant = {
        ...original,
        id: generateId(),
        name: `${original.name} (copy)`,
        createdAt: new Date().toISOString(),
      };
      return [...prev, duplicate];
    });
  }, []);

  const setAllocation = useCallback((variantId: string, percentage: number) => {
    setTestConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        allocation: {
          ...prev.allocation,
          [variantId]: Math.min(100, Math.max(0, percentage)),
        },
      };
    });
  }, []);

  const createTest = useCallback((name: string, config?: Partial<ABTestConfig>): ABTestConfig => {
    // Calculate even allocation if not specified
    const defaultAllocation: Record<string, number> = {};
    const evenPercentage = Math.floor(100 / variants.length);
    variants.forEach((v, i) => {
      defaultAllocation[v.id] = i === variants.length - 1
        ? 100 - (evenPercentage * (variants.length - 1))
        : evenPercentage;
    });

    const newConfig: ABTestConfig = {
      id: `test_${Date.now()}`,
      name,
      platform,
      variants: [...variants],
      allocation: config?.allocation || defaultAllocation,
      status: 'draft',
      minSampleSize: config?.minSampleSize || 1000,
      confidenceLevel: config?.confidenceLevel || 0.95,
      duration: config?.duration || 7,
      createdAt: new Date().toISOString(),
      ...config,
    };

    setTestConfig(newConfig);
    return newConfig;
  }, [variants, platform]);

  const simulateResults = useCallback((): ABTestResult => {
    // Generate simulated results for demo purposes
    const variantResults = variants.map((variant, index) => {
      const baseEngagement = 0.03 + Math.random() * 0.04; // 3-7% engagement
      const impressions = 5000 + Math.floor(Math.random() * 10000);
      const reach = Math.floor(impressions * (0.7 + Math.random() * 0.2));
      const likes = Math.floor(impressions * baseEngagement * (0.6 + Math.random() * 0.3));
      const comments = Math.floor(likes * (0.1 + Math.random() * 0.1));
      const shares = Math.floor(likes * (0.05 + Math.random() * 0.08));
      const saves = Math.floor(likes * (0.15 + Math.random() * 0.1));
      const clicks = Math.floor(impressions * (0.02 + Math.random() * 0.03));

      const engagementRate = ((likes + comments + shares + saves) / impressions) * 100;
      const clickThroughRate = (clicks / impressions) * 100;

      return {
        variant,
        metrics: {
          variantId: variant.id,
          impressions,
          reach,
          likes,
          comments,
          shares,
          saves,
          clicks,
          engagementRate,
          clickThroughRate,
        },
        isWinner: false,
        isStatisticallySignificant: Math.random() > 0.3,
        improvementOverControl: index === 0 ? 0 : -10 + Math.random() * 40,
        confidenceInterval: [engagementRate * 0.85, engagementRate * 1.15] as [number, number],
      };
    });

    // Determine winner
    const sortedByEngagement = [...variantResults].sort(
      (a, b) => b.metrics.engagementRate - a.metrics.engagementRate
    );
    if (sortedByEngagement[0]) {
      sortedByEngagement[0].isWinner = true;
    }

    const winner = sortedByEngagement[0]?.variant;
    const winnerImprovement = sortedByEngagement[0]?.improvementOverControl || 0;

    const result: ABTestResult = {
      testId: testConfig?.id || `test_${Date.now()}`,
      variants: variantResults,
      winner,
      recommendation: winner
        ? `${winner.name} is the winning variant with ${winnerImprovement.toFixed(1)}% higher engagement than the control.`
        : 'No clear winner yet. Continue testing for more data.',
      insights: [
        `Total sample size: ${variantResults.reduce((sum, v) => sum + v.metrics.impressions, 0).toLocaleString()} impressions`,
        winner ? `${winner.name} achieved the highest engagement rate at ${sortedByEngagement[0]?.metrics.engagementRate.toFixed(2)}%` : '',
        sortedByEngagement[0]?.isStatisticallySignificant
          ? 'Results are statistically significant at 95% confidence level'
          : 'More data needed for statistical significance',
      ].filter(Boolean),
      sampleSize: variantResults.reduce((sum, v) => sum + v.metrics.impressions, 0),
      statisticalSignificance: sortedByEngagement[0]?.isStatisticallySignificant ? 0.95 : 0.7,
      completedAt: new Date().toISOString(),
    };

    setResults(result);
    return result;
  }, [variants, testConfig]);

  const reset = useCallback(() => {
    setVariants([]);
    setTestConfig(null);
    setAnalysis(null);
    setResults(null);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    variants,
    testConfig,
    analysis,
    results,
    isAnalyzing,
    isGenerating,
    error,
    analyzeContent,
    generateVariants,
    addVariant,
    updateVariant,
    removeVariant,
    duplicateVariant,
    setAllocation,
    createTest,
    simulateResults,
    reset,
  };
}
