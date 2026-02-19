'use client';

import { useScBridge } from '@/hooks/useScBridge';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import NFTGrid from '@/components/NFTGrid';

export default function GalleryPage() {
  const { nfts, connectionState, isLoading, filters, setFilters, allNfts } = useScBridge();

  return (
    <div className="min-h-screen flex flex-col">
      <Header connectionState={connectionState} nftCount={allNfts.length} />

      <main className="flex-1 mx-auto max-w-[1600px] w-full px-6 py-6">
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-white tracking-wide uppercase">
            Curated Collection
          </h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-lg">
            AI-analyzed Bitcoin Ordinals and Pipe/TAP NFTs, rated by artistic quality, originality, technique, and collector appeal.
          </p>
        </div>

        <FilterBar filters={filters} onChange={setFilters} />

        <div className="mt-4">
          <NFTGrid nfts={nfts} isLoading={isLoading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] py-6 mt-12">
        <div className="mx-auto max-w-[1600px] px-6 flex items-center justify-between text-xs text-zinc-600">
          <span>TracGallery &mdash; Powered by Intercom P2P &amp; Trac Network</span>
          <span className="font-mono text-[10px]">AI Curator: {connectionState === 'connected' ? 'Active' : 'Standby'}</span>
        </div>
      </footer>
    </div>
  );
}
