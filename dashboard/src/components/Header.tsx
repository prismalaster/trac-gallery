'use client';

import type { ConnectionState } from '@/lib/types';

interface HeaderProps {
  connectionState: ConnectionState;
  nftCount: number;
}

export default function Header({ connectionState, nftCount }: HeaderProps) {
  return (
    <header className="relative z-10 border-b border-white/[0.06]">
      <div className="mx-auto max-w-[1600px] px-6 py-5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-display font-bold tracking-wider text-white uppercase glow-amber">
              Trac<span className="text-amber-400">Gallery</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-medium">
              AI-Curated NFT Collection
            </p>
          </div>
        </div>

        {/* Stats + Connection */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-zinc-400">
              <span className="text-white font-bold font-mono">{nftCount}</span>{' '}
              <span className="text-zinc-500 text-xs uppercase tracking-wider">curated</span>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.02]">
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                : connectionState === 'connecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-zinc-600'
            }`} />
            <span className="text-xs text-zinc-400 font-medium">
              {connectionState === 'connected' ? 'Live' : connectionState === 'connecting' ? 'Connecting' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
