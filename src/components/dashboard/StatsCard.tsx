import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { cn, formatNumber } from '../../lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBgColor = 'bg-primary-100',
}: StatsCardProps) {
  const formattedValue = typeof value === 'number' ? formatNumber(value) : value;
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{formattedValue}</p>
            {change !== undefined && (
              <p className="mt-2 flex items-center gap-1 text-sm">
                <span
                  className={cn(
                    'font-medium',
                    isPositive && 'text-green-600',
                    isNegative && 'text-red-600',
                    !isPositive && !isNegative && 'text-gray-500'
                  )}
                >
                  {isPositive && '+'}
                  {change}%
                </span>
                <span className="text-gray-400">{changeLabel}</span>
              </p>
            )}
          </div>
          <div className={cn('rounded-lg p-3', iconBgColor)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
