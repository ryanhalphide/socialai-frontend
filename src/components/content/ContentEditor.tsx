import { useState, useCallback } from 'react';
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
  Loader2,
  TrendingUp,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { ViralScoreDisplay, ViralScoreBadge } from './ViralScoreDisplay';
import { useViralScore } from '../../hooks/useViralScore';

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
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiPromptInput, setShowAiPromptInput] = useState(false);

  // Viral score hook - automatically analyzes content as user types
  const primaryPlatform = selectedPlatforms[0] || 'instagram';
  const {
    data: viralScoreData,
    isLoading: isAnalyzingViralScore,
    error: viralScoreError,
    reset: resetViralScore,
  } = useViralScore(content, primaryPlatform, {
    debounceMs: 1500,
    minContentLength: 20,
    autoAnalyze: true,
  });

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
    if (!showAiPromptInput) {
      setShowAiPromptInput(true);
      return;
    }

    if (!aiPrompt.trim()) {
      setAiError('Please enter a prompt for AI generation');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      // Use the first selected platform for generation
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          platform: primaryPlatform,
          contentType: 'post',
          tone: 'professional',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      setContent(data.content);
      setShowAiPromptInput(false);
      setAiPrompt('');
      // Reset viral score to trigger new analysis
      resetViralScore();
    } catch (error) {
      console.error('AI generation error:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleCancelAiPrompt = () => {
    setShowAiPromptInput(false);
    setAiPrompt('');
    setAiError(null);
  };

  const handleApplySuggestion = useCallback(async (suggestion: string) => {
    // Use AI to apply the suggestion to the content
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Improve this social media post by applying this suggestion: "${suggestion}"\n\nOriginal post:\n${content}\n\nProvide only the improved post, no explanation.`,
          platform: primaryPlatform,
          contentType: 'post',
          tone: 'professional',
        }),
      });

      if (!response.ok) throw new Error('Failed to apply suggestion');

      const data = await response.json();
      setContent(data.content);
      resetViralScore();
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [content, primaryPlatform, resetViralScore]);

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
    <Modal isOpen={isOpen} onClose={onClose} title="Create Post" size="xl">
      <div className="flex gap-6">
        {/* Left Column - Editor */}
        <div className="flex-1 space-y-6">
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
              <div className="flex items-center gap-3">
                <label className="block text-sm font-medium text-gray-700">
                  Content
                </label>
                {/* Inline Viral Score Badge */}
                {content.length >= 20 && (
                  <ViralScoreBadge
                    score={viralScoreData?.score ?? null}
                    isLoading={isAnalyzingViralScore}
                  />
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateAI}
                disabled={isGeneratingAI}
                className="text-primary-600"
              >
                {isGeneratingAI ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>

            {/* AI Prompt Input */}
            {showAiPromptInput && (
              <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  What would you like to post about?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                    placeholder="e.g., Announce our new product launch with excitement"
                    className="flex-1 px-3 py-2 rounded-lg border border-primary-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={isGeneratingAI}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || !aiPrompt.trim()}
                  >
                    {isGeneratingAI ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Generate'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelAiPrompt}
                    disabled={isGeneratingAI}
                  >
                    Cancel
                  </Button>
                </div>
                {aiError && (
                  <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {aiError}
                  </p>
                )}
                <p className="mt-2 text-xs text-primary-600">
                  Generating for: {selectedPlatforms.map(p =>
                    platformOptions.find(opt => opt.id === p)?.name
                  ).join(', ')}
                </p>
              </div>
            )}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What would you like to share?"
                rows={8}
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
        </div>

        {/* Right Column - Viral Score & Preview */}
        <div className="w-80 space-y-4">
          {/* Viral Score Panel */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <TrendingUp className="h-4 w-4 text-primary-500" />
                Viral Score Analysis
              </label>
            </div>
            <ViralScoreDisplay
              data={viralScoreData}
              isLoading={isAnalyzingViralScore}
              error={viralScoreError}
              compact={false}
              onApplySuggestion={handleApplySuggestion}
            />
          </div>

          {/* Preview */}
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
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {content || 'Your content preview will appear here...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-400">
          {viralScoreData && (
            <span>
              Last analyzed: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
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
      </div>
    </Modal>
  );
}
