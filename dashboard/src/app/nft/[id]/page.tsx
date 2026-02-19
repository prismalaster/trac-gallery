'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useScBridge } from '@/hooks/useScBridge';
import NFTDetail from '@/components/NFTDetail';
import Header from '@/components/Header';
import type { CuratedNFT } from '@/lib/types';

export default function NFTDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? decodeURIComponent(params.id) : '';
  const { allNfts, connectionState, fetchNftDetail } = useScBridge();
  const [nft, setNft] = useState<CuratedNFT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    // Check local cache first
    const cached = allNfts.find((n) => n.id === id);
    if (cached) {
      setNft(cached);
      setLoading(false);
      return;
    }
    // Fetch via CLI
    setLoading(true);
    fetchNftDetail(id).then((result) => {
      if (result) setNft(result);
      setLoading(false);
    });
  }, [id, allNfts, fetchNftDetail]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header connectionState={connectionState} nftCount={allNfts.length} />

      <main className="flex-1 mx-auto max-w-[1600px] w-full px-6 py-10">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : nft ? (
          <NFTDetail nft={nft} />
        ) : (
          <div className="text-center py-32">
            <h2 className="text-xl font-display text-zinc-300">NFT Not Found</h2>
            <p className="text-sm text-zinc-500 mt-2">This inscription could not be found or loaded.</p>
          </div>
        )}
      </main>
    </div>
  );
}
