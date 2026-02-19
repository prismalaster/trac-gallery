'use client';

import Link from 'next/link';
import type { CuratedNFT } from '@/lib/types';
import { scoreColor, scoreGlow } from '@/lib/constants';
import ScoreChart from './ScoreChart';
import { useState } from 'react';

interface NFTDetailProps {
  nft: CuratedNFT;
}

export default function NFTDetail({ nft }: NFTDetailProps) {
  const [imgError, setImgError] = useState(false);
  const analysis = nft.aiAnalysis;
  const dims = analysis?.dimensions;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors duration-200 mb-8 group cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform duration-200">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Gallery
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-zinc-900 aspect-square">
          {nft.contentUrl && !imgError ? (
            <img
              src={nft.contentUrl}
              alt={nft.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <span className="text-zinc-600 text-lg">No Image</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-8">
          {/* Title + Score */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl lg:text-2xl font-display font-bold text-white tracking-wide uppercase">
                {nft.title}
              </h1>
              {nft.aiScore !== null && (
                <div className={`shrink-0 text-center px-4 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02] ${scoreGlow(nft.aiScore)}`}>
                  <div className={`text-3xl font-bold font-mono ${scoreColor(nft.aiScore)}`}>
                    {nft.aiScore}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">AI Score</div>
                </div>
              )}
            </div>

            {/* Tags */}
            {analysis?.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {analysis.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 rounded-md text-[11px] font-medium text-zinc-300 bg-white/[0.04] border border-white/[0.08]">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AI Analysis */}
          {analysis && (
            <div className="space-y-4">
              <h2 className="text-xs uppercase tracking-[0.2em] text-amber-400/80 font-bold font-display">
                AI Curator&apos;s Analysis
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {analysis.description}
              </p>
              {analysis.curatorNote && (
                <blockquote className="border-l-2 border-amber-500/40 pl-4 text-sm text-zinc-400 italic">
                  &ldquo;{analysis.curatorNote}&rdquo;
                </blockquote>
              )}
            </div>
          )}

          {/* Score Chart */}
          {dims && (
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold font-display mb-2">
                Score Breakdown
              </h2>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <ScoreChart dimensions={dims} />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {Object.entries(dims).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-zinc-400 capitalize">{key}</span>
                      <span className={`text-sm font-mono font-bold ${scoreColor(val)}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold font-display">
              Metadata
            </h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MetaRow label="Chain" value={nft.chain === 'ordinals' ? 'Bitcoin Ordinals' : 'Pipe/TAP'} />
              {nft.inscriptionNumber && <MetaRow label="Inscription #" value={`#${nft.inscriptionNumber.toLocaleString()}`} />}
              {nft.satRarity && <MetaRow label="Sat Rarity" value={nft.satRarity} />}
              {analysis?.style && <MetaRow label="Style" value={analysis.style.replace('_', ' ')} />}
              <MetaRow label="Content Type" value={nft.contentType} />
              <MetaRow label="Discovered" value={new Date(nft.discoveredAt).toLocaleDateString()} />
            </div>
          </div>

          {/* Actions */}
          {nft.marketplaceUrl && (
            <a
              href={nft.marketplaceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer"
            >
              View on Marketplace
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">{label}</div>
      <div className="text-zinc-300 capitalize">{value}</div>
    </div>
  );
}
