const VISUAL_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class NFTDiscovery {
  constructor(options = {}) {
    this.hiroBaseUrl = 'https://api.hiro.so/ordinals/v1';
    this.hiroApiKey = options.hiroApiKey || '';
    this.pipeBaseUrl = 'https://pipe.trac.network/api/v1';
    this._retryDelayMs = 1000;
    this._maxRetries = 3;
  }

  _hiroHeaders() {
    const h = { 'Accept': 'application/json' };
    if (this.hiroApiKey) h['x-api-key'] = this.hiroApiKey;
    return h;
  }

  async _fetchWithRetry(url, headers = {}, retries = 0) {
    try {
      const res = await fetch(url, { headers });
      if (res.status === 429) {
        if (retries >= this._maxRetries) return null;
        const delay = this._retryDelayMs * Math.pow(2, retries);
        console.log(`[discovery] rate limited, retrying in ${delay}ms...`);
        await sleep(delay);
        return this._fetchWithRetry(url, headers, retries + 1);
      }
      if (!res.ok) {
        console.error(`[discovery] HTTP ${res.status} for ${url}`);
        return null;
      }
      return res;
    } catch (e) {
      console.error(`[discovery] fetch error: ${e?.message ?? e}`);
      return null;
    }
  }

  async fetchRecentInscriptions(limit = 20, offset = 0) {
    const mimeParams = VISUAL_TYPES.map((t) => `mime_type=${encodeURIComponent(t)}`).join('&');
    const url = `${this.hiroBaseUrl}/inscriptions?${mimeParams}&order=desc&limit=${limit}&offset=${offset}`;
    const res = await this._fetchWithRetry(url, this._hiroHeaders());
    if (!res) return [];
    try {
      const data = await res.json();
      return (data.results || []).filter((i) => VISUAL_TYPES.includes(i.content_type));
    } catch (e) {
      console.error('[discovery] parse error:', e?.message ?? e);
      return [];
    }
  }

  async fetchInscription(id) {
    const url = `${this.hiroBaseUrl}/inscriptions/${encodeURIComponent(id)}`;
    const res = await this._fetchWithRetry(url, this._hiroHeaders());
    if (!res) return null;
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async fetchInscriptionContentBase64(id) {
    const url = `${this.hiroBaseUrl}/inscriptions/${encodeURIComponent(id)}/content`;
    const res = await this._fetchWithRetry(url, this._hiroHeaders());
    if (!res) return null;
    try {
      const buf = await res.arrayBuffer();
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(buf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      console.error('[discovery] content fetch error:', e?.message ?? e);
      return null;
    }
  }

  async fetchPipeDeployments(limit = 20) {
    try {
      const url = `${this.pipeBaseUrl}/pipe/deployments?limit=${limit}&offset=0`;
      const res = await this._fetchWithRetry(url);
      if (!res) return [];
      const data = await res.json();
      return data.deployments || data.results || [];
    } catch (e) {
      console.warn('[discovery] Pipe/TAP API unavailable:', e?.message ?? e);
      return [];
    }
  }

  normalizeOrdinal(inscription) {
    if (!inscription) return null;
    return {
      id: inscription.id,
      chain: 'ordinals',
      inscriptionNumber: inscription.number,
      contentType: inscription.content_type,
      contentUrl: `${this.hiroBaseUrl}/inscriptions/${inscription.id}/content`,
      title: `Inscription #${inscription.number}`,
      collection: null,
      satRarity: inscription.sat_rarity || 'common',
      aiScore: null,
      aiAnalysis: null,
      marketplaceUrl: `https://ordinals.com/inscription/${inscription.id}`,
      discoveredAt: new Date().toISOString(),
      analyzedAt: null,
    };
  }

  normalizePipe(deployment) {
    if (!deployment) return null;
    return {
      id: deployment.inscription_id || deployment.id,
      chain: 'pipe',
      inscriptionNumber: null,
      contentType: deployment.content_type || 'unknown',
      contentUrl: deployment.inscription_id
        ? `https://ordinals.com/content/${deployment.inscription_id}`
        : null,
      title: deployment.ticker || deployment.name || 'Pipe Token',
      collection: deployment.ticker || null,
      satRarity: null,
      aiScore: null,
      aiAnalysis: null,
      marketplaceUrl: deployment.inscription_id
        ? `https://ordinals.com/inscription/${deployment.inscription_id}`
        : null,
      discoveredAt: new Date().toISOString(),
      analyzedAt: null,
    };
  }
}
