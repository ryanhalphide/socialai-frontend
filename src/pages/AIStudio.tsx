import { useState } from 'react';
import {
  Sparkles,
  Image,
  Video,
  FileText,
  Hash,
  Loader2,
  Copy,
  Check,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

type GeneratorTab = 'text' | 'image' | 'video' | 'hashtags';
type Platform = 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube';
type Tone = 'professional' | 'casual' | 'humorous' | 'inspiring';
type ImageStyle = 'realistic' | 'artistic' | 'minimalist' | 'vibrant' | 'professional';
type AspectRatio = '1:1' | '16:9' | '9:16' | '4:5';

export function AIStudio() {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('text');

  // Text generation state
  const [textPrompt, setTextPrompt] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [tone, setTone] = useState<Tone>('professional');
  const [generatedText, setGeneratedText] = useState('');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState<ImageStyle>('professional');
  const [imageAspectRatio, setImageAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Video generation state
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoDuration, setVideoDuration] = useState<5 | 8>(5);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Hashtag generation state
  const [hashtagPrompt, setHashtagPrompt] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState('');
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [hashtagError, setHashtagError] = useState<string | null>(null);

  const handleGenerateText = async () => {
    if (!textPrompt.trim()) return;

    setIsGeneratingText(true);
    setTextError(null);

    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textPrompt,
          platform,
          contentType: 'post',
          tone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate text');
      }

      const data = await response.json();
      setGeneratedText(data.content);
    } catch (error) {
      setTextError(error instanceof Error ? error.message : 'Failed to generate text');
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateHashtags = async () => {
    if (!hashtagPrompt.trim()) return;

    setIsGeneratingHashtags(true);
    setHashtagError(null);

    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: hashtagPrompt,
          platform: 'instagram',
          contentType: 'hashtags',
          tone: 'professional',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate hashtags');
      }

      const data = await response.json();
      setGeneratedHashtags(data.content);
    } catch (error) {
      setHashtagError(error instanceof Error ? error.message : 'Failed to generate hashtags');
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;

    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: imageStyle,
          aspectRatio: imageAspectRatio,
          model: 'flux',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;

    setIsGeneratingVideo(true);
    setVideoError(null);
    setVideoStatus('Starting video generation...');

    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: videoDuration,
          aspectRatio: videoAspectRatio,
          provider: 'replicate',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const data = await response.json();
      setVideoStatus(`Video generation started! ${data.message}`);
    } catch (error) {
      setVideoError(error instanceof Error ? error.message : 'Failed to generate video');
      setVideoStatus('');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: 'text' as const, label: 'Text', icon: FileText },
    { id: 'image' as const, label: 'Image', icon: Image },
    { id: 'video' as const, label: 'Video', icon: Video },
    { id: 'hashtags' as const, label: 'Hashtags', icon: Hash },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary-600" />
          AI Studio
        </h1>
        <p className="text-gray-500">Generate content, images, videos, and hashtags with AI</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Text Generator */}
      {activeTab === 'text' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Generate Post</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What would you like to post about?
              </label>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="e.g., Announce our new sustainable product line launching next week"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="twitter">X (Twitter)</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="youtube">YouTube</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="humorous">Humorous</option>
                  <option value="inspiring">Inspiring</option>
                </select>
              </div>
            </div>

            {textError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {textError}
              </p>
            )}

            <Button
              onClick={handleGenerateText}
              disabled={isGeneratingText || !textPrompt.trim()}
              className="w-full"
            >
              {isGeneratingText ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated Content</h2>
              {generatedText && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedText)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleGenerateText}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="min-h-[200px] p-4 bg-gray-50 rounded-lg">
              {generatedText ? (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{generatedText}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Your generated content will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Generator */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Generate Image</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe your image
              </label>
              <textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="e.g., A modern office workspace with plants and natural lighting"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                <select
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value as ImageStyle)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="professional">Professional</option>
                  <option value="realistic">Realistic</option>
                  <option value="artistic">Artistic</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="vibrant">Vibrant</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label>
                <select
                  value={imageAspectRatio}
                  onChange={(e) => setImageAspectRatio(e.target.value as AspectRatio)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="1:1">Square (1:1)</option>
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                  <option value="4:5">Instagram (4:5)</option>
                </select>
              </div>
            </div>

            {imageError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {imageError}
              </p>
            )}

            <Button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || !imagePrompt.trim()}
              className="w-full"
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating (30-60s)...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated Image</h2>
              {generatedImageUrl && (
                <a
                  href={generatedImageUrl}
                  download="generated-image.png"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
            <div className="min-h-[300px] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
              {generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt="Generated"
                  className="max-w-full max-h-[400px] object-contain rounded-lg"
                />
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Your generated image will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Generator */}
      {activeTab === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Generate Video</h2>
            <p className="text-sm text-gray-500">
              Video generation takes 1-2 minutes. The video will be available for download when ready.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Describe your video
              </label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                placeholder="e.g., Smooth camera pan across a sunset beach with gentle waves"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(Number(e.target.value) as 5 | 8)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value={5}>5 seconds</option>
                  <option value={8}>8 seconds</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aspect Ratio</label>
                <select
                  value={videoAspectRatio}
                  onChange={(e) => setVideoAspectRatio(e.target.value as '16:9' | '9:16' | '1:1')}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none"
                >
                  <option value="16:9">Landscape (16:9)</option>
                  <option value="9:16">Portrait (9:16)</option>
                  <option value="1:1">Square (1:1)</option>
                </select>
              </div>
            </div>

            {videoError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {videoError}
              </p>
            )}

            <Button
              onClick={handleGenerateVideo}
              disabled={isGeneratingVideo || !videoPrompt.trim()}
              className="w-full"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Generation...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Generate Video
                </>
              )}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Video Status</h2>
            <div className="min-h-[300px] bg-gray-50 rounded-lg flex items-center justify-center p-6">
              {videoStatus ? (
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto text-primary-600 animate-spin" />
                  <p className="text-sm text-gray-600">{videoStatus}</p>
                  <p className="text-xs text-gray-400">
                    Video generation typically takes 60-120 seconds. Check back shortly!
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic text-center">
                  Enter a prompt and click Generate to create your video.
                  <br />
                  <span className="text-xs">Note: Video generation is resource-intensive and may take 1-2 minutes.</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hashtag Generator */}
      {activeTab === 'hashtags' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Generate Hashtags</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What is your post about?
              </label>
              <textarea
                value={hashtagPrompt}
                onChange={(e) => setHashtagPrompt(e.target.value)}
                placeholder="e.g., Fitness motivation, morning workout routine, healthy lifestyle"
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
              />
            </div>

            {hashtagError && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {hashtagError}
              </p>
            )}

            <Button
              onClick={handleGenerateHashtags}
              disabled={isGeneratingHashtags || !hashtagPrompt.trim()}
              className="w-full"
            >
              {isGeneratingHashtags ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Hash className="h-4 w-4 mr-2" />
                  Generate Hashtags
                </>
              )}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated Hashtags</h2>
              {generatedHashtags && (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleCopy(generatedHashtags)}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleGenerateHashtags}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="min-h-[200px] p-4 bg-gray-50 rounded-lg">
              {generatedHashtags ? (
                <p className="text-sm text-primary-600 whitespace-pre-wrap">{generatedHashtags}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Your generated hashtags will appear here...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
