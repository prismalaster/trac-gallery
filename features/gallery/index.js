import { GalleryStore } from './store.js';
import { NFTDiscovery } from './discovery.js';
import { NFTCurator, sanitizeTheme } from './curator.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class Gallery {
  constructor(peer, options = {}) {
    this.peer = peer;
    this.config = options.config || {};
    this.galleryChannel = options.galleryChannel || '0000tracgallery';
    this.discoveryIntervalMs = this.config.discovery_interval_ms || 900_000; // 15 min
    this.discoveryBatchSize = this.config.discovery_batch_size || 20;
    this.running = false;

    // Rate limit peer commands: Map<pubkey, lastRequestTimestamp>
    this._peerRateLimit = new Map();
    this._peerRateLimitMs = 600_000; // 10 min

    // Initialize sub-components
    this.store = new GalleryStore(options.storeDir, {
      maxCuratedNfts: this.config.max_curated_nfts || 1000,
    });
    this.discovery = new NFTDiscovery({
      hiroApiKey: this.config.hiro_api_key || '',
    });
    this.curator = new NFTCurator(this.config);

    console.log(`[gallery] initialized (provider: ${this.curator.provider}, interval: ${this.discoveryIntervalMs}ms, batch: ${this.discoveryBatchSize})`);
  }

  async start() {
    this.running = true;
    console.log('[gallery] starting discovery loop...');

    // Run first discovery immediately
    await this._discoverAndCurate();

    // Then loop
    while (this.running) {
      await sleep(this.discoveryIntervalMs);
      if (!this.running) break;
      await this._discoverAndCurate();
    }
  }

  stop() {
    this.running = false;
    console.log('[gallery] stopped.');
  }

  // --- Discovery loop ---

  async _discoverAndCurate() {
    console.log('[gallery] running discovery cycle...');
    try {
      // Fetch recent Ordinals inscriptions
      const inscriptions = await this.discovery.fetchRecentInscriptions(
        this.discoveryBatchSize,
        0
      );

      // Filter out already-curated
      const newInscriptions = inscriptions.filter((i) => !this.store.has(i.id));
      if (newInscriptions.length === 0) {
        console.log('[gallery] no new inscriptions found.');
        return;
      }
      console.log(`[gallery] found ${newInscriptions.length} new inscriptions.`);

      const newlyCurated = [];

      for (const inscription of newInscriptions) {
        if (!this.running) break;

        const nft = this.discovery.normalizeOrdinal(inscription);
        if (!nft) continue;

        // Fetch image content for AI analysis
        const imageBase64 = await this.discovery.fetchInscriptionContentBase64(inscription.id);
        if (imageBase64) {
          const analysis = await this.curator.analyzeNFT(
            imageBase64,
            inscription.content_type,
            nft
          );
          if (analysis) {
            nft.aiScore = analysis.overallScore;
            nft.aiAnalysis = {
              description: analysis.description,
              style: analysis.style,
              dimensions: analysis.dimensions,
              tags: analysis.tags,
              curatorNote: analysis.curatorNote,
            };
            nft.analyzedAt = new Date().toISOString();
          }
        }

        this.store.add(nft);
        newlyCurated.push(nft);
        console.log(`[gallery] curated: ${nft.title} (score: ${nft.aiScore ?? 'N/A'})`);
      }

      // Try fetching Pipe/TAP NFTs (best effort)
      try {
        const pipeDeployments = await this.discovery.fetchPipeDeployments(5);
        for (const dep of pipeDeployments) {
          if (!this.running) break;
          const nft = this.discovery.normalizePipe(dep);
          if (nft && !this.store.has(nft.id)) {
            this.store.add(nft);
            newlyCurated.push(nft);
          }
        }
      } catch (_e) {
        // Pipe/TAP is best-effort
      }

      // Broadcast newly curated NFTs to sidechannel
      if (newlyCurated.length > 0) {
        this._broadcast({
          type: 'tracgallery_curated',
          data: newlyCurated,
          count: newlyCurated.length,
          timestamp: new Date().toISOString(),
        });
      }

      console.log(`[gallery] cycle complete. ${newlyCurated.length} new NFTs curated. Total: ${this.store.getAll().length}`);
    } catch (e) {
      console.error('[gallery] discovery error:', e?.message ?? e);
    }
  }

  // --- Sidechannel command handlers ---

  async handleCommand(command, args, fromPubkey) {
    // Rate limiting
    if (fromPubkey && this._isRateLimited(fromPubkey)) {
      return { type: 'tracgallery_error', error: 'Rate limited. Try again later.' };
    }

    const cmd = String(command).toLowerCase().trim();
    switch (cmd) {
      case 'gallery':
        return this.handleGalleryCommand(args);
      case 'trending':
        return this.handleTrendingCommand(args);
      case 'rate':
        if (fromPubkey) this._recordRequest(fromPubkey);
        return await this.handleRateCommand(args);
      case 'curate':
        if (fromPubkey) this._recordRequest(fromPubkey);
        return await this.handleCurateCommand(args);
      case 'status':
        return this.handleStatusCommand();
      default:
        return { type: 'tracgallery_error', error: `Unknown command: ${cmd}` };
    }
  }

  handleGalleryCommand(args = {}) {
    const filters = {
      chain: args.chain || undefined,
      minScore: args.min_score !== undefined ? Number(args.min_score) : undefined,
      style: args.style || undefined,
      sort: args.sort || 'newest',
      limit: args.limit ? Number(args.limit) : 50,
    };
    const nfts = this.store.getFiltered(filters);
    return {
      type: 'tracgallery_response',
      command: 'gallery',
      data: nfts,
      count: nfts.length,
      timestamp: new Date().toISOString(),
    };
  }

  handleTrendingCommand(args = {}) {
    const limit = args.limit ? Number(args.limit) : 10;
    const nfts = this.store.getTrending(limit);
    return {
      type: 'tracgallery_response',
      command: 'trending',
      data: nfts,
      count: nfts.length,
      timestamp: new Date().toISOString(),
    };
  }

  async handleRateCommand(args = {}) {
    const nftId = args.id;
    if (!nftId) {
      return { type: 'tracgallery_error', error: 'Missing --id parameter.' };
    }

    // Check if already curated
    let nft = this.store.getById(nftId);
    if (nft && nft.aiScore !== null) {
      return {
        type: 'tracgallery_response',
        command: 'rate',
        data: [nft],
        timestamp: new Date().toISOString(),
      };
    }

    // Fetch and analyze
    const inscription = await this.discovery.fetchInscription(nftId);
    if (!inscription) {
      return { type: 'tracgallery_error', error: 'Inscription not found.' };
    }

    nft = this.discovery.normalizeOrdinal(inscription);
    const imageBase64 = await this.discovery.fetchInscriptionContentBase64(nftId);
    if (imageBase64) {
      const analysis = await this.curator.analyzeNFT(
        imageBase64,
        inscription.content_type,
        nft
      );
      if (analysis) {
        nft.aiScore = analysis.overallScore;
        nft.aiAnalysis = {
          description: analysis.description,
          style: analysis.style,
          dimensions: analysis.dimensions,
          tags: analysis.tags,
          curatorNote: analysis.curatorNote,
        };
        nft.analyzedAt = new Date().toISOString();
      }
    }

    this.store.add(nft);

    return {
      type: 'tracgallery_response',
      command: 'rate',
      data: [nft],
      timestamp: new Date().toISOString(),
    };
  }

  async handleCurateCommand(args = {}) {
    const theme = sanitizeTheme(args.theme);
    if (!theme) {
      return { type: 'tracgallery_error', error: 'Missing or invalid --theme parameter.' };
    }

    // For themed curation, fetch recent inscriptions and let AI filter by theme
    console.log(`[gallery] on-demand curation for theme: "${theme}"`);
    const inscriptions = await this.discovery.fetchRecentInscriptions(10, 0);
    const curated = [];

    for (const inscription of inscriptions) {
      if (this.store.has(inscription.id)) continue;
      const nft = this.discovery.normalizeOrdinal(inscription);
      const imageBase64 = await this.discovery.fetchInscriptionContentBase64(inscription.id);
      if (imageBase64) {
        const analysis = await this.curator.analyzeNFT(
          imageBase64,
          inscription.content_type,
          nft
        );
        if (analysis) {
          nft.aiScore = analysis.overallScore;
          nft.aiAnalysis = {
            description: analysis.description,
            style: analysis.style,
            dimensions: analysis.dimensions,
            tags: analysis.tags,
            curatorNote: analysis.curatorNote,
          };
          nft.analyzedAt = new Date().toISOString();
        }
      }
      this.store.add(nft);
      curated.push(nft);
    }

    // Broadcast results
    if (curated.length > 0) {
      this._broadcast({
        type: 'tracgallery_response',
        command: 'curate',
        theme,
        data: curated,
        count: curated.length,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      type: 'tracgallery_response',
      command: 'curate',
      theme,
      data: curated,
      count: curated.length,
      timestamp: new Date().toISOString(),
    };
  }

  handleStatusCommand() {
    const stats = this.store.getStats();
    return {
      type: 'tracgallery_response',
      command: 'status',
      data: {
        ...stats,
        running: this.running,
        provider: this.curator.provider,
        galleryChannel: this.galleryChannel,
        discoveryIntervalMs: this.discoveryIntervalMs,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // --- Broadcast to sidechannel ---

  _broadcast(message) {
    try {
      if (this.peer?.sidechannel) {
        const sent = this.peer.sidechannel.broadcast(
          this.galleryChannel,
          JSON.stringify(message)
        );
        if (!sent) {
          console.warn('[gallery] broadcast failed (channel not ready or owner-only).');
        }
      }
    } catch (e) {
      console.error('[gallery] broadcast error:', e?.message ?? e);
    }
  }

  // --- Rate limiting ---

  _isRateLimited(pubkey) {
    const last = this._peerRateLimit.get(pubkey);
    if (!last) return false;
    return Date.now() - last < this._peerRateLimitMs;
  }

  _recordRequest(pubkey) {
    this._peerRateLimit.set(pubkey, Date.now());
  }
}
