import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/layout';
import { Button } from '../components/ui/Button';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Edit3,
  Clock,
  TrendingUp,
  Lightbulb,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  BarChart3,
  Zap,
  Target,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';

interface SuggestedPost {
  id: string;
  platform: Platform;
  content: string;
  hashtags: string[];
  predictedEngagement: {
    score: number;
    label: string;
    confidence: number;
  };
  bestPostTime: { day: string; time: string } | null;
  contentType: 'text' | 'image' | 'video';
  mediaPrompt?: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
}

interface Recommendation {
  type: 'insight' | 'action' | 'tip';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  twitter: 'bg-sky-500',
  linkedin: 'bg-indigo-700',
  youtube: 'bg-red-600',
  tiktok: 'bg-black',
};

const PLATFORM_NAMES: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};

export function Copilot() {
  const { user } = useAuth();
  const [suggestedPosts, setSuggestedPosts] = useState<SuggestedPost[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram', 'twitter', 'linkedin']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const generateSuggestions = useCallback(async () => {
    if (!user) return;

    setIsGenerating(true);

    try {
      const suggestions: SuggestedPost[] = [];

      for (const platform of selectedPlatforms) {
        const response = await fetch('/api/ai/generate-smart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            platform,
            contentType: 'text',
            includeHashtags: true,
            includeCTA: true,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          suggestions.push({
            id: `${platform}-${Date.now()}`,
            platform,
            content: data.content,
            hashtags: data.hashtags || [],
            predictedEngagement: data.predictedEngagement,
            bestPostTime: data.bestPostTime,
            contentType: 'text',
            mediaPrompt: data.suggestedMedia,
            status: 'pending',
          });
        }
      }

      setSuggestedPosts(suggestions);

      // Mock recommendations for now
      setRecommendations([
        {
          type: 'insight',
          title: 'Video Content Performs 3x Better',
          description: 'Your video posts get significantly more engagement. Consider creating more video content.',
          priority: 'high',
        },
        {
          type: 'action',
          title: 'Best Time to Post Today',
          description: 'Based on your audience, post between 6-8 PM for maximum reach.',
          priority: 'high',
        },
        {
          type: 'tip',
          title: 'Hashtag Optimization',
          description: 'Use a mix of popular and niche hashtags. Your top performers: #startup #founder',
          priority: 'medium',
        },
      ]);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [user, selectedPlatforms]);

  useEffect(() => {
    if (user && suggestedPosts.length === 0) {
      generateSuggestions();
    }
  }, [user, generateSuggestions, suggestedPosts.length]);

  const handleApprove = (postId: string) => {
    setSuggestedPosts(posts =>
      posts.map(p => (p.id === postId ? { ...p, status: 'approved' } : p))
    );
  };

  const handleReject = (postId: string) => {
    setSuggestedPosts(posts =>
      posts.map(p => (p.id === postId ? { ...p, status: 'rejected' } : p))
    );
  };

  const handleEdit = (post: SuggestedPost) => {
    setEditingId(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = (postId: string) => {
    setSuggestedPosts(posts =>
      posts.map(p =>
        p.id === postId ? { ...p, content: editContent, status: 'edited' } : p
      )
    );
    setEditingId(null);
    setEditContent('');
  };

  const handleCopyAndPost = (post: SuggestedPost) => {
    const fullContent = `${post.content}\n\n${post.hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullContent);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);

    // Open platform
    const platformUrls: Record<Platform, string> = {
      instagram: 'https://www.instagram.com/',
      facebook: 'https://www.facebook.com/',
      twitter: 'https://twitter.com/compose/tweet',
      linkedin: 'https://www.linkedin.com/feed/',
      youtube: 'https://studio.youtube.com/',
      tiktok: 'https://www.tiktok.com/upload',
    };
    window.open(platformUrls[post.platform], '_blank');
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const pendingPosts = suggestedPosts.filter(p => p.status === 'pending');
  const approvedPosts = suggestedPosts.filter(p => p.status === 'approved' || p.status === 'edited');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary-600" />
              AI Copilot
            </h1>
            <p className="text-gray-600 mt-1">
              Your intelligent social media assistant. Review, approve, and post.
            </p>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Generate New Ideas
          </Button>
        </div>

        {/* Platform Selector */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Generate for:</h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(PLATFORM_NAMES) as Platform[]).map(platform => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedPlatforms.includes(platform)
                    ? `${PLATFORM_COLORS[platform]} text-white`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {PLATFORM_NAMES[platform]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Suggested Posts */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary-600" />
              Today's Suggestions
              {pendingPosts.length > 0 && (
                <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                  {pendingPosts.length} pending
                </span>
              )}
            </h2>

            {isGenerating ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <RefreshCw className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Generating optimized content...</p>
              </div>
            ) : suggestedPosts.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No suggestions yet. Click "Generate New Ideas" to start.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestedPosts.map(post => (
                  <div
                    key={post.id}
                    className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                      post.status === 'rejected'
                        ? 'border-red-200 opacity-50'
                        : post.status === 'approved' || post.status === 'edited'
                          ? 'border-green-300'
                          : 'border-gray-200'
                    }`}
                  >
                    {/* Platform Badge */}
                    <div className={`${PLATFORM_COLORS[post.platform]} px-4 py-2 flex items-center justify-between`}>
                      <span className="text-white font-medium text-sm">
                        {PLATFORM_NAMES[post.platform]}
                      </span>
                      <div className="flex items-center gap-2 text-white/90 text-xs">
                        <TrendingUp className="h-3 w-3" />
                        <span>
                          {post.predictedEngagement.score}% predicted engagement
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Content */}
                      {editingId === post.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(post.id)}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Save Changes
                            </Button>
                            <Button
                              onClick={() => setEditingId(null)}
                              size="sm"
                              variant="secondary"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>

                          {/* Hashtags */}
                          {post.hashtags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {post.hashtags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-primary-600 text-sm hover:underline cursor-pointer"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                            {post.bestPostTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Best time: {post.bestPostTime.day} {post.bestPostTime.time}</span>
                              </div>
                            )}
                            {post.mediaPrompt && (
                              <div className="flex items-center gap-1">
                                <Sparkles className="h-4 w-4" />
                                <span>Media suggestion available</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="mt-4 flex items-center gap-2 flex-wrap">
                            {post.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleApprove(post.id)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleEdit(post)}
                                  size="sm"
                                  variant="secondary"
                                >
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => handleReject(post.id)}
                                  size="sm"
                                  variant="secondary"
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {(post.status === 'approved' || post.status === 'edited') && (
                              <Button
                                onClick={() => handleCopyAndPost(post)}
                                size="sm"
                                className="bg-primary-600 hover:bg-primary-700"
                              >
                                {copiedId === post.id ? (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    Copied! Opening...
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy & Post to {PLATFORM_NAMES[post.platform]}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Recommendations & Stats */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Quick Stats
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{approvedPosts.length}</p>
                  <p className="text-xs text-green-700">Ready to Post</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{pendingPosts.length}</p>
                  <p className="text-xs text-blue-700">Pending Review</p>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                AI Insights
              </h3>
              <div className="space-y-3">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border-l-4 ${
                      rec.priority === 'high'
                        ? 'bg-red-50 border-red-400'
                        : rec.priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-400'
                          : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{rec.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduling CTA */}
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5" />
                <h3 className="font-medium">Schedule Posts</h3>
              </div>
              <p className="text-sm text-primary-100 mb-3">
                Batch schedule all approved content for optimal posting times.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="w-full bg-white text-primary-700 hover:bg-primary-50"
                disabled={approvedPosts.length === 0}
              >
                Schedule {approvedPosts.length} Posts
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
