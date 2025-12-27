import { useState } from 'react';
import { Plus, List, LayoutGrid } from 'lucide-react';
import { DashboardLayout } from '../components/layout';
import { Button } from '../components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { ContentCard, ContentFilters, ContentEditor } from '../components/content';

// Mock data for content items
const mockContent = [
  {
    id: '1',
    title: 'Product Launch Announcement',
    content:
      "🚀 Exciting news! We're thrilled to unveil our latest product that's going to revolutionize the way you work. Stay tuned for more details!",
    mediaUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800',
    mediaType: 'image' as const,
    platforms: ['instagram', 'facebook', 'linkedin'],
    status: 'scheduled' as const,
    scheduledAt: '2024-01-20T10:00:00',
  },
  {
    id: '2',
    title: 'Behind the Scenes',
    content:
      'Take a peek behind the curtain! 👀 Our team has been working hard to bring you something special. #BehindTheScenes #TeamWork',
    mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    mediaType: 'image' as const,
    platforms: ['instagram', 'twitter'],
    status: 'published' as const,
    publishedAt: '2024-01-15T14:30:00',
    metrics: {
      views: 12500,
      likes: 892,
      comments: 47,
      shares: 23,
    },
  },
  {
    id: '3',
    title: 'Weekly Tips',
    content:
      '💡 Pro tip of the week: Consistency is key in social media marketing. Post regularly and engage with your audience daily.',
    platforms: ['twitter', 'linkedin'],
    status: 'draft' as const,
  },
  {
    id: '4',
    title: 'Customer Success Story',
    content:
      "We love hearing from our customers! Check out this amazing success story from @acmecorp. They increased their engagement by 150% using our platform! 📈",
    mediaUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800',
    mediaType: 'image' as const,
    platforms: ['facebook', 'linkedin'],
    status: 'published' as const,
    publishedAt: '2024-01-12T09:00:00',
    metrics: {
      views: 8900,
      likes: 456,
      comments: 28,
      shares: 67,
    },
  },
  {
    id: '5',
    title: 'Industry News Update',
    content:
      '📰 Breaking: Major changes coming to social media algorithms in 2024. Here\'s what you need to know to stay ahead...',
    platforms: ['twitter'],
    status: 'failed' as const,
    scheduledAt: '2024-01-18T16:00:00',
  },
  {
    id: '6',
    title: 'Team Spotlight',
    content:
      '🌟 Meet Sarah, our incredible head of customer success! Sarah has helped over 500 clients achieve their social media goals.',
    mediaUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800',
    mediaType: 'image' as const,
    platforms: ['instagram', 'linkedin'],
    status: 'scheduled' as const,
    scheduledAt: '2024-01-22T11:00:00',
  },
];

type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'pending_approval';

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

  // Filter content based on active filters
  const filteredContent = mockContent.filter((item) => {
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
      !item.platforms.some((p) => selectedPlatforms.includes(p))
    ) {
      return false;
    }

    return true;
  });

  const handleEdit = (id: string) => {
    const content = mockContent.find((c) => c.id === id);
    if (content) {
      setEditingContent(content);
      setIsEditorOpen(true);
    }
  };

  const handleDuplicate = (id: string) => {
    const content = mockContent.find((c) => c.id === id);
    if (content) {
      const duplicate: ContentItem = {
        ...content,
        id: `${content.id}-copy-${Date.now()}`,
        title: `${content.title} (Copy)`,
        status: 'draft',
      };
      setEditingContent(duplicate);
      setIsEditorOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete with confirmation modal
    console.log('Delete:', id);
  };

  const handleSave = (data: any) => {
    // TODO: Implement save to backend
    console.log('Save:', data);
    setEditingContent(null);
  };

  const handleNewContent = () => {
    setEditingContent(null);
    setIsEditorOpen(true);
  };

  // Stats
  const stats = {
    total: mockContent.length,
    draft: mockContent.filter((c) => c.status === 'draft').length,
    scheduled: mockContent.filter((c) => c.status === 'scheduled').length,
    published: mockContent.filter((c) => c.status === 'published').length,
  };

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
                {filteredContent.map((item) => (
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
                .filter((item) => item.status === 'draft')
                .map((item) => (
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
                .filter((item) => item.status === 'scheduled')
                .map((item) => (
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
                .filter((item) => item.status === 'published')
                .map((item) => (
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
