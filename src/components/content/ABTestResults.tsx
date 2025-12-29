import { useState } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  MousePointer,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Target,
  Percent,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ABTestResult, PostVariant } from '../../types/abtest';

interface ABTestResultsProps {
  results: ABTestResult;
  onSelectWinner?: (variant: PostVariant) => void;
  compact?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function getImprovementColor(improvement: number): string {
  if (improvement > 10) return 'text-green-600';
  if (improvement > 0) return 'text-green-500';
  if (improvement < -10) return 'text-red-600';
  if (improvement < 0) return 'text-red-500';
  return 'text-gray-500';
}

function getImprovementIcon(improvement: number) {
  if (improvement > 0) return <TrendingUp className="h-3.5 w-3.5" />;
  if (improvement < 0) return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  values: { variantName: string; value: number; isWinner: boolean }[];
  format?: (n: number) => string;
}

function MetricCard({ icon, label, values, format = formatNumber }: MetricCardProps) {
  const maxValue = Math.max(...values.map(v => v.value));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-20 truncate">{v.variantName}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  v.isWinner ? 'bg-green-500' : 'bg-primary-400'
                )}
                style={{ width: `${(v.value / maxValue) * 100}%` }}
              />
            </div>
            <span className={cn(
              'text-xs font-medium w-14 text-right',
              v.isWinner ? 'text-green-600' : 'text-gray-700'
            )}>
              {format(v.value)}
            </span>
            {v.isWinner && <Trophy className="h-3 w-3 text-yellow-500" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ABTestResults({
  results,
  onSelectWinner,
  compact = false,
}: ABTestResultsProps) {
  const [expandedInsights, setExpandedInsights] = useState(!compact);

  const isSignificant = results.statisticalSignificance >= 0.95;

  return (
    <div className="space-y-4">
      {/* Winner Banner */}
      {results.winner && (
        <div className={cn(
          'rounded-xl p-4 border-2',
          isSignificant
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              isSignificant ? 'bg-green-100' : 'bg-yellow-100'
            )}>
              <Trophy className={cn(
                'h-5 w-5',
                isSignificant ? 'text-green-600' : 'text-yellow-600'
              )} />
            </div>
            <div className="flex-1">
              <h3 className={cn(
                'text-sm font-semibold',
                isSignificant ? 'text-green-800' : 'text-yellow-800'
              )}>
                {isSignificant ? 'Winner Found!' : 'Preliminary Winner'}
              </h3>
              <p className={cn(
                'text-xs mt-0.5',
                isSignificant ? 'text-green-600' : 'text-yellow-600'
              )}>
                {results.recommendation}
              </p>
            </div>
            {onSelectWinner && (
              <button
                onClick={() => onSelectWinner(results.winner!)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isSignificant
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                )}
              >
                Use Winner
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistical Significance */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-600">Sample Size:</span>
          <span className="text-xs font-semibold text-gray-900">
            {formatNumber(results.sampleSize)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-600">Confidence:</span>
          <span className={cn(
            'text-xs font-semibold',
            isSignificant ? 'text-green-600' : 'text-yellow-600'
          )}>
            {(results.statisticalSignificance * 100).toFixed(0)}%
          </span>
        </div>
        {isSignificant ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Statistically Significant
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <AlertCircle className="h-3.5 w-3.5" />
            More data needed
          </span>
        )}
      </div>

      {/* Variant Comparison Cards */}
      <div className="space-y-3">
        {results.variants.map((variantResult, index) => {
          const { variant, metrics, isWinner, improvementOverControl } = variantResult;
          const isControl = index === 0;

          return (
            <div
              key={variant.id}
              className={cn(
                'rounded-xl border-2 p-4 transition-all',
                isWinner
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-gray-200 bg-white'
              )}
            >
              {/* Variant Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
                  <span className="text-sm font-semibold text-gray-900">
                    {String.fromCharCode(65 + index)}. {variant.name}
                  </span>
                  {isControl && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      Control
                    </span>
                  )}
                  {isWinner && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Winner
                    </span>
                  )}
                </div>

                {!isControl && (
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium',
                    getImprovementColor(improvementOverControl),
                    improvementOverControl > 0 ? 'bg-green-50' : improvementOverControl < 0 ? 'bg-red-50' : 'bg-gray-50'
                  )}>
                    {getImprovementIcon(improvementOverControl)}
                    {improvementOverControl > 0 ? '+' : ''}{improvementOverControl.toFixed(1)}% vs control
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-white border border-gray-100">
                  <Eye className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(metrics.impressions)}</p>
                  <p className="text-xs text-gray-500">Impressions</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white border border-gray-100">
                  <Heart className="h-4 w-4 mx-auto text-pink-500 mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(metrics.likes)}</p>
                  <p className="text-xs text-gray-500">Likes</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white border border-gray-100">
                  <MessageCircle className="h-4 w-4 mx-auto text-blue-500 mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(metrics.comments)}</p>
                  <p className="text-xs text-gray-500">Comments</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white border border-gray-100">
                  <Share2 className="h-4 w-4 mx-auto text-green-500 mb-1" />
                  <p className="text-sm font-semibold text-gray-900">{formatNumber(metrics.shares)}</p>
                  <p className="text-xs text-gray-500">Shares</p>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-600">Engagement Rate</span>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  isWinner ? 'text-green-600' : 'text-gray-700'
                )}>
                  {metrics.engagementRate.toFixed(2)}%
                </span>
              </div>

              {/* Content Preview */}
              {!compact && (
                <div className="mt-3 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {variant.content}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparative Metrics */}
      {!compact && (
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            icon={<Heart className="h-4 w-4" />}
            label="Likes"
            values={results.variants.map(v => ({
              variantName: v.variant.name,
              value: v.metrics.likes,
              isWinner: v.isWinner,
            }))}
          />
          <MetricCard
            icon={<MessageCircle className="h-4 w-4" />}
            label="Comments"
            values={results.variants.map(v => ({
              variantName: v.variant.name,
              value: v.metrics.comments,
              isWinner: v.isWinner,
            }))}
          />
          <MetricCard
            icon={<Share2 className="h-4 w-4" />}
            label="Shares"
            values={results.variants.map(v => ({
              variantName: v.variant.name,
              value: v.metrics.shares,
              isWinner: v.isWinner,
            }))}
          />
          <MetricCard
            icon={<MousePointer className="h-4 w-4" />}
            label="Click-through Rate"
            values={results.variants.map(v => ({
              variantName: v.variant.name,
              value: v.metrics.clickThroughRate,
              isWinner: v.isWinner,
            }))}
            format={(n) => `${n.toFixed(2)}%`}
          />
        </div>
      )}

      {/* Insights */}
      {results.insights.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedInsights(!expandedInsights)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">Key Insights</span>
            </div>
            {expandedInsights ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {expandedInsights && (
            <div className="p-3 space-y-2">
              {results.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-600">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact summary badge for inline display
export function ABTestBadge({
  variantCount,
  status,
  winnerName,
}: {
  variantCount: number;
  status: 'draft' | 'active' | 'completed';
  winnerName?: string;
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      status === 'completed'
        ? 'bg-green-100 text-green-700'
        : status === 'active'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-600'
    )}>
      <BarChart3 className="h-3 w-3" />
      {status === 'completed' && winnerName
        ? `Winner: ${winnerName}`
        : status === 'active'
        ? `Testing ${variantCount} variants`
        : `${variantCount} variants`
      }
    </span>
  );
}
