import { Lightbulb, TrendingUp, Clock, Hash } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

type RecommendationCategory = 'timing' | 'content' | 'hashtag' | 'growth';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  platform?: string;
  priority: 'high' | 'medium' | 'low';
  impact?: string;
}

interface RecommendationsCardProps {
  recommendations: Recommendation[];
  onDismiss?: (id: string) => void;
  onApply?: (id: string) => void;
}

const categoryConfig: Record<RecommendationCategory, { icon: typeof Lightbulb; color: string }> = {
  timing: { icon: Clock, color: 'text-blue-600 bg-blue-100' },
  content: { icon: Lightbulb, color: 'text-yellow-600 bg-yellow-100' },
  hashtag: { icon: Hash, color: 'text-purple-600 bg-purple-100' },
  growth: { icon: TrendingUp, color: 'text-green-600 bg-green-100' },
};

const priorityConfig = {
  high: { label: 'High Impact', variant: 'danger' as const },
  medium: { label: 'Medium Impact', variant: 'warning' as const },
  low: { label: 'Low Impact', variant: 'default' as const },
};

export function RecommendationsCard({ recommendations, onDismiss, onApply }: RecommendationsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>AI Recommendations</CardTitle>
          <Badge variant="primary">{recommendations.length} new</Badge>
        </div>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {recommendations.length === 0 ? (
          <div className="p-6 text-center">
            <Lightbulb className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No new recommendations</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recommendations.slice(0, 4).map((rec) => {
              const catConfig = categoryConfig[rec.category];
              const Icon = catConfig.icon;
              const prioConfig = priorityConfig[rec.priority];

              return (
                <li key={rec.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${catConfig.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{rec.title}</p>
                        <Badge variant={prioConfig.variant} className="text-xs">
                          {prioConfig.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{rec.description}</p>
                      {rec.impact && (
                        <p className="mt-1 text-xs text-green-600">
                          Potential impact: {rec.impact}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onApply?.(rec.id)}
                        >
                          Apply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismiss?.(rec.id)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
