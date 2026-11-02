import { Card, DailyChallengeConfig, GameId, LeaderboardEntry, PlayerProfile } from '../types/solitaire';
import { createDeck, createSpiderDeck } from './cardUtils';

/**
 * Seeded PRNG using the Mulberry32 algorithm
 */
export function createMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an integer seed from a date string (e.g. "2026-10-28")
 */
export function getSeedForDate(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Curated rotation list of 26 Solitaire variants for daily challenges
 */
const DAILY_GAMES_CYCLE: GameId[] = [
  'klondike',
  'freecell',
  'spider2',
  'pyramid',
  'yukon',
  'tripeaks',
  'canfield',
  'golf',
  'fortythieves',
  'russian',
  'scorpion',
  'klondike3',
  'spider1',
  'bakersgame',
  'eightoff',
  'acesup',
  'montecarlo',
  'gaps',
  'seahaven',
  'castle',
  'bristol',
  'calculation',
  'clock',
  'grandfather',
  'osmosis',
  'spider4',
];

/**
 * Returns today's ISO date string (YYYY-MM-DD)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retrieves the Daily Challenge configuration for a given date
 */
export function getDailyChallengeConfig(dateStr: string): DailyChallengeConfig {
  const seed = getSeedForDate(dateStr);
  const gameIndex = seed % DAILY_GAMES_CYCLE.length;
  const gameId = DAILY_GAMES_CYCLE[gameIndex];

  // Friendly title
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dateFormatted = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return {
    date: dateStr,
    gameId,
    seed,
    title: `Daily Challenge - ${dateFormatted}`,
  };
}

/**
 * Creates and shuffles the deterministic card deck for a daily challenge
 */
export function createDailyChallengeDeck(gameId: GameId, seed: number): Card[] {
  const prng = createMulberry32(seed);

  let rawDeck: Card[];
  if (gameId === 'spider1') {
    rawDeck = createSpiderDeck(1);
  } else if (gameId === 'spider2') {
    rawDeck = createSpiderDeck(2);
  } else if (gameId === 'spider4') {
    rawDeck = createSpiderDeck(4);
  } else if (gameId === 'fortythieves') {
    rawDeck = createDeck(2);
  } else {
    rawDeck = createDeck(1);
  }

  // Seeded Fisher-Yates shuffle
  const deck = [...rawDeck];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

/**
 * International competitors pool for realistic seeded global leaderboards
 */
const COMPETITORS = [
  { name: 'Sarah_Conner', country: 'US', flag: '🇺🇸', avatar: '🦁' },
  { name: 'Kenji_Tokyo', country: 'JP', flag: '🇯🇵', avatar: '⚡' },
  { name: 'Hans_Munich', country: 'DE', flag: '🇩🇪', avatar: '👑' },
  { name: 'Arthur_Pendleton', country: 'GB', flag: '🇬🇧', avatar: '🏰' },
  { name: 'Aarav_Sharma', country: 'IN', flag: '🇮🇳', avatar: '🦅' },
  { name: 'Sophie_Lefevre', country: 'FR', flag: '🇫🇷', avatar: '⚜' },
  { name: 'Lucas_Silva', country: 'BR', flag: '🇧🇷', avatar: '⚽' },
  { name: 'Chloe_OConnor', country: 'CA', flag: '🇨🇦', avatar: '🍁' },
  { name: 'Matteo_Rossi', country: 'IT', flag: '🇮🇹', avatar: '🐺' },
  { name: 'Minho_Kim', country: 'KR', flag: '🇰🇷', avatar: '🐯' },
  { name: 'Liam_Smith', country: 'AU', flag: '🇦🇺', avatar: '🦘' },
  { name: 'Elena_Popova', country: 'UA', flag: '🇺🇦', avatar: '🌻' },
  { name: 'Carlos_Mendoza', country: 'MX', flag: '🇲🇽', avatar: '🌵' },
  { name: 'Lars_Lindstrom', country: 'SE', flag: '🇸🇪', avatar: '⚔' },
  { name: 'Priya_Nair', country: 'IN', flag: '🇮🇳', avatar: '💎' },
  { name: 'Oliver_Queen', country: 'US', flag: '🇺🇸', avatar: '🏹' },
  { name: 'Jack_Sparrow', country: 'GB', flag: '🇬🇧', avatar: '🏴‍☠️' },
  { name: 'Mia_Watanabe', country: 'JP', flag: '🇯🇵', avatar: '🌸' },
  { name: 'Felix_Baumann', country: 'CH', flag: '🇨🇭', avatar: '🏔' },
  { name: 'Isabella_Santos', country: 'ES', flag: '🇪🇸', avatar: '🌹' },
  { name: 'Noah_DeJong', country: 'NL', flag: '🇳🇱', avatar: '🌷' },
  { name: 'Fatima_AlZahra', country: 'AE', flag: '🇦🇪', avatar: '🌙' },
  { name: 'David_Miller', country: 'US', flag: '🇺🇸', avatar: '🦅' },
  { name: 'Viktor_Petrov', country: 'BG', flag: '🇧🇬', avatar: '🛡' },
  { name: 'Aoi_Takahashi', country: 'JP', flag: '🇯🇵', avatar: '🌊' },
  { name: 'Alexander_V', country: 'RU', flag: '🇷🇺', avatar: '🐻' },
  { name: 'Jessica_Huang', country: 'SG', flag: '🇸🇬', avatar: '✨' },
  { name: 'Emma_Watson', country: 'GB', flag: '🇬🇧', avatar: '🦉' },
  { name: 'Ethan_Hunt', country: 'US', flag: '🇺🇸', avatar: '🎯' },
  { name: 'Santiago_Rios', country: 'AR', flag: '🇦🇷', avatar: '☀️' },
];

/**
 * Computes deterministic Global Leaderboard for a given challenge date
 */
export function getGlobalLeaderboard(
  dateStr: string,
  playerSubmission?: { score: number; timeSeconds: number; moves: number }
): {
  entries: LeaderboardEntry[];
  playerRank: number | null;
  totalParticipants: number;
} {
  const seed = getSeedForDate(dateStr);
  const prng = createMulberry32(seed + 777);

  // Generate 45 deterministic global entries around competitive baseline
  const baseScore = 650 + (seed % 300);
  const baseTime = 110 + (seed % 80);
  const baseMoves = 85 + (seed % 40);

  const entries: LeaderboardEntry[] = [];

  COMPETITORS.forEach((comp, idx) => {
    // Generate variance
    const scoreOffset = Math.floor(prng() * 450) - 150;
    const timeOffset = Math.floor(prng() * 140) - 50;
    const movesOffset = Math.floor(prng() * 60) - 20;

    const score = Math.max(350, baseScore + scoreOffset);
    const timeSeconds = Math.max(55, baseTime + timeOffset);
    const moves = Math.max(48, baseMoves + movesOffset);

    entries.push({
      id: `bot-${idx}-${dateStr}`,
      rank: 0,
      playerName: comp.name,
      country: comp.country,
      countryFlag: comp.flag,
      avatar: comp.avatar,
      score,
      timeSeconds,
      moves,
      isPlayer: false,
    });
  });

  // Load player profile
  const profile = getPlayerProfile();

  let playerEntry: LeaderboardEntry | null = null;
  if (playerSubmission) {
    playerEntry = {
      id: 'player-entry',
      rank: 0,
      playerName: profile.name,
      country: profile.country,
      countryFlag: profile.countryFlag,
      avatar: profile.avatar,
      score: playerSubmission.score,
      timeSeconds: playerSubmission.timeSeconds,
      moves: playerSubmission.moves,
      isPlayer: true,
    };
    entries.push(playerEntry);
  } else if (profile.completedDates[dateStr] && profile.completedDates[dateStr].won) {
    const res = profile.completedDates[dateStr];
    playerEntry = {
      id: 'player-entry',
      rank: 0,
      playerName: profile.name,
      country: profile.country,
      countryFlag: profile.countryFlag,
      avatar: profile.avatar,
      score: res.score,
      timeSeconds: res.time,
      moves: res.moves,
      isPlayer: true,
    };
    entries.push(playerEntry);
  }

  // Sort leaderboard: Higher score first, then lower time, then lower moves
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.timeSeconds !== b.timeSeconds) return a.timeSeconds - b.timeSeconds;
    return a.moves - b.moves;
  });

  // Assign 1-indexed ranks
  let playerRank: number | null = null;
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
    if (entry.isPlayer) {
      playerRank = idx + 1;
    }
  });

  // Total global participants scale factor
  const totalParticipants = 1240 + (seed % 500);

  return {
    entries,
    playerRank,
    totalParticipants,
  };
}

