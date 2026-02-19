'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScBridgeClient } from '@/lib/sc-bridge';
import type { CuratedNFT, ConnectionState, GalleryFilters } from '@/lib/types';

// Demo data for when SC-Bridge is not connected
const DEMO_NFTS: CuratedNFT[] = Array.from({ length: 12 }, (_, i) => ({
  id: `demo-${i}`,
  chain: i % 3 === 0 ? 'pipe' as const : 'ordinals' as const,
  inscriptionNumber: 70000000 + i * 1337,
  contentType: 'image/png',
  contentUrl: `https://picsum.photos/seed/nft${i}/400/400`,
  title: `Inscription #${70000000 + i * 1337}`,
  collection: null,
  satRarity: ['common', 'uncommon', 'rare', 'epic'][i % 4],
  aiScore: Math.floor(40 + Math.random() * 55),
  aiAnalysis: {
    description: 'A striking digital composition featuring bold geometric forms and a vivid color palette that evokes both depth and movement.',
    style: ['pixel_art', 'generative', 'abstract', 'illustration', 'photography'][i % 5],
    dimensions: {
      quality: Math.floor(50 + Math.random() * 45),
      originality: Math.floor(50 + Math.random() * 45),
      technique: Math.floor(50 + Math.random() * 45),
      appeal: Math.floor(50 + Math.random() * 45),
    },
    tags: ['abstract', 'colorful', 'geometric', 'digital', 'bold'].slice(0, 3 + (i % 3)),
    curatorNote: 'Notable for its confident use of color and compositional tension.',
  },
  marketplaceUrl: `https://ordinals.com/inscription/demo-${i}`,
  discoveredAt: new Date(Date.now() - i * 3600000).toISOString(),
  analyzedAt: new Date(Date.now() - i * 3600000 + 5000).toISOString(),
}));

export function useScBridge() {
  const clientRef = useRef<ScBridgeClient | null>(null);
  const [nfts, setNfts] = useState<CuratedNFT[]>(DEMO_NFTS);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<GalleryFilters>({ sort: 'newest' });

  useEffect(() => {
    const client = new ScBridgeClient();
    clientRef.current = client;

    client.onStateChange((state) => {
      setConnectionState(state);
      if (state === 'connected') {
        // Fetch gallery data via CLI
        client.sendCli('/tg_gallery --limit 100').then((result: unknown) => {
          const r = result as Record<string, unknown>;
          if (r.output) {
            try {
              const parsed = JSON.parse(
                Array.isArray(r.output) ? r.output.join('') : String(r.output)
              );
              if (parsed.data && Array.isArray(parsed.data)) {
                setNfts(parsed.data);
              }
            } catch { /* ignore */ }
          }
        });
      }
    });

    client.onNftUpdate((newNfts) => {
      setNfts((prev) => {
        const existing = new Map(prev.map((n) => [n.id, n]));
        for (const nft of newNfts) {
          existing.set(nft.id, nft);
        }
        return Array.from(existing.values());
      });
    });

    client.connect();
    return () => { client.disconnect(); };
  }, []);

  const filteredNfts = useCallback(() => {
    let results = [...nfts];
    if (filters.chain) results = results.filter((n) => n.chain === filters.chain);
    if (filters.minScore != null) results = results.filter((n) => n.aiScore !== null && n.aiScore >= (filters.minScore ?? 0));
    if (filters.style) results = results.filter((n) => n.aiAnalysis?.style === filters.style);

    if (filters.sort === 'score') results.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
    else if (filters.sort === 'oldest') results.sort((a, b) => new Date(a.discoveredAt).getTime() - new Date(b.discoveredAt).getTime());
    else results.sort((a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime());

    return results;
  }, [nfts, filters]);

  const fetchNftDetail = useCallback(async (id: string): Promise<CuratedNFT | null> => {
    // First check local cache
    const cached = nfts.find((n) => n.id === id);
    if (cached) return cached;
    // Try via CLI
    if (clientRef.current && connectionState === 'connected') {
      setIsLoading(true);
      const result = await clientRef.current.sendCli(`/tg_rate --id "${id}"`);
      setIsLoading(false);
      const r = result as Record<string, unknown>;
      if (r.output) {
        try {
          const parsed = JSON.parse(
            Array.isArray(r.output) ? r.output.join('') : String(r.output)
          );
          if (parsed.data?.[0]) return parsed.data[0];
        } catch { /* ignore */ }
      }
    }
    return null;
  }, [nfts, connectionState]);

  return {
    nfts: filteredNfts(),
    allNfts: nfts,
    connectionState,
    isLoading,
    filters,
    setFilters,
    fetchNftDetail,
  };
}
