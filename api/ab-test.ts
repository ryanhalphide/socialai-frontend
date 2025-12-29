import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Types
type VariantType = 'content' | 'hook' | 'cta' | 'hashtags' | 'tone' | 'length' | 'emoji';

interface GeneratedVariant {
  name: string;
  content: string;
  type: string;
  description: string;
  hypothesis: string;
}

// Platform context for analysis
const analyzePlatformContext: Record<string, { name: string; optimalLength: [number, number]; hashtagCount: [number, number] }> = {
  instagram: { name: 'Instagram', optimalLength: [138, 150], hashtagCount: [5, 15] },
  facebook: { name: 'Facebook', optimalLength: [40, 80], hashtagCount: [0, 3] },
  twitter: { name: 'X/Twitter', optimalLength: [71, 100], hashtagCount: [1, 3] },
  linkedin: { name: 'LinkedIn', optimalLength: [150, 300], hashtagCount: [3, 5] },
  youtube: { name: 'YouTube', optimalLength: [200, 500], hashtagCount: [3, 5] },
};

// Platform context for generation
const generatePlatformContext: Record<string, string> = {
  instagram: 'Instagram (visual-first, 2200 char limit, hashtags important, casual/authentic tone)',
  facebook: 'Facebook (longer form acceptable, community-focused, shares matter most)',
  twitter: 'X/Twitter (280 char limit, punchy, thread-friendly, real-time engagement)',
  linkedin: 'LinkedIn (professional, thought leadership, 3000 chars, fewer hashtags)',
  youtube: 'YouTube (description-focused, SEO important, call-to-action for subscribe)',
};

// Variant type prompts
const variantPrompts: Record<string, string> = {
  hook: `Create a variant with a STRONGER OPENING HOOK. The first line should:
- Create curiosity or urgency
- Use a surprising statistic, question, or bold statement
- Stop the scroll immediately
- Be platform-appropriate`,

  cta: `Create a variant with a BETTER CALL-TO-ACTION. The ending should:
- Be clear and specific about what action to take
- Create urgency or FOMO
- Make engagement easy (comment a word, share with someone, etc.)
- Feel natural, not pushy`,

  tone: `Create a variant with a DIFFERENT TONE. Options:
- More conversational and relatable
- More authoritative and expert
- More emotional and inspiring
- More humorous and entertaining
Choose the tone most likely to resonate with this platform's audience.`,

  hashtags: `Create a variant with OPTIMIZED HASHTAGS:
- Mix of popular and niche hashtags
- Relevant to the content
- Platform-appropriate quantity
- Trending where applicable`,

  length: `Create a variant with OPTIMIZED LENGTH:
- If too long, make it concise while keeping impact
- If too short, add valuable context
- Optimize for the platform's sweet spot`,

  emoji: `Create a variant with STRATEGIC EMOJI USE:
- Add emojis that enhance meaning, not distract
- Use as visual breaks in longer content
- Match the brand/tone`,

  content: `Create a COMPLETE REWRITE of the content:
- Same core message, different approach
- Different structure or angle
- Fresh perspective that might resonate differently`,
};

// System prompts
const analyzeSystemPrompt = `You are an expert social media A/B testing strategist. Analyze content and suggest specific, testable variations that could improve engagement.

For each suggestion:
1. Identify a specific element that could be improved
2. Explain why the current version might underperform
3. Propose a concrete alternative
4. Estimate the potential impact

Focus on high-impact, easily testable changes like:
- Opening hooks and attention-grabbers
- Call-to-action clarity and urgency
- Emotional resonance and relatability
- Content structure and readability
- Hashtag strategy
- Tone and voice variations

Respond ONLY with valid JSON (no markdown):
{
  "suggestions": [
    {
      "type": "hook|cta|tone|hashtags|length|emoji|content",
      "original": "The specific part being improved",
      "suggested": "The improved version",
      "reasoning": "Why this change could help",
      "expectedImpact": "high|medium|low",
      "confidence": 0.0-1.0
    }
  ],
  "recommendedTests": [
    {
      "name": "Test name",
      "description": "What we're testing",
      "variants": [
        {
          "name": "Variant name",
          "content": "Full variant content",
          "hypothesis": "Why this might win"
        }
      ]
    }
  ],
  "overallAssessment": "Brief summary of the content's strengths and weaknesses for A/B testing"
}`;

const generateSystemPrompt = `You are an expert social media copywriter and A/B testing specialist. Your task is to create high-converting content variants for split testing.

For each variant:
1. Make meaningful changes that could impact engagement
2. Keep the core message/intent intact
3. Provide a clear hypothesis for why this variant might perform better
4. Ensure it's appropriate for the specified platform

IMPORTANT RULES:
- Each variant must be significantly different from the original
- Changes should be testable hypotheses, not random edits
- Stay within platform character limits
- Maintain brand voice while testing variations

Respond ONLY with valid JSON in this exact format (no markdown):
{
  "variants": [
    {
      "name": "Short descriptive name",
      "content": "The full variant content",
      "type": "variant type",
      "description": "What was changed",
      "hypothesis": "Why this might perform better"
    }
  ]
}`;