export interface DailyStreakInfo {
  currentStreak: number;
  highestStreak: number;
  isCompletedToday: boolean;
  isCompletedYesterday: boolean;
  lastCompletedDate: string | null;
  streakActive: boolean;
}

/**
 * Returns a date string with an added or subtracted number of days
 */
export function offsetDateString(dateStr: string, dayDelta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dayDelta);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  const nextD = String(date.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * Computes exact consecutive day streak metrics for Daily Challenges
 */
export function computeDailyStreak(
  completedDates: Record<string, { won?: boolean }>,
  referenceDateStr?: string
): DailyStreakInfo {
  const today = referenceDateStr || getTodayDateString();
  const yesterday = offsetDateString(today, -1);

  const isCompletedToday = !!completedDates[today]?.won;
  const isCompletedYesterday = !!completedDates[yesterday]?.won;

  // Filter and sort all won dates in ascending order
  const wonDates = Object.keys(completedDates)
    .filter(d => !!completedDates[d]?.won)
    .sort();

  const lastCompletedDate = wonDates.length > 0 ? wonDates[wonDates.length - 1] : null;

  // Compute current streak:
  // If today is completed, count backwards from today.
  // If today is not completed yet but yesterday was, the streak is alive pending today's challenge.
  let currentStreak = 0;
  if (isCompletedToday) {
    let checkDate = today;
    while (completedDates[checkDate]?.won) {
      currentStreak++;
      checkDate = offsetDateString(checkDate, -1);
    }
  } else if (isCompletedYesterday) {
    let checkDate = yesterday;
    while (completedDates[checkDate]?.won) {
      currentStreak++;
      checkDate = offsetDateString(checkDate, -1);
    }
  } else {
    currentStreak = 0;
  }

  // Calculate highest all-time consecutive run from wonDates
  let highestStreak = 0;
  if (wonDates.length > 0) {
    let running = 1;
    highestStreak = 1;
    for (let i = 1; i < wonDates.length; i++) {
      const prev = wonDates[i - 1];
      const curr = wonDates[i];
      if (curr === offsetDateString(prev, 1)) {
        running++;
        if (running > highestStreak) {
          highestStreak = running;
        }
      } else if (curr !== prev) {
        running = 1;
      }
    }
  }

  highestStreak = Math.max(highestStreak, currentStreak);

  return {
    currentStreak,
    highestStreak,
    isCompletedToday,
    isCompletedYesterday,
    lastCompletedDate,
    streakActive: isCompletedToday || isCompletedYesterday,
  };
}

const PROFILE_KEY = 'solitaire_player_profile_v2';

export const DEFAULT_PROFILE: PlayerProfile = {
  name: 'AceKing_Player',
  country: 'US',
  countryFlag: '👑',
  avatar: '🃏',
  totalCrowns: 0,
  currentStreak: 0,
  highestStreak: 0,
  completedDates: {},
};

export function getPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
      // Dynamically calculate and sync streak based on the current calendar date
      const streakInfo = computeDailyStreak(parsed.completedDates || {});
      parsed.currentStreak = streakInfo.currentStreak;
      parsed.highestStreak = Math.max(parsed.highestStreak || 0, streakInfo.highestStreak);
      return parsed;
    }
  } catch (e) {}
  return DEFAULT_PROFILE;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {}
}

