import { useState, useEffect, useCallback, useRef } from 'react';

interface ViralScoreBreakdown {
  hookStrength: number;
  emotionalResonance: number;
  clarity: number;
  callToAction: number;
  hashtagRelevance: number;
  lengthOptimization: number;
  trendAlignment: number;
  platformFit: number;
}

interface ViralScoreSuggestion {
  category: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

interface PredictedEngagement {
  likes: string;
  comments: string;
  shares: string;
  reach: string;
}

export interface ViralScoreData {
  score: number;
  confidence: number;
  breakdown: ViralScoreBreakdown;
  suggestions: ViralScoreSuggestion[];
  predictedEngagement: PredictedEngagement;
  platform?: string;
  contentType?: string;
  analyzedAt?: string;
}

interface UseViralScoreOptions {
  debounceMs?: number;
  minContentLength?: number;
  autoAnalyze?: boolean;
}

interface UseViralScoreReturn {
  data: ViralScoreData | null;
  isLoading: boolean;
  error: string | null;
  analyze: () => Promise<void>;
  reset: () => void;
  lastAnalyzedContent: string | null;
}

export function useViralScore(
  content: string,
  platform: string,
  options: UseViralScoreOptions = {}
): UseViralScoreReturn {
  const {
    debounceMs = 1500, // Wait 1.5 seconds after user stops typing
    minContentLength = 20, // Minimum characters before analyzing
    autoAnalyze = true, // Automatically analyze on content change
  } = options;

  const [data, setData] = useState<ViralScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedContent, setLastAnalyzedContent] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analyze = useCallback(async () => {
    // Don't analyze if content is too short
    if (!content || content.trim().length < minContentLength) {
      setData(null);
      setError(null);
      return;
    }

    // Don't re-analyze the same content
    if (content === lastAnalyzedContent) {
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Extract hashtags from content
      const hashtagsInContent = content.match(/#\w+/g) || [];

      const response = await fetch('/api/viral-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          platform,
          contentType: 'text',
          hashtags: hashtagsInContent,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setLastAnalyzedContent(content);
      setError(null);
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      console.error('Viral score analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [content, platform, minContentLength, lastAnalyzedContent]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLastAnalyzedContent(null);
    setIsLoading(false);

    // Cancel any pending operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Auto-analyze with debounce
  useEffect(() => {
    if (!autoAnalyze) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't start timer if content is too short
    if (!content || content.trim().length < minContentLength) {
      setData(null);
      return;
    }

    // Don't re-analyze the same content
    if (content === lastAnalyzedContent) {
      return;
    }

    // Set loading state immediately for better UX
    // This gives user feedback that analysis is pending
    setIsLoading(true);

    // Start debounce timer
    debounceTimerRef.current = setTimeout(() => {
      analyze();
    }, debounceMs);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [content, platform, autoAnalyze, debounceMs, minContentLength, analyze, lastAnalyzedContent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    analyze,
    reset,
    lastAnalyzedContent,
  };
}

// Export types for external use
export type { ViralScoreBreakdown, ViralScoreSuggestion, PredictedEngagement };
