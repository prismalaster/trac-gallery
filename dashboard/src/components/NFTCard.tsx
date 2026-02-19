'use client';

import Link from 'next/link';
import type { CuratedNFT } from '@/lib/types';
import { scoreColor, scoreBg, scoreGlow } from '@/lib/constants';
import { useState } from 'react';

interface NFTCardProps {
  nft: CuratedNFT;
  index: number;
}

export default function NFTCard({ nft, index }: NFTCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link
      href={`/nft/${encodeURIComponent(nft.id)}`}
      className="group relative block rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40 cursor-pointer"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-zinc-900">
        {/* Skeleton */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
        )}

        {/* NFT Image */}
        {nft.contentUrl && !imgError ? (
          <img
            src={nft.contentUrl}
            alt={nft.title}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-700">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        {/* Score Badge with glow */}
        {nft.aiScore !== null && (
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg border backdrop-blur-md ${scoreBg(nft.aiScore)} ${scoreGlow(nft.aiScore)}`}>
            <span className={`text-sm font-bold font-mono ${scoreColor(nft.aiScore)}`}>
              {nft.aiScore}
            </span>
          </div>
        )}

        {/* Chain Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            {nft.chain === 'ordinals' ? 'BTC' : 'PIPE'}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors duration-200">
              {nft.title}
            </h3>
            {nft.aiAnalysis?.style && (
              <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider text-zinc-400 bg-white/[0.04] border border-white/[0.06]">
                {nft.aiAnalysis.style.replace('_', ' ')}
              </span>
            )}
          </div>
          {nft.satRarity && nft.satRarity !== 'common' && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-purple-400">
              {nft.satRarity}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
