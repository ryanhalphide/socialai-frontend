import {
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Music2,
  AtSign,
} from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { cn, formatNumber } from '../../lib/utils';

type PlatformType = 'instagram' | 'facebook' | 'x' | 'twitter' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest' | 'threads';

interface PlatformCardProps {
  platform: PlatformType;
  accountName: string;
  followers: number;
  engagement: number;
  postsThisWeek: number;
  isConnected: boolean;
}

const platformConfig: Record<PlatformType, {
  name: string;
  icon: typeof Instagram;
  bgClass: string;
  textClass: string;
}> = {
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
    textClass: 'text-white',
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    bgClass: 'bg-blue-600',
    textClass: 'text-white',
  },
  x: {
    name: 'X (Twitter)',
    icon: Twitter,
    bgClass: 'bg-black',
    textClass: 'text-white',
  },
  twitter: {
    name: 'Twitter',
    icon: Twitter,
    bgClass: 'bg-black',
    textClass: 'text-white',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    bgClass: 'bg-blue-700',
    textClass: 'text-white',
  },
  tiktok: {
    name: 'TikTok',
    icon: Music2,
    bgClass: 'bg-black',
    textClass: 'text-white',
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    bgClass: 'bg-red-600',
    textClass: 'text-white',
  },
  pinterest: {
    name: 'Pinterest',
    icon: Instagram,
    bgClass: 'bg-red-700',
    textClass: 'text-white',
  },
  threads: {
    name: 'Threads',
    icon: AtSign,
    bgClass: 'bg-black',
    textClass: 'text-white',
  },
};

export function PlatformCard({
  platform,
  accountName,
  followers,
  engagement,
  postsThisWeek,
  isConnected,
}: PlatformCardProps) {
  const config = platformConfig[platform] || platformConfig.instagram; // Fallback to Instagram for unknown platforms
  const Icon = config.icon;

  return (
    <Card className="overflow-hidden">
      <div className={cn('px-4 py-3', config.bgClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('h-5 w-5', config.textClass)} />
            <span className={cn('font-medium', config.textClass)}>{config.name}</span>
          </div>
          <Badge variant={isConnected ? 'success' : 'default'}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-gray-900">{accountName}</p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Followers</p>
            <p className="text-lg font-semibold text-gray-900">{formatNumber(followers)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Engagement</p>
            <p className="text-lg font-semibold text-gray-900">{engagement}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Posts</p>
            <p className="text-lg font-semibold text-gray-900">{postsThisWeek}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
