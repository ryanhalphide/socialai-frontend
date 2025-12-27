import { useState } from 'react';
import {
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

interface ContentCardProps {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  platforms: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  onEdit?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ContentCard({
  id,
  title,
  content,
  mediaUrl,
  mediaType = 'image',
  platforms,
  status,
  scheduledAt,
  publishedAt,
  metrics,
  onEdit,
  onDuplicate,
  onDelete,
}: ContentCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusConfig = {
    draft: { label: 'Draft', variant: 'default' as const },
    scheduled: { label: 'Scheduled', variant: 'warning' as const },
    published: { label: 'Published', variant: 'success' as const },
    failed: { label: 'Failed', variant: 'danger' as const },
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      {/* Media Preview */}
      {mediaUrl && (
        <div className="relative aspect-video bg-gray-100">
          {mediaType === 'video' ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <img
              src={mediaUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute top-2 right-2">
            <Badge variant={statusConfig[status].variant}>
              {statusConfig[status].label}
            </Badge>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-gray-900 line-clamp-1">{title}</h3>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => {
                      onEdit?.(id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate?.(id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onDelete?.(id);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content Preview */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{content}</p>

        {/* Platforms */}
        <div className="flex items-center gap-1 mb-3">
          {platforms.map((platform) => {
            const Icon = platformIcons[platform.toLowerCase()];
            return Icon ? (
              <div
                key={platform}
                className="p-1.5 rounded-full bg-gray-100"
                title={platform}
              >
                <Icon className="h-3.5 w-3.5 text-gray-600" />
              </div>
            ) : null;
          })}
        </div>

        {/* Schedule/Published Date */}
        {(scheduledAt || publishedAt) && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {status === 'scheduled' && scheduledAt
                ? `Scheduled for ${formatDate(scheduledAt)}`
                : publishedAt
                ? `Published ${formatDate(publishedAt)}`
                : ''}
            </span>
          </div>
        )}

        {/* Metrics */}
        {status === 'published' && metrics && (
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            {metrics.views !== undefined && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Eye className="h-3.5 w-3.5" />
                <span>{metrics.views.toLocaleString()}</span>
              </div>
            )}
            {metrics.likes !== undefined && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Heart className="h-3.5 w-3.5" />
                <span>{metrics.likes.toLocaleString()}</span>
              </div>
            )}
            {metrics.comments !== undefined && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MessageCircle className="h-3.5 w-3.5" />
                <span>{metrics.comments.toLocaleString()}</span>
              </div>
            )}
            {metrics.shares !== undefined && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Share2 className="h-3.5 w-3.5" />
                <span>{metrics.shares.toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
