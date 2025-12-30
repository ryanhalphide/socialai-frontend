import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ContentEditor } from '../components/content';
import { useScheduledPosts, useCreatePost } from '../hooks/convex/usePosts';

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
};

const platformColors: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  twitter: 'bg-black',
  linkedin: 'bg-blue-700',
  youtube: 'bg-red-600',
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date()); // Start with current month
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Convex data
  const rawScheduledPosts = useScheduledPosts();
  const createPost = useCreatePost();

  // Transform posts to calendar format
  type RawPost = { _id: string; title?: string; content: string; platforms: string[]; scheduledAt?: number };
  const scheduledPosts = useMemo(() => {
    if (!rawScheduledPosts) return [];
    return rawScheduledPosts.map((post: RawPost) => {
      const scheduledDate = post.scheduledAt ? new Date(post.scheduledAt) : new Date();
      return {
        id: post._id,
        title: post.title || post.content.slice(0, 30) + '...',
        time: scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        platforms: post.platforms,
        date: scheduledDate.toISOString().split('T')[0],
        scheduledAt: post.scheduledAt,
      };
    });
  }, [rawScheduledPosts]);

  const isLoading = rawScheduledPosts === undefined;

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateKey = (day: number) => {
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentDate.getFullYear()}-${month}-${dayStr}`;
  };

  type ScheduledPost = { id: string; title: string; time: string; platforms: string[]; date: string; scheduledAt?: number };
  const getPostsForDay = (day: number): ScheduledPost[] => {
    const dateKey = formatDateKey(day);
    return scheduledPosts.filter((post: ScheduledPost) => post.date === dateKey);
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(formatDateKey(day));
  };

  const handleSave = async (data: {
    title?: string;
    content: string;
    platforms: string[];
    status: string;
    scheduledAt?: string;
    mediaUrls?: string[];
    mediaType?: string;
    hashtags?: string[];
  }) => {
    try {
      await createPost({
        title: data.title,
        content: data.content,
        platforms: data.platforms,
        status: data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).getTime() : undefined,
        mediaUrls: data.mediaUrls,
        mediaType: data.mediaType,
        hashtags: data.hashtags,
        wasAiGenerated: false,
      });
      setIsEditorOpen(false);
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  // Generate calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const today = new Date();
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const selectedDatePosts: ScheduledPost[] = selectedDate
    ? scheduledPosts.filter((post: ScheduledPost) => post.date === selectedDate)
    : [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-500 mt-1">
              Plan and schedule your social media content
            </p>
          </div>
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Schedule Post
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button variant="secondary" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={index} className="min-h-[100px]" />;
                  }

                  const posts = getPostsForDay(day);
                  const dateKey = formatDateKey(day);
                  const isSelected = selectedDate === dateKey;

                  return (
                    <div
                      key={index}
                      onClick={() => handleDateClick(day)}
                      className={`min-h-[100px] p-2 rounded-lg border cursor-pointer transition-colors ${
                        isToday(day)
                          ? 'bg-primary-50 border-primary-200'
                          : isSelected
                          ? 'bg-gray-100 border-gray-300'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`text-sm font-medium ${
                          isToday(day) ? 'text-primary-600' : 'text-gray-900'
                        }`}
                      >
                        {day}
                      </span>

                      {/* Posts Preview */}
                      <div className="mt-1 space-y-1">
                        {posts.slice(0, 2).map((post: ScheduledPost) => (
                          <div
                            key={post.id}
                            className="flex items-center gap-1 p-1 bg-white rounded text-xs shadow-sm"
                          >
                            <div className="flex -space-x-1">
                              {post.platforms.slice(0, 2).map((platform: string) => {
                                const Icon = platformIcons[platform];
                                return Icon ? (
                                  <div
                                    key={platform}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                                  >
                                    <Icon className="h-2.5 w-2.5 text-white" />
                                  </div>
                                ) : null;
                              })}
                            </div>
                            <span className="truncate text-gray-600">
                              {post.time}
                            </span>
                          </div>
                        ))}
                        {posts.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{posts.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar - Selected Day Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {selectedDate
                ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a date'}
            </h3>

            {selectedDatePosts.length > 0 ? (
              <div className="space-y-3">
                {selectedDatePosts.map((post: ScheduledPost) => (
                  <div
                    key={post.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {post.title}
                      </span>
                      <Badge variant="secondary" size="sm">
                        {post.time}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {post.platforms.map((platform: string) => {
                        const Icon = platformIcons[platform];
                        return Icon ? (
                          <div
                            key={platform}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${platformColors[platform]}`}
                          >
                            <Icon className="h-3 w-3 text-white" />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-3">
                  No posts scheduled for this day
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditorOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Schedule Post
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                Click on a date to view scheduled posts
              </p>
            )}

            {/* Upcoming Posts */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Upcoming Posts
              </h4>
              <div className="space-y-2">
                {scheduledPosts.slice(0, 4).map((post: ScheduledPost) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-600 truncate">{post.title}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.date + 'T00:00:00').toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric' }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Editor Modal */}
      <ContentEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}
