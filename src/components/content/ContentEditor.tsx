import { useState } from 'react';
import {
  Image,
  Video,
  Link2,
  Hash,
  AtSign,
  Smile,
  Calendar,
  Clock,
  Sparkles,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface ContentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    title: string;
    content: string;
    platforms: string[];
    scheduledAt?: string;
    mediaUrl?: string;
  };
  onSave: (data: {
    title: string;
    content: string;
    platforms: string[];
    scheduledAt?: string;
    status: 'draft' | 'scheduled';
  }) => void;
}

const platformOptions = [
  { id: 'instagram', name: 'Instagram', icon: Instagram, maxLength: 2200 },
  { id: 'facebook', name: 'Facebook', icon: Facebook, maxLength: 63206 },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter, maxLength: 280 },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, maxLength: 3000 },
  { id: 'youtube', name: 'YouTube', icon: Youtube, maxLength: 5000 },
];

export function ContentEditor({
  isOpen,
  onClose,
  initialData,
  onSave,
}: ContentEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    initialData?.platforms || ['instagram']
  );
  const [scheduleDate, setScheduleDate] = useState(
    initialData?.scheduledAt?.split('T')[0] || ''
  );
  const [scheduleTime, setScheduleTime] = useState(
    initialData?.scheduledAt?.split('T')[1]?.slice(0, 5) || ''
  );
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platformId));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  const getCharacterLimit = () => {
    const limits = selectedPlatforms.map(
      (p) => platformOptions.find((opt) => opt.id === p)?.maxLength || Infinity
    );
    return Math.min(...limits);
  };

  const characterLimit = getCharacterLimit();
  const isOverLimit = content.length > characterLimit;

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    // Simulate AI content generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setContent(
      "🚀 Exciting news! We're thrilled to share our latest innovation that's changing the game. Stay tuned for more updates! #Innovation #Tech #Startup"
    );
    setIsGeneratingAI(false);
  };

  const handleSave = (asDraft: boolean) => {
    const scheduledAt =
      scheduleDate && scheduleTime
        ? `${scheduleDate}T${scheduleTime}:00`
        : undefined;

    onSave({
      title,
      content,
      platforms: selectedPlatforms,
      scheduledAt,
      status: asDraft ? 'draft' : 'scheduled',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post" size="lg">
      <div className="space-y-6">
        {/* Title */}
        <Input
          label="Title (internal reference)"
          placeholder="e.g., Product Launch Announcement"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platforms
          </label>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map((platform) => {
              const Icon = platform.icon;
              const isSelected = selectedPlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{platform.name}</span>
                  {isSelected && (
                    <CheckCircle2 className="h-4 w-4 text-primary-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateAI}
              isLoading={isGeneratingAI}
              className="text-primary-600"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Generate with AI
            </Button>
          </div>
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to share?"
              rows={6}
              className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-1 resize-none ${
                isOverLimit
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }`}
            />
            {/* Toolbar */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1">
              <button className="p-1.5 rounded hover:bg-gray-100" title="Add image">
                <Image className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100" title="Add video">
                <Video className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100" title="Add link">
                <Link2 className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100" title="Add hashtag">
                <Hash className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100" title="Mention">
                <AtSign className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-1.5 rounded hover:bg-gray-100" title="Add emoji">
                <Smile className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            {/* Character Count */}
            <div className="absolute bottom-3 right-3">
              <span
                className={`text-xs ${
                  isOverLimit ? 'text-red-600 font-medium' : 'text-gray-400'
                }`}
              >
                {content.length}/{characterLimit}
              </span>
            </div>
          </div>
          {isOverLimit && (
            <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Content exceeds the character limit for selected platform(s)
            </p>
          )}
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Schedule (optional)
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          {scheduleDate && scheduleTime && (
            <p className="mt-2 text-xs text-gray-500">
              Scheduled for{' '}
              {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* Platform Previews */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {selectedPlatforms.map((platformId) => {
              const platform = platformOptions.find((p) => p.id === platformId);
              if (!platform) return null;
              return (
                <Badge key={platformId} variant="secondary">
                  {platform.name}
                </Badge>
              );
            })}
          </div>
          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {content || 'Your content preview will appear here...'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => handleSave(true)}>
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSave(false)}
          disabled={!title || !content || isOverLimit}
        >
          {scheduleDate && scheduleTime ? 'Schedule Post' : 'Publish Now'}
        </Button>
      </div>
    </Modal>
  );
}
