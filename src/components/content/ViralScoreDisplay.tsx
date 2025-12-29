import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../lib/utils';

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

interface ViralScoreData {
  score: number;
  confidence: number;
  breakdown: ViralScoreBreakdown;
  suggestions: ViralScoreSuggestion[];
  predictedEngagement: PredictedEngagement;
}

interface ViralScoreDisplayProps {
  data: ViralScoreData | null;
  isLoading?: boolean;
  error?: string | null;
  compact?: boolean;
  onApplySuggestion?: (suggestion: string) => void;
}

const breakdownLabels: Record<keyof ViralScoreBreakdown, { label: string; icon: React.ReactNode }> = {
  hookStrength: { label: 'Hook Strength', icon: <Zap className="h-3.5 w-3.5" /> },
  emotionalResonance: { label: 'Emotional Appeal', icon: <Heart className="h-3.5 w-3.5" /> },
  clarity: { label: 'Clarity', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  callToAction: { label: 'Call to Action', icon: <MessageCircle className="h-3.5 w-3.5" /> },
  hashtagRelevance: { label: 'Hashtag Quality', icon: <TrendingUp className="h-3.5 w-3.5" /> },
  lengthOptimization: { label: 'Length', icon: <Minus className="h-3.5 w-3.5" /> },
  trendAlignment: { label: 'Trend Alignment', icon: <Sparkles className="h-3.5 w-3.5" /> },
  platformFit: { label: 'Platform Fit', icon: <Share2 className="h-3.5 w-3.5" /> },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Viral Potential!';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 40) return 'Needs Work';
  return 'Low Potential';
}

function getImpactColor(impact: 'high' | 'medium' | 'low'): string {
  switch (impact) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
}

function CircularProgress({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn('transition-all duration-1000 ease-out', getScoreColor(score))}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
      </div>
    </div>
  );
}

function MiniProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', color || getScoreBgColor(value))}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function ViralScoreDisplay({
  data,
  isLoading = false,
  error = null,
  compact = false,
  onApplySuggestion,
}: ViralScoreDisplayProps) {
  const [showDetails, setShowDetails] = useState(!compact);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn(
        'rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4',
        compact ? 'p-3' : 'p-4'
      )}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200 animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 text-primary-500 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Failed to analyze content</span>
        </div>
        <p className="mt-1 text-xs text-red-500">{error}</p>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="h-12 w-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Viral Score</p>
            <p className="text-xs text-gray-400">Start typing to analyze your content</p>
          </div>
        </div>
      </div>
    );
  }

  const displayedSuggestions = showAllSuggestions
    ? data.suggestions
    : data.suggestions.slice(0, 2);

  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br from-white to-gray-50 overflow-hidden',
      data.score >= 80 ? 'border-green-200' : data.score >= 60 ? 'border-yellow-200' : 'border-gray-200'
    )}>
      {/* Header with Score */}
      <div className={cn('p-4', compact ? 'pb-3' : 'pb-4')}>
        <div className="flex items-center gap-4">
          {/* Circular Score */}
          <CircularProgress score={data.score} size={compact ? 64 : 80} />

          {/* Score Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-900">Viral Score</h4>
              {data.score >= 80 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                  <Sparkles className="h-3 w-3" />
                  Hot
                </span>
              )}
            </div>
            <p className={cn('text-sm font-medium mt-0.5', getScoreColor(data.score))}>
              {getScoreLabel(data.score)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.confidence}% confidence
            </p>
          </div>

          {/* Toggle Details */}
          {compact && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              {showDetails ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Predicted Engagement - Always Visible */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
            <Heart className="h-3.5 w-3.5 mx-auto text-pink-500" />
            <p className="text-xs font-semibold text-gray-700 mt-1">{data.predictedEngagement.likes}</p>
            <p className="text-xs text-gray-400">Likes</p>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
            <MessageCircle className="h-3.5 w-3.5 mx-auto text-blue-500" />
            <p className="text-xs font-semibold text-gray-700 mt-1">{data.predictedEngagement.comments}</p>
            <p className="text-xs text-gray-400">Comments</p>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
            <Share2 className="h-3.5 w-3.5 mx-auto text-green-500" />
            <p className="text-xs font-semibold text-gray-700 mt-1">{data.predictedEngagement.shares}</p>
            <p className="text-xs text-gray-400">Shares</p>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-gray-100">
            <Eye className="h-3.5 w-3.5 mx-auto text-purple-500" />
            <p className="text-xs font-semibold text-gray-700 mt-1">{data.predictedEngagement.reach}</p>
            <p className="text-xs text-gray-400">Reach</p>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {showDetails && (
        <>
          {/* Breakdown Scores */}
          <div className="px-4 pb-4 border-t border-gray-100 pt-4">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Score Breakdown
            </h5>
            <div className="space-y-2.5">
              {(Object.entries(data.breakdown) as [keyof ViralScoreBreakdown, number][]).map(
                ([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={cn('text-gray-400', getScoreColor(value))}>
                      {breakdownLabels[key].icon}
                    </span>
                    <span className="text-xs text-gray-600 w-24 truncate">
                      {breakdownLabels[key].label}
                    </span>
                    <div className="flex-1">
                      <MiniProgressBar value={value} />
                    </div>
                    <span className={cn('text-xs font-medium w-8 text-right', getScoreColor(value))}>
                      {value}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Suggestions */}
          {data.suggestions.length > 0 && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
                  Suggestions to Improve
                </h5>
                {data.suggestions.length > 2 && (
                  <button
                    onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    {showAllSuggestions ? 'Show less' : `+${data.suggestions.length - 2} more`}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {displayedSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {suggestion.category}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-1.5 py-0.5 rounded border',
                              getImpactColor(suggestion.impact)
                            )}
                          >
                            {suggestion.impact} impact
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{suggestion.issue}</p>
                        <p className="text-xs text-gray-700">{suggestion.suggestion}</p>
                      </div>
                      {onApplySuggestion && (
                        <button
                          onClick={() => onApplySuggestion(suggestion.suggestion)}
                          className="shrink-0 p-1.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Apply suggestion"
                        >
                          <Sparkles className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Compact inline version for minimal space
export function ViralScoreBadge({ score, isLoading }: { score: number | null; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        Analyzing...
      </span>
    );
  }

  if (score === null) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        score >= 80
          ? 'bg-green-100 text-green-700'
          : score >= 60
          ? 'bg-yellow-100 text-yellow-700'
          : score >= 40
          ? 'bg-orange-100 text-orange-700'
          : 'bg-red-100 text-red-700'
      )}
    >
      {score >= 80 ? (
        <TrendingUp className="h-3 w-3" />
      ) : score >= 40 ? (
        <Minus className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {score} Viral Score
    </span>
  );
}
