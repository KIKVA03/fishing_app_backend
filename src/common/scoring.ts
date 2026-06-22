// Mirrors the app's ranking logic (frontend lib/fishing.ts) so the server-side
// leaderboard agrees with what each profile screen shows.

export interface RankTier {
  min: number;
  max: number;
  emoji: string;
  name: string;
  color: string;
}

export const RANK_TIERS: RankTier[] = [
  { min: 0, max: 99, emoji: '🥉', name: 'დამწყები მეთევზე', color: '#94a3b8' },
  { min: 100, max: 349, emoji: '🎣', name: 'მეთევზე', color: '#0ea5e9' },
  { min: 350, max: 799, emoji: '🌟', name: 'გამოცდილი მეთევზე', color: '#f59e0b' },
  { min: 800, max: 1499, emoji: '🏆', name: 'ოსტატი მეთევზე', color: '#10b981' },
  {
    min: 1500,
    max: Number.POSITIVE_INFINITY,
    emoji: '👑',
    name: 'ლეგენდარული მეთევზე',
    color: '#a855f7',
  },
];

// score = catches×10 + full_months×5 + photos×15
export function calculateUserScore(
  totalCatches: number,
  accountAgeDays: number,
  photoCount: number,
): number {
  return totalCatches * 10 + Math.floor(accountAgeDays / 30) * 5 + photoCount * 15;
}

export function getRankTier(score: number): RankTier {
  return RANK_TIERS.find((t) => score >= t.min && score <= t.max) ?? RANK_TIERS[0];
}

export function accountAgeDays(createdAt: Date): number {
  return Math.max(0, Math.floor((Date.now() - createdAt.getTime()) / 86400000));
}
