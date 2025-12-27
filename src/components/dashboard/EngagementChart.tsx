import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Tabs, TabsList, TabsTrigger } from '../ui/Tabs';

interface DataPoint {
  date: string;
  instagram: number;
  facebook: number;
  x: number;
  linkedin: number;
}

interface EngagementChartProps {
  data: DataPoint[];
  timeRange: '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '7d' | '30d' | '90d') => void;
}

export function EngagementChart({ data, timeRange, onTimeRangeChange }: EngagementChartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Engagement Overview</CardTitle>
        <Tabs defaultValue={timeRange} onChange={(v) => onTimeRangeChange(v as '7d' | '30d' | '90d')}>
          <TabsList>
            <TabsTrigger value="7d">7 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="90d">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E1306C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E1306C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFacebook" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1877F2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1877F2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorX" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorLinkedin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0A66C2" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0A66C2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value) => [`${value}%`, '']}
              />
              <Area
                type="monotone"
                dataKey="instagram"
                stroke="#E1306C"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInstagram)"
              />
              <Area
                type="monotone"
                dataKey="facebook"
                stroke="#1877F2"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorFacebook)"
              />
              <Area
                type="monotone"
                dataKey="x"
                stroke="#000000"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorX)"
              />
              <Area
                type="monotone"
                dataKey="linkedin"
                stroke="#0A66C2"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorLinkedin)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#E1306C]" />
            <span className="text-sm text-gray-600">Instagram</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#1877F2]" />
            <span className="text-sm text-gray-600">Facebook</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-black" />
            <span className="text-sm text-gray-600">X</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#0A66C2]" />
            <span className="text-sm text-gray-600">LinkedIn</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
