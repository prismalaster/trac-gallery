export interface AIDimensions {
  quality: number;
  originality: number;
  technique: number;
  appeal: number;
}

export interface AIAnalysis {
  description: string;
  style: string;
  dimensions: AIDimensions;
  tags: string[];
  curatorNote: string;
}

export interface CuratedNFT {
  id: string;
  chain: 'ordinals' | 'pipe';
  inscriptionNumber: number | null;
  contentType: string;
  contentUrl: string | null;
  title: string;
  collection: string | null;
  satRarity: string | null;
  aiScore: number | null;
  aiAnalysis: AIAnalysis | null;
  marketplaceUrl: string | null;
  discoveredAt: string;
  analyzedAt: string | null;
}

export interface GalleryFilters {
  chain?: string;
  minScore?: number;
  style?: string;
  sort: 'newest' | 'oldest' | 'score';
  limit?: number;
}

export interface GalleryStats {
  total: number;
  analyzed: number;
  avgScore: number;
  chains: string[];
  running: boolean;
  provider: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';
