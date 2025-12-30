import { useState, useMemo } from 'react';
import { Plus, List, LayoutGrid, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { ContentCard, ContentFilters, ContentEditor } from '../components/content';
import { usePosts, usePostStats, usePostMutations } from '../hooks/convex/usePosts';
import type { Id } from '../../convex/_generated/dataModel';

type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';

type ContentItem = {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  platforms: string[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
};

type ViewMode = 'grid' | 'list';

export function Content() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    start: string | null;
    end: string | null;
  }>({ start: null, end: null });

  // Convex data
  const posts = usePosts();
  const postStats = usePostStats();
  const { createPost, updatePost, deletePost, duplicatePost } = usePostMutations();

  // Transform Convex posts to ContentItem format
  type RawPost = { _id: string; title?: string; content: string; mediaUrls?: string[]; mediaType?: string; platforms: string[]; status: string; scheduledAt?: number; publishedAt?: number };
  const contentItems: ContentItem[] = useMemo(() => {
    if (!posts) return [];
    return posts.map((post: RawPost) => ({
      id: post._id,
      title: post.title || '',
      content: post.content,
      mediaUrl: post.mediaUrls?.[0],
      mediaType: post.mediaType as 'image' | 'video' | undefined,
      platforms: post.platforms,
      status: post.status as ContentStatus,
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : undefined,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
    }));
  }, [posts]);

  // Filter content based on active filters
  const filteredContent: ContentItem[] = useMemo(() => {
    return contentItems.filter((item: ContentItem) => {
      // Search filter
      if (
        searchQuery &&
        !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.content.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Status filter
      if (selectedStatus && item.status !== selectedStatus) {
        return false;
      }

      // Platform filter
      if (
        selectedPlatforms.length > 0 &&
        !item.platforms.some((p: string) => selectedPlatforms.includes(p))
      ) {
        return false;
      }

      return true;
    });
  }, [contentItems, searchQuery, selectedStatus, selectedPlatforms]);

  const handleEdit = (id: string) => {
    const content = contentItems.find((c: ContentItem) => c.id === id);
    if (content) {
      setEditingContent(content);
      setIsEditorOpen(true);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicatePost({ postId: id as Id<'posts'> });
    } catch (error) {
      console.error('Failed to duplicate post:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost({ postId: id as Id<'posts'> });
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
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
      if (editingContent) {
        // Update existing post
        await updatePost({
          postId: editingContent.id as Id<'posts'>,
          title: data.title,
          content: data.content,
          platforms: data.platforms,
          status: data.status,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).getTime() : undefined,
          mediaUrls: data.mediaUrls,
          mediaType: data.mediaType,
          hashtags: data.hashtags,
        });
      } else {
        // Create new post
        await createPost({
          title: data.title,
          content: data.content,
          platforms: data.platforms,
          status: data.status,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).getTime() : undefined,
          mediaUrls: data.mediaUrls,
          mediaType: data.mediaType,
          hashtags: data.hashtags,
          wasAiGenerated: false,
        });
      }
      setIsEditorOpen(false);
      setEditingContent(null);
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  const handleNewContent = () => {
    setEditingContent(null);
    setIsEditorOpen(true);
  };

  // Stats from Convex
  const stats = {
    total: postStats?.total ?? 0,
    draft: postStats?.drafts ?? 0,
    scheduled: postStats?.scheduled ?? 0,
    published: postStats?.published ?? 0,
  };

  // Loading state
  const isLoading = posts === undefined;

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
            <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
            <p className="text-gray-500 mt-1">
              Manage and organize all your social media content
            </p>
          </div>
          <Button onClick={handleNewContent}>
            <Plus className="h-4 w-4 mr-1" />
            Create Post
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Posts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Drafts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.draft}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Scheduled</p>
            <p className="text-2xl font-bold text-amber-600">{stats.scheduled}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-2xl font-bold text-green-600">{stats.published}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Content</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
            </TabsList>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4">
            <ContentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedPlatforms={selectedPlatforms}
              onPlatformsChange={setSelectedPlatforms}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>

          {/* Content Grid */}
          <TabsContent value="all" className="mt-6">
            {filteredContent.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-4'
                }
              >
                {filteredContent.map((item: ContentItem) => (
                  <ContentCard
                    key={item.id}
                    {...item}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No content found matching your filters</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={handleNewContent}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first post
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-6">
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {filteredContent
                .filter((item: ContentItem) => item.status === 'draft')
                .map((item: ContentItem) => (
                  <ContentCard
                    key={item.id}
                    {...item}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {filteredContent
                .filter((item: ContentItem) => item.status === 'scheduled')
                .map((item: ContentItem) => (
                  <ContentCard
                    key={item.id}
                    {...item}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="published" className="mt-6">
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }
            >
              {filteredContent
                .filter((item: ContentItem) => item.status === 'published')
                .map((item: ContentItem) => (
                  <ContentCard
                    key={item.id}
                    {...item}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Content Editor Modal */}
      <ContentEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingContent(null);
        }}
        initialData={editingContent || undefined}
        onSave={handleSave}
      />
    </DashboardLayout>
  );
}
