import fs from 'fs';
import path from 'path';

export class GalleryStore {
  constructor(storeDir, options = {}) {
    this.maxItems = options.maxCuratedNfts || 1000;
    this.storeDir = storeDir;
    this.filePath = path.join(storeDir, 'curated-nfts.json');
    this.nfts = new Map();
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          for (const nft of arr) {
            if (nft && nft.id) this.nfts.set(nft.id, nft);
          }
        }
      }
    } catch (_e) {
      // Start fresh if corrupted
    }
  }

  _save() {
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const arr = Array.from(this.nfts.values());
      fs.writeFileSync(this.filePath, JSON.stringify(arr, null, 2));
    } catch (e) {
      console.error('[gallery-store] save error:', e?.message ?? e);
    }
  }

  has(id) {
    return this.nfts.has(id);
  }

  getById(id) {
    return this.nfts.get(id) || null;
  }

  getAll() {
    return Array.from(this.nfts.values());
  }

  getFiltered(filters = {}) {
    let results = this.getAll();

    if (filters.chain) {
      results = results.filter((n) => n.chain === filters.chain);
    }
    if (filters.minScore !== undefined && filters.minScore !== null) {
      results = results.filter((n) => n.aiScore !== null && n.aiScore >= filters.minScore);
    }
    if (filters.style) {
      results = results.filter(
        (n) => n.aiAnalysis && n.aiAnalysis.style === filters.style
      );
    }
    if (filters.sort === 'score') {
      results.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    } else if (filters.sort === 'oldest') {
      results.sort((a, b) => new Date(a.discoveredAt) - new Date(b.discoveredAt));
    } else {
      // Default: newest first
      results.sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));
    }

    const limit = filters.limit || 50;
    return results.slice(0, limit);
  }

  getTrending(limit = 10) {
    return this.getFiltered({ sort: 'score', limit });
  }

  add(nft) {
    if (!nft || !nft.id) return;
    this.nfts.set(nft.id, nft);
    this._prune();
    this._save();
  }

  addBatch(nfts) {
    for (const nft of nfts) {
      if (nft && nft.id) this.nfts.set(nft.id, nft);
    }
    this._prune();
    this._save();
  }

  _prune() {
    if (this.nfts.size <= this.maxItems) return;
    const sorted = Array.from(this.nfts.values()).sort(
      (a, b) => new Date(a.discoveredAt) - new Date(b.discoveredAt)
    );
    const toRemove = sorted.slice(0, this.nfts.size - this.maxItems);
    for (const nft of toRemove) {
      this.nfts.delete(nft.id);
    }
  }

  getStats() {
    const all = this.getAll();
    const withScore = all.filter((n) => n.aiScore !== null);
    const avgScore =
      withScore.length > 0
        ? Math.round(withScore.reduce((s, n) => s + n.aiScore, 0) / withScore.length)
        : 0;
    return {
      total: all.length,
      analyzed: withScore.length,
      avgScore,
      chains: [...new Set(all.map((n) => n.chain))],
    };
  }
}
