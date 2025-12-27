import { Calendar, Clock, MoreHorizontal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatDateTime } from '../../lib/utils';

interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  scheduledAt: string;
  status: 'scheduled' | 'pending_approval' | 'draft';
}

interface UpcomingPostsProps {
  posts: ScheduledPost[];
}

const statusConfig = {
  scheduled: { label: 'Scheduled', variant: 'success' as const },
  pending_approval: { label: 'Pending', variant: 'warning' as const },
  draft: { label: 'Draft', variant: 'default' as const },
};

export function UpcomingPosts({ posts }: UpcomingPostsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Posts</CardTitle>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {posts.length === 0 ? (
          <div className="p-6 text-center">
            <Calendar className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">No upcoming posts scheduled</p>
            <Button variant="primary" size="sm" className="mt-4">
              Create Post
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {posts.map((post) => {
              const statusInfo = statusConfig[post.status];
              return (
                <li key={post.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span className="capitalize">{post.platform}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(post.scheduledAt)}
                      </span>
                    </div>
                  </div>
                  <button className="ml-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
