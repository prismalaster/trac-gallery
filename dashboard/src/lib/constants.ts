export const SC_BRIDGE_URL = process.env.NEXT_PUBLIC_SC_BRIDGE_URL || 'ws://127.0.0.1:49222';
export const SC_BRIDGE_TOKEN = process.env.NEXT_PUBLIC_SC_BRIDGE_TOKEN || '';
export const GALLERY_CHANNEL = '0000tracgallery';

export const STYLE_OPTIONS = [
  { value: '', label: 'All Styles' },
  { value: 'pixel_art', label: 'Pixel Art' },
  { value: 'generative', label: 'Generative' },
  { value: 'photography', label: 'Photography' },
  { value: 'illustration', label: 'Illustration' },
  { value: '3d', label: '3D Render' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'typography', label: 'Typography' },
  { value: 'collage', label: 'Collage' },
  { value: 'mixed', label: 'Mixed' },
];

export const CHAIN_OPTIONS = [
  { value: '', label: 'All Chains' },
  { value: 'ordinals', label: 'Ordinals' },
  { value: 'pipe', label: 'Pipe/TAP' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'score', label: 'Top Rated' },
  { value: 'oldest', label: 'Oldest' },
];

export function scoreColor(score: number | null): string {
  if (score === null) return 'text-zinc-500';
  if (score >= 80) return 'text-amber-400';
  if (score >= 60) return 'text-emerald-400';
  if (score >= 40) return 'text-sky-400';
  return 'text-zinc-400';
}

export function scoreBg(score: number | null): string {
  if (score === null) return 'bg-zinc-800/60';
  if (score >= 80) return 'bg-amber-500/15 border-amber-500/30';
  if (score >= 60) return 'bg-emerald-500/15 border-emerald-500/30';
  if (score >= 40) return 'bg-sky-500/15 border-sky-500/30';
  return 'bg-zinc-800/60 border-zinc-700/30';
}

export function scoreGlow(score: number | null): string {
  if (score === null) return '';
  if (score >= 80) return 'glow-score-gold';
  if (score >= 60) return 'glow-score-green';
  if (score >= 40) return 'glow-score-blue';
  return '';
}
