import { Search, Filter, Calendar, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface ContentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  selectedPlatforms: string[];
  onPlatformsChange: (platforms: string[]) => void;
  dateRange: { start: string | null; end: string | null };
  onDateRangeChange: (range: { start: string | null; end: string | null }) => void;
}

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'failed', label: 'Failed' },
];

const platforms = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'threads', label: 'Threads' },
];

export function ContentFilters({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPlatforms,
  onPlatformsChange,
  dateRange,
  onDateRangeChange,
}: ContentFiltersProps) {
  const hasActiveFilters =
    selectedStatus ||
    selectedPlatforms.length > 0 ||
    dateRange.start ||
    dateRange.end;

  const clearFilters = () => {
    onStatusChange(null);
    onPlatformsChange([]);
    onDateRangeChange({ start: null, end: null });
  };

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      onPlatformsChange(selectedPlatforms.filter((p) => p !== platform));
    } else {
      onPlatformsChange([...selectedPlatforms, platform]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500"
          >
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status Filters */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
          {statuses.map((status) => (
            <button
              key={status.value}
              onClick={() =>
                onStatusChange(selectedStatus === status.value ? null : status.value)
              }
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedStatus === status.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-300 mx-2" />

        {/* Platform Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs font-medium text-gray-500 mr-1">Platform:</span>
          {platforms.slice(0, 5).map((platform) => (
            <button
              key={platform.value}
              onClick={() => togglePlatform(platform.value)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedPlatforms.includes(platform.value)
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {platform.label}
            </button>
          ))}
          {platforms.length > 5 && (
            <button className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">
              +{platforms.length - 5} more
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-gray-300 mx-2" />

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, start: e.target.value || null })
            }
            className="px-2 py-1 rounded border border-gray-300 text-xs focus:border-primary-500 focus:outline-none"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={(e) =>
              onDateRangeChange({ ...dateRange, end: e.target.value || null })
            }
            className="px-2 py-1 rounded border border-gray-300 text-xs focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Active Filter Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Showing results for:</span>
          {selectedStatus && (
            <Badge variant="secondary" className="gap-1">
              {statuses.find((s) => s.value === selectedStatus)?.label}
              <button
                onClick={() => onStatusChange(null)}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {selectedPlatforms.map((platform) => (
            <Badge key={platform} variant="secondary" className="gap-1">
              {platforms.find((p) => p.value === platform)?.label}
              <button
                onClick={() => togglePlatform(platform)}
                className="hover:text-gray-900"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
