import { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Wand2,
  Sparkles,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
  MessageSquare,
  Hash,
  Smile,
  Type,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PostVariant, VariantType } from '../../types/abtest';
import { ViralScoreBadge } from './ViralScoreDisplay';

interface VariantEditorProps {
  originalContent: string;
  variants: PostVariant[];
  platform: string;
  isGenerating?: boolean;
  onAddVariant: (variant: Omit<PostVariant, 'id' | 'createdAt'>) => void;
  onUpdateVariant: (id: string, updates: Partial<PostVariant>) => void;
  onRemoveVariant: (id: string) => void;
  onDuplicateVariant: (id: string) => void;
  onGenerateVariants: (types?: VariantType[]) => void;
  maxVariants?: number;
}

const variantTypeConfig: Record<VariantType, { label: string; icon: React.ReactNode; color: string }> = {
  content: { label: 'Full Rewrite', icon: <Type className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700' },
  hook: { label: 'Hook', icon: <Zap className="h-3.5 w-3.5" />, color: 'bg-yellow-100 text-yellow-700' },
  cta: { label: 'Call to Action', icon: <MessageSquare className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700' },
  hashtags: { label: 'Hashtags', icon: <Hash className="h-3.5 w-3.5" />, color: 'bg-green-100 text-green-700' },
  tone: { label: 'Tone', icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-pink-100 text-pink-700' },
  length: { label: 'Length', icon: <Type className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-700' },
  emoji: { label: 'Emoji Style', icon: <Smile className="h-3.5 w-3.5" />, color: 'bg-cyan-100 text-cyan-700' },
};

const platformLimits: Record<string, number> = {
  instagram: 2200,
  facebook: 63206,
  twitter: 280,
  linkedin: 3000,
  youtube: 5000,
};

export function VariantEditor({
  originalContent,
  variants,
  platform,
  isGenerating = false,
  onAddVariant,
  onUpdateVariant,
  onRemoveVariant,
  onDuplicateVariant,
  onGenerateVariants,
  maxVariants = 5,
}: VariantEditorProps) {
  const [expandedVariant, setExpandedVariant] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantContent, setNewVariantContent] = useState('');
  const [newVariantType, setNewVariantType] = useState<VariantType>('content');
  const [selectedGenerateTypes, setSelectedGenerateTypes] = useState<VariantType[]>(['hook', 'cta', 'tone']);

  const charLimit = platformLimits[platform] || 2200;
  const canAddMore = variants.length < maxVariants;

  const handleAddVariant = () => {
    if (!newVariantName.trim() || !newVariantContent.trim()) return;

    onAddVariant({
      name: newVariantName.trim(),
      content: newVariantContent.trim(),
      type: newVariantType,
    });

    setNewVariantName('');
    setNewVariantContent('');
    setShowAddForm(false);
  };

  const toggleGenerateType = (type: VariantType) => {
    setSelectedGenerateTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            A/B Test Variants
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {variants.length} of {maxVariants} variants created
          </p>
        </div>
      </div>

      {/* Original Content (Control) */}
      <div className="rounded-lg border-2 border-primary-200 bg-primary-50/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
              Control (Original)
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {originalContent.length}/{charLimit}
          </span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
          {originalContent || 'No content yet'}
        </p>
      </div>

      {/* AI Generate Variants */}
      {canAddMore && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">AI-Generate Variants</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {(Object.entries(variantTypeConfig) as [VariantType, typeof variantTypeConfig[VariantType]][]).map(
              ([type, config]) => (
                <button
                  key={type}
                  onClick={() => toggleGenerateType(type)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all',
                    selectedGenerateTypes.includes(type)
                      ? config.color
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  )}
                >
                  {config.icon}
                  {config.label}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => onGenerateVariants(selectedGenerateTypes)}
            disabled={isGenerating || selectedGenerateTypes.length === 0 || !originalContent}
            className={cn(
              'w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors',
              isGenerating || selectedGenerateTypes.length === 0 || !originalContent
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating variants...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate {selectedGenerateTypes.length} Variant{selectedGenerateTypes.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Variants List */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              {/* Variant Header */}
              <div
                className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedVariant(expandedVariant === variant.id ? null : variant.id)}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />

                <span className="text-sm font-medium text-gray-700 flex-1">
                  {String.fromCharCode(65 + index)}. {variant.name}
                </span>

                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1',
                  variantTypeConfig[variant.type].color
                )}>
                  {variantTypeConfig[variant.type].icon}
                  {variantTypeConfig[variant.type].label}
                </span>

                {variant.viralScore !== undefined && (
                  <ViralScoreBadge score={variant.viralScore} />
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateVariant(variant.id);
                    }}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveVariant(variant.id);
                    }}
                    className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  {expandedVariant === variant.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedVariant === variant.id && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <textarea
                    value={variant.content}
                    onChange={(e) => onUpdateVariant(variant.id, { content: e.target.value })}
                    className="w-full mt-3 p-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={4}
                    maxLength={charLimit}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => onUpdateVariant(variant.id, { name: e.target.value })}
                      className="text-xs text-gray-500 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none"
                      placeholder="Variant name"
                    />
                    <span className="text-xs text-gray-400">
                      {variant.content.length}/{charLimit}
                    </span>
                  </div>
                  {variant.description && (
                    <p className="mt-2 text-xs text-gray-500 italic">
                      {variant.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual Add Variant */}
      {canAddMore && (
        <>
          {showAddForm ? (
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Add Custom Variant</span>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                placeholder="Variant name (e.g., 'Shorter hook')"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />

              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(variantTypeConfig) as [VariantType, typeof variantTypeConfig[VariantType]][]).map(
                  ([type, config]) => (
                    <button
                      key={type}
                      onClick={() => setNewVariantType(type)}
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all',
                        newVariantType === type
                          ? config.color
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      )}
                    >
                      {config.icon}
                      {config.label}
                    </button>
                  )
                )}
              </div>

              <textarea
                value={newVariantContent}
                onChange={(e) => setNewVariantContent(e.target.value)}
                placeholder="Variant content..."
                className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                maxLength={charLimit}
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {newVariantContent.length}/{charLimit}
                </span>
                <button
                  onClick={handleAddVariant}
                  disabled={!newVariantName.trim() || !newVariantContent.trim()}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium',
                    newVariantName.trim() && newVariantContent.trim()
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Add Variant
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Custom Variant
            </button>
          )}
        </>
      )}

      {/* Max variants warning */}
      {!canAddMore && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-xs text-yellow-700">
            Maximum {maxVariants} variants reached. Remove one to add more.
          </span>
        </div>
      )}
    </div>
  );
}