// Analyze content for A/B testing opportunities
async function analyzeContent(content: string, platform: string) {
  const platformInfo = analyzePlatformContext[platform] || analyzePlatformContext.instagram;
  const hashtagsInContent = content.match(/#\w+/g) || [];

  const userPrompt = `Analyze this ${platformInfo.name} post for A/B testing opportunities:

CONTENT:
"""
${content}
"""

METADATA:
- Platform: ${platformInfo.name}
- Character count: ${content.length}
- Optimal length for ${platformInfo.name}: ${platformInfo.optimalLength[0]}-${platformInfo.optimalLength[1]} characters
- Hashtags used: ${hashtagsInContent.length} (optimal: ${platformInfo.hashtagCount[0]}-${platformInfo.hashtagCount[1]})
- Has question: ${content.includes('?')}
- Has CTA: ${/comment|share|follow|click|link|bio|dm|tag|save/i.test(content)}
- Has emoji: ${/\p{Emoji}/u.test(content)}

Provide:
1. 3-5 specific improvement suggestions with testable alternatives
2. 2-3 recommended A/B tests with full variant content
3. An overall assessment of the content's testing potential`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: analyzeSystemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Groq API error:', error);
    throw new Error('Failed to analyze content');
  }

  const data = await response.json();
  const responseText = data.choices[0]?.message?.content || '';

  let analysis;
  try {
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    analysis = JSON.parse(cleanedResponse);
  } catch {
    analysis = {
      suggestions: [
        {
          type: 'hook',
          original: content.split('\n')[0] || content.slice(0, 50),
          suggested: 'Consider starting with a question or surprising fact',
          reasoning: 'Strong hooks increase scroll-stopping power',
          expectedImpact: 'high',
          confidence: 0.7,
        },
        {
          type: 'cta',
          original: 'Current ending',
          suggested: 'Add a clear call-to-action like "Comment below" or "Share if you agree"',
          reasoning: 'Explicit CTAs can significantly boost engagement',
          expectedImpact: 'high',
          confidence: 0.8,
        },
      ],
      recommendedTests: [
        {
          name: 'Hook Test',
          description: 'Test different opening lines',
          variants: [
            {
              name: 'Question Hook',
              content: `What if I told you...\n\n${content}`,
              hypothesis: 'Questions create curiosity and engagement',
            },
          ],
        },
      ],
      overallAssessment: 'Content has potential for A/B testing. Consider testing hook variations and call-to-action strength.',
    };
  }

  return {
    ...analysis,
    originalContent: content,
    platform,
    analyzedAt: new Date().toISOString(),
  };
}

// Generate variants for A/B testing
async function generateVariants(content: string, platform: string, types: VariantType[]) {
  const platformInfo = generatePlatformContext[platform] || generatePlatformContext.instagram;

  const variantInstructions = types
    .map((type, index) => `VARIANT ${index + 1} (${type}):\n${variantPrompts[type] || variantPrompts.content}`)
    .join('\n\n');

  const userPrompt = `Generate ${types.length} A/B test variants for this ${platform.toUpperCase()} post.

PLATFORM CONTEXT: ${platformInfo}

ORIGINAL CONTENT:
"""
${content}
"""

CHARACTER COUNT: ${content.length}

VARIANTS TO CREATE:
${variantInstructions}

Generate exactly ${types.length} variants, one for each type specified. Each variant should be a complete, ready-to-publish version of the content.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: generateSystemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Groq API error:', error);
    throw new Error('Failed to generate variants');
  }

  const data = await response.json();
  const responseText = data.choices[0]?.message?.content || '';

  let variants: GeneratedVariant[];
  try {
    const cleanedResponse = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleanedResponse);
    variants = parsed.variants || [];
    variants = variants.map((v, i) => ({
      ...v,
      type: v.type || types[i] || 'content',
    }));
  } catch {
    variants = types.map((type) => ({
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Variant`,
      content: content,
      type,
      description: `Variant focusing on ${type}`,
      hypothesis: `Testing ${type} optimization`,
    }));
  }

  return {
    variants,
    platform,
    originalContent: content,
    generatedAt: new Date().toISOString(),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Groq API key not configured' });
  }

  try {
    const { action, content, platform = 'instagram', types = ['hook', 'cta', 'tone'] } = req.body;

    if (!content || content.trim().length < 20) {
      return res.status(400).json({ error: 'Content must be at least 20 characters' });
    }

    if (action === 'analyze') {
      const result = await analyzeContent(content, platform);
      return res.status(200).json(result);
    } else if (action === 'generate') {
      const result = await generateVariants(content, platform, types);
      return res.status(200).json(result);
    } else {
      return res.status(400).json({ error: 'Invalid action. Use "analyze" or "generate"' });
    }
  } catch (error) {
    console.error('Error in A/B test handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
