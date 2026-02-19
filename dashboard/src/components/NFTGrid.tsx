'use client';

import type { CuratedNFT } from '@/lib/types';
import NFTCard from './NFTCard';

interface NFTGridProps {
  nfts: CuratedNFT[];
  isLoading: boolean;
}

export default function NFTGrid({ nfts, isLoading }: NFTGridProps) {
  if (isLoading && nfts.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] animate-pulse">
            <div className="aspect-square bg-zinc-800/50" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-zinc-800/50 rounded w-3/4" />
              <div className="h-3 bg-zinc-800/30 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            <path d="M9 10h.01M15 10h.01M8 15s1.5 2 4 2 4-2 4-2" />
          </svg>
        </div>
        <h3 className="text-lg font-display text-zinc-300 mb-2">No NFTs Found</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          TracGallery is discovering and curating NFTs. Adjust your filters or wait for the AI curator to find new pieces.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {nfts.map((nft, i) => (
        <NFTCard key={nft.id} nft={nft} index={i} />
      ))}
    </div>
  );
}
