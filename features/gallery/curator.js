const CURATION_PROMPT = `You are an expert NFT art curator and critic analyzing Bitcoin Ordinals inscriptions.

METADATA:
- Inscription ID: {id}
- Inscription #: {number}
- Sat Rarity: {satRarity}
- Content Type: {contentType}

Analyze this artwork and return ONLY a JSON object (no markdown, no explanation):
{
  "description": "2-3 sentence visual description of what you see",
  "style": "one of: pixel_art, generative, photography, illustration, 3d, abstract, typography, collage, mixed",
  "dimensions": {
    "quality": <1-100 score for technical quality>,
    "originality": <1-100 score for creativity and originality>,
    "technique": <1-100 score for artistic technique>,
    "appeal": <1-100 score for visual appeal and collector interest>
  },
  "tags": ["up to 5 descriptive tags"],
  "curatorNote": "1 sentence curatorial opinion"
}`;

function buildPrompt(metadata) {
  return CURATION_PROMPT
    .replace('{id}', metadata.id || 'unknown')
    .replace('{number}', metadata.inscriptionNumber || 'unknown')
    .replace('{satRarity}', metadata.satRarity || 'unknown')
    .replace('{contentType}', metadata.contentType || 'unknown');
}

function computeOverallScore(dimensions) {
  if (!dimensions) return null;
  const { quality = 0, originality = 0, technique = 0, appeal = 0 } = dimensions;
  return Math.round(quality * 0.3 + originality * 0.25 + technique * 0.25 + appeal * 0.2);
}

function sanitizeTheme(theme) {
  if (!theme) return '';
  return String(theme)
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .trim();
}

// --- Provider implementations ---

async function callAnthropic(imageBase64, mediaType, prompt, config) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.anthropic_api_key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.anthropic_model || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callOpenAI(imageBase64, mediaType, prompt, config) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openai_api_key}`,
    },
    body: JSON.stringify({
      model: config.openai_model || 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${imageBase64}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenAI API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOpenRouter(imageBase64, mediaType, prompt, config) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openrouter_api_key}`,
    },
    body: JSON.stringify({
      model: config.openrouter_model || 'anthropic/claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${imageBase64}` },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`OpenRouter API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callOllama(imageBase64, mediaType, prompt, config) {
  const baseUrl = config.ollama_base_url || 'http://localhost:11434';
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama_model || 'llava',
      stream: false,
      messages: [
        {
          role: 'user',
          content: prompt,
          images: [imageBase64],
        },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Ollama API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.message?.content || '';
}

export class NFTCurator {
  constructor(config = {}) {
    this.config = config;
    this.provider = config.ai_provider || 'anthropic';
  }

  async analyzeNFT(imageBase64, mediaType, metadata) {
    const prompt = buildPrompt(metadata);
    let responseText = '';

    try {
      switch (this.provider) {
        case 'anthropic':
          responseText = await callAnthropic(imageBase64, mediaType, prompt, this.config);
          break;
        case 'openai':
          responseText = await callOpenAI(imageBase64, mediaType, prompt, this.config);
          break;
        case 'openrouter':
          responseText = await callOpenRouter(imageBase64, mediaType, prompt, this.config);
          break;
        case 'ollama':
          responseText = await callOllama(imageBase64, mediaType, prompt, this.config);
          break;
        default:
          throw new Error(`Unknown AI provider: ${this.provider}`);
      }
    } catch (e) {
      console.error(`[curator] ${this.provider} API error:`, e?.message ?? e);
      return null;
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = responseText.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();
      // Also try to find a raw JSON object
      const objMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objMatch) jsonStr = objMatch[0];

      const analysis = JSON.parse(jsonStr);
      const overallScore = computeOverallScore(analysis.dimensions);
      return {
        ...analysis,
        overallScore,
      };
    } catch (e) {
      console.error('[curator] failed to parse AI response:', e?.message ?? e);
      console.error('[curator] raw response:', responseText.slice(0, 200));
      return null;
    }
  }
}

export { sanitizeTheme, computeOverallScore };