export function getDailyStreakInfo(referenceDateStr?: string): DailyStreakInfo {
  const profile = getPlayerProfile();
  return computeDailyStreak(profile.completedDates || {}, referenceDateStr);
}

/**
 * Record a Daily Challenge win and update streaks and crowns
 */
export function recordDailyChallengeWin(
  dateStr: string,
  score: number,
  time: number,
  moves: number
): { profile: PlayerProfile; rank: number; streakInfo: DailyStreakInfo } {
  const profile = getPlayerProfile();

  // Calculate rank
  const { playerRank } = getGlobalLeaderboard(dateStr, { score, timeSeconds: time, moves });
  const finalRank = playerRank || 1;

  const updatedCompletedDates = {
    ...profile.completedDates,
    [dateStr]: {
      won: true,
      score: Math.max(profile.completedDates[dateStr]?.score || 0, score),
      time: Math.min(profile.completedDates[dateStr]?.time || 999999, time),
      moves: Math.min(profile.completedDates[dateStr]?.moves || 999999, moves),
      rank: finalRank,
    },
  };

  const streakInfo = computeDailyStreak(updatedCompletedDates);
  const totalCrowns = Object.values(updatedCompletedDates).filter(d => d.won).length;

  const updatedProfile: PlayerProfile = {
    ...profile,
    totalCrowns,
    currentStreak: streakInfo.currentStreak,
    highestStreak: Math.max(profile.highestStreak, streakInfo.highestStreak),
    completedDates: updatedCompletedDates,
  };

  savePlayerProfile(updatedProfile);
  return { profile: updatedProfile, rank: finalRank, streakInfo };
}
