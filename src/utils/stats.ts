import { GameId } from '../types/solitaire';
import { getTodayDateString, offsetDateString } from './dailyChallenge';

export interface GameSpecificStats {
  played: number;
  won: number;
  totalTime: number; // in seconds
  fastestWin: number | null; // in seconds
  bestMoves: number | null;
  totalWinningMoves?: number; // total moves across winning games in this variant
  highScore: number;
  currentStreak: number;
  longestStreak: number;
}

export interface DailyGameRecord {
  played: number;
  won: number;
  byGame?: Record<string, { played: number; won: number }>;
}

export interface UserStats {
  totalGamesPlayed: number;
  totalGamesWon: number;
  totalTimePlayed: number; // in seconds
  fastestWinTime: number | null; // in seconds
  currentStreak: number;
  longestStreak: number;
  byGame: Record<string, GameSpecificStats>;
  dailyHistory?: Record<string, DailyGameRecord>;
  hourlyHistory?: Record<string, Record<number, number>>; // dateStr -> hour (0-23) -> seconds
  totalWinningMoves?: number; // total moves across winning games in all 26 variants
}

const STATS_STORAGE_KEY = 'solitaire_user_stats_v3';

export const DEFAULT_USER_STATS: UserStats = {
  totalGamesPlayed: 0,
  totalGamesWon: 0,
  totalTimePlayed: 0,
  fastestWinTime: null,
  currentStreak: 0,
  longestStreak: 0,
  byGame: {},
};

export function getUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_USER_STATS,
        ...parsed,
        byGame: parsed.byGame || {},
      };
    }
  } catch (e) {
    console.error('Failed to load user stats', e);
  }
  return { ...DEFAULT_USER_STATS };
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user stats', e);
  }
}

export function resetUserStats(): UserStats {
  try {
    localStorage.removeItem(STATS_STORAGE_KEY);
  } catch (e) {}
  return { ...DEFAULT_USER_STATS };
}

/**
 * Record when a game begins or restarts
 */
export function recordGameStart(gameId: GameId): UserStats {
  const stats = getUserStats();

  stats.totalGamesPlayed += 1;

  if (!stats.byGame[gameId]) {
    stats.byGame[gameId] = {
      played: 0,
      won: 0,
      totalTime: 0,
      fastestWin: null,
      bestMoves: null,
      highScore: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  stats.byGame[gameId].played += 1;

  // Track daily history for 30-day trendline
  const today = getTodayDateString();
  if (!stats.dailyHistory) stats.dailyHistory = {};
  if (!stats.dailyHistory[today]) {
    stats.dailyHistory[today] = { played: 0, won: 0, byGame: {} };
  }
  stats.dailyHistory[today].played += 1;
  if (!stats.dailyHistory[today].byGame) stats.dailyHistory[today].byGame = {};
  if (!stats.dailyHistory[today].byGame![gameId]) {
    stats.dailyHistory[today].byGame![gameId] = { played: 0, won: 0 };
  }
  stats.dailyHistory[today].byGame![gameId].played += 1;

  saveUserStats(stats);
  return stats;
}

/**
 * Record time spent playing
 */
export function recordTimeElapsed(secondsDelta: number, gameId?: GameId): UserStats {
  if (secondsDelta <= 0) return getUserStats();
  const stats = getUserStats();

  stats.totalTimePlayed += secondsDelta;

  if (gameId) {
    if (!stats.byGame[gameId]) {
      stats.byGame[gameId] = {
        played: 1,
        won: 0,
        totalTime: 0,
        fastestWin: null,
        bestMoves: null,
        highScore: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }
    stats.byGame[gameId].totalTime += secondsDelta;
  }

  // Record hourly activity
  const now = new Date();
  const currentHour = now.getHours();
  const today = getTodayDateString();
  if (!stats.hourlyHistory) stats.hourlyHistory = {};
  if (!stats.hourlyHistory[today]) stats.hourlyHistory[today] = {};
  stats.hourlyHistory[today][currentHour] = (stats.hourlyHistory[today][currentHour] || 0) + secondsDelta;

  // Track session duration in sessionStorage
  recordSessionTimeElapsed(secondsDelta);

  saveUserStats(stats);
  return stats;
}

/**
 * Record a game victory
 */
export function recordGameWin(
  gameId: GameId,
  timeSeconds: number,
  moves: number,
  score: number
): { stats: UserStats; isNewFastestOverall: boolean; isNewFastestForGame: boolean } {
  const stats = getUserStats();

  stats.totalGamesWon += 1;
  stats.totalWinningMoves = (stats.totalWinningMoves || 0) + moves;
  stats.currentStreak += 1;
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  let isNewFastestOverall = false;
  if (stats.fastestWinTime === null || timeSeconds < stats.fastestWinTime) {
    stats.fastestWinTime = timeSeconds;
    isNewFastestOverall = true;
  }

  if (!stats.byGame[gameId]) {
    stats.byGame[gameId] = {
      played: 1,
      won: 0,
      totalTime: timeSeconds,
      fastestWin: null,
      bestMoves: null,
      totalWinningMoves: 0,
      highScore: 0,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const gameStat = stats.byGame[gameId];
  gameStat.won += 1;
  gameStat.totalWinningMoves = (gameStat.totalWinningMoves || 0) + moves;
  gameStat.currentStreak += 1;
  if (gameStat.currentStreak > gameStat.longestStreak) {
    gameStat.longestStreak = gameStat.currentStreak;
  }

  let isNewFastestForGame = false;
  if (gameStat.fastestWin === null || timeSeconds < gameStat.fastestWin) {
    gameStat.fastestWin = timeSeconds;
    isNewFastestForGame = true;
  }

  if (gameStat.bestMoves === null || moves < gameStat.bestMoves) {
    gameStat.bestMoves = moves;
  }

  if (score > gameStat.highScore) {
    gameStat.highScore = score;
  }

  // Track win in dailyHistory
  const today = getTodayDateString();
  if (!stats.dailyHistory) stats.dailyHistory = {};
  if (!stats.dailyHistory[today]) {
    stats.dailyHistory[today] = { played: 1, won: 0, byGame: {} };
  }
  stats.dailyHistory[today].won += 1;
  if (!stats.dailyHistory[today].byGame) stats.dailyHistory[today].byGame = {};
  if (!stats.dailyHistory[today].byGame![gameId]) {
    stats.dailyHistory[today].byGame![gameId] = { played: 1, won: 0 };
  }
  stats.dailyHistory[today].byGame![gameId].won += 1;

  // Record hourly activity
  const now = new Date();
  const currentHour = now.getHours();
  if (!stats.hourlyHistory) stats.hourlyHistory = {};
  if (!stats.hourlyHistory[today]) stats.hourlyHistory[today] = {};
  stats.hourlyHistory[today][currentHour] = (stats.hourlyHistory[today][currentHour] || 0) + timeSeconds;

  saveUserStats(stats);

  return { stats, isNewFastestOverall, isNewFastestForGame };
}

/**
 * Format total seconds into a clean human readable string (e.g., "1h 24m 12s" or "04:32")
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format total seconds into hours and minutes (e.g. "2h 45m" or "0h 32m")
 */
export function formatHoursAndMinutes(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0h 0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

/**
 * Format minutes and seconds for game times (e.g. "02:14")
 */
export function formatClockTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Calculate win percentage
 */
export function calculateWinRate(won: number, played: number): string {
  if (played <= 0) return '0%';
  const rate = Math.round((won / played) * 100);
  return `${rate}%`;
}

export interface WinRateDataPoint {
  date: string;              // "YYYY-MM-DD"
  label: string;             // "Oct 15"
  dayOfMonth: string;        // "15"
  weekday: string;           // "Wed"
  played: number;            // Games played on this day
  won: number;               // Games won on this day
  winRate: number;           // Win % to display (0 - 100)
  dailyWinRate: number;      // Day-specific win % (0 - 100)
  cumulativeWinRate: number; // Cumulative win % up to this date (0 - 100)
  hasActivity: boolean;      // Whether games were played on this day
  isToday: boolean;
}

/**
 * Generates 30 days of Win Rate data points for Recharts visualization
 */
export function generate30DayWinRateSeries(
  stats: UserStats,
  completedDailyDates?: Record<string, { won?: boolean; score?: number }>,
  gameFilter: GameId | 'all' = 'all',
  isDemo: boolean = false
): WinRateDataPoint[] {
  const today = getTodayDateString();
  const points: WinRateDataPoint[] = [];

  if (isDemo) {
    // Generate realistic progression curve for preview
    // Baseline begins at ~45% and improves to ~72% over 30 days
    const demoDailyPlays = [
      { p: 3, w: 1 }, { p: 4, w: 2 }, { p: 2, w: 1 }, { p: 5, w: 3 }, { p: 3, w: 2 },
      { p: 4, w: 2 }, { p: 6, w: 4 }, { p: 3, w: 2 }, { p: 5, w: 3 }, { p: 4, w: 3 },
      { p: 2, w: 1 }, { p: 5, w: 4 }, { p: 4, w: 3 }, { p: 6, w: 4 }, { p: 3, w: 2 },
      { p: 5, w: 4 }, { p: 4, w: 3 }, { p: 7, w: 5 }, { p: 4, w: 3 }, { p: 5, w: 4 },
      { p: 3, w: 2 }, { p: 6, w: 5 }, { p: 5, w: 4 }, { p: 4, w: 3 }, { p: 6, w: 5 },
      { p: 5, w: 4 }, { p: 7, w: 5 }, { p: 6, w: 5 }, { p: 5, w: 4 }, { p: 8, w: 6 },
    ];

    let cumPlayed = 15;
    let cumWon = 7;

    for (let i = 29; i >= 0; i--) {
      const dateStr = offsetDateString(today, -i);
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayOfMonth = String(d);

      const daySpec = demoDailyPlays[29 - i] || { p: 4, w: 3 };
      cumPlayed += daySpec.p;
      cumWon += daySpec.w;

      const dailyRate = Math.round((daySpec.w / daySpec.p) * 100);
      const cumRate = Math.round((cumWon / cumPlayed) * 100);

      points.push({
        date: dateStr,
        label,
        dayOfMonth,
        weekday,
        played: daySpec.p,
        won: daySpec.w,
        winRate: cumRate,
        dailyWinRate: dailyRate,
        cumulativeWinRate: cumRate,
        hasActivity: true,
        isToday: i === 0,
      });
    }

    return points;
  }

  // Real data computation
  let runningTotalWon = 0;
  let runningTotalPlayed = 0;

  // Check if we have pre-existing baseline from prior stats
  const filterStat = gameFilter === 'all' 
    ? { played: stats.totalGamesPlayed, won: stats.totalGamesWon }
    : (stats.byGame[gameFilter] || { played: 0, won: 0 });

  // Gather 30 days of data from dailyHistory and completedDailyDates
  const rawDays: { dateStr: string; played: number; won: number; hasActivity: boolean }[] = [];
  let totalDailyHistoryPlayed = 0;
  let totalDailyHistoryWon = 0;

  for (let i = 29; i >= 0; i--) {
    const dateStr = offsetDateString(today, -i);
    let p = 0;
    let w = 0;

    const hist = stats.dailyHistory?.[dateStr];
    if (hist) {
      if (gameFilter === 'all') {
        p += hist.played || 0;
        w += hist.won || 0;
      } else if (hist.byGame?.[gameFilter]) {
        p += hist.byGame[gameFilter].played || 0;
        w += hist.byGame[gameFilter].won || 0;
      }
    }

    // Incorporate daily challenge if gameFilter is 'all' or matches daily challenge
    if (gameFilter === 'all' && completedDailyDates?.[dateStr]?.won) {
      // If daily challenge was won and wasn't already logged
      if (w === 0 && p === 0) {
        p += 1;
        w += 1;
      }
    }

    totalDailyHistoryPlayed += p;
    totalDailyHistoryWon += w;
    rawDays.push({ dateStr, played: p, won: w, hasActivity: p > 0 });
  }

  // If there are prior recorded games not captured in the 30-day window
  const unaccountedPlayed = Math.max(0, filterStat.played - totalDailyHistoryPlayed);
  const unaccountedWon = Math.max(0, filterStat.won - totalDailyHistoryWon);

  runningTotalPlayed = unaccountedPlayed;
  runningTotalWon = unaccountedWon;

  for (let i = 0; i < rawDays.length; i++) {
    const { dateStr, played, won, hasActivity } = rawDays[i];
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const dayOfMonth = String(d);

    runningTotalPlayed += played;
    runningTotalWon += won;

    const dailyRate = played > 0 ? Math.round((won / played) * 100) : 0;
    const cumRate = runningTotalPlayed > 0 
      ? Math.round((runningTotalWon / runningTotalPlayed) * 100) 
      : 0;

    points.push({
      date: dateStr,
      label,
      dayOfMonth,
      weekday,
      played,
      won,
      winRate: cumRate,
      dailyWinRate: dailyRate,
      cumulativeWinRate: cumRate,
      hasActivity,
      isToday: i === rawDays.length - 1,
    });
  }

  return points;
}

export interface HeatmapDataPoint {
  dayIndex: number;    // 0 (6 days ago) to 6 (today)
  dayName: string;     // "Mon", "Tue", etc.
  dateStr: string;     // "YYYY-MM-DD"
  displayDate: string; // "Oct 25"
  hour: number;        // 0 to 23
  hourLabel: string;   // "8 PM"
  timeMinutes: number; // rounded minutes
  timeSeconds: number; // exact seconds
  intensity: number;   // 0 (none), 1 (1-10m), 2 (11-25m), 3 (26-45m), 4 (46m+)
  isToday: boolean;
}

export interface HourlySummaryPoint {
  hour: number;
  hourLabel: string;
  totalMinutes: number;
  totalSeconds: number;
  intensity: number;
}

export interface HeatmapWeekSummary {
  heatmapPoints: HeatmapDataPoint[];
  hourlySummary: HourlySummaryPoint[];
  totalWeekMinutes: number;
  peakHourLabel: string;
  mostActiveDayName: string;
  dailyAverageMinutes: number;
  dayLabels: string[];
}

export function formatHourDisplay(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/**
 * Generates 7-day x 24-hour heatmap data for the last week
 */
export function generateLastWeekHourlyHeatmapData(
  stats: UserStats,
  isDemo: boolean = false
): HeatmapWeekSummary {
  const today = getTodayDateString();
  const heatmapPoints: HeatmapDataPoint[] = [];
  const hourlyTotals: { totalSeconds: number }[] = Array.from({ length: 24 }, () => ({ totalSeconds: 0 }));
  const dayTotals: { dayName: string; seconds: number }[] = [];
  const dayLabels: string[] = [];

  // Deterministic realistic demo distribution for preview
  const demoSeedMatrix: number[][] = [
    // 6 days ago
    [0, 0, 0, 0, 0, 0, 0, 12, 18, 0, 0, 0, 22, 0, 0, 0, 0, 15, 32, 44, 25, 0, 0, 0],
    // 5 days ago
    [0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 28, 0, 0, 0, 0, 20, 38, 48, 30, 12, 0, 0],
    // 4 days ago
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 15, 0, 0, 0, 12, 28, 42, 35, 0, 0, 0],
    // 3 days ago
    [0, 0, 0, 0, 0, 0, 0, 15, 20, 0, 0, 0, 25, 0, 0, 0, 0, 18, 35, 52, 40, 15, 0, 0],
    // 2 days ago (Friday)
    [0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 30, 0, 0, 0, 0, 25, 45, 58, 48, 22, 0, 0],
    // Yesterday (Saturday)
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 25, 35, 42, 38, 28, 20, 0, 32, 48, 62, 50, 28, 0, 0],
    // Today (Sunday)
    [0, 0, 0, 0, 0, 0, 0, 0, 15, 22, 30, 40, 35, 30, 25, 0, 0, 28, 45, 55, 38, 15, 0, 0],
  ];

  let grandTotalSeconds = 0;

  for (let d = 6; d >= 0; d--) {
    const dayIndex = 6 - d; // 0 to 6
    const dateStr = offsetDateString(today, -d);
    const [y, m, dayNum] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, dayNum);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const displayDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dayLabels.push(`${dayName} ${dayNum}`);

    let daySeconds = 0;

    for (let h = 0; h < 24; h++) {
      let seconds = 0;

      if (isDemo) {
        const demoMins = demoSeedMatrix[dayIndex]?.[h] || 0;
        seconds = demoMins * 60;
      } else {
        const recorded = stats.hourlyHistory?.[dateStr]?.[h];
        if (recorded !== undefined) {
          seconds = recorded;
        } else if (d === 0 && stats.totalTimePlayed > 0 && h === new Date().getHours()) {
          // If playing today and time is logged
          seconds = Math.min(stats.totalTimePlayed, 1800);
        }
      }

      const minutes = Math.round(seconds / 60);
      daySeconds += seconds;
      hourlyTotals[h].totalSeconds += seconds;
      grandTotalSeconds += seconds;

      let intensity = 0;
      if (minutes >= 45) intensity = 4;
      else if (minutes >= 25) intensity = 3;
      else if (minutes >= 10) intensity = 2;
      else if (minutes >= 1) intensity = 1;

      heatmapPoints.push({
        dayIndex,
        dayName,
        dateStr,
        displayDate,
        hour: h,
        hourLabel: formatHourDisplay(h),
        timeMinutes: minutes,
        timeSeconds: seconds,
        intensity,
        isToday: d === 0,
      });
    }

    dayTotals.push({ dayName, seconds: daySeconds });
  }

  // Hourly summary across all 7 days
  const hourlySummary: HourlySummaryPoint[] = hourlyTotals.map((item, h) => {
    const totalMinutes = Math.round(item.totalSeconds / 60);
    let intensity = 0;
    if (totalMinutes >= 120) intensity = 4;
    else if (totalMinutes >= 60) intensity = 3;
    else if (totalMinutes >= 20) intensity = 2;
    else if (totalMinutes >= 5) intensity = 1;

    return {
      hour: h,
      hourLabel: formatHourDisplay(h),
      totalMinutes,
      totalSeconds: item.totalSeconds,
      intensity,
    };
  });

  // Calculate peak hour
  let peakHour = 20; // default 8pm
  let peakSeconds = 0;
  hourlyTotals.forEach((item, h) => {
    if (item.totalSeconds > peakSeconds) {
      peakSeconds = item.totalSeconds;
      peakHour = h;
    }
  });
  const peakHourLabel = `${formatHourDisplay(peakHour)} – ${formatHourDisplay((peakHour + 1) % 24)}`;

  // Calculate most active day
  let mostActiveDay = dayTotals[0]?.dayName || 'Saturday';
  let maxDaySeconds = 0;
  dayTotals.forEach((d) => {
    if (d.seconds > maxDaySeconds) {
      maxDaySeconds = d.seconds;
      mostActiveDay = d.dayName;
    }
  });

  const totalWeekMinutes = Math.round(grandTotalSeconds / 60);
  const dailyAverageMinutes = Math.round(totalWeekMinutes / 7);

  return {
    heatmapPoints,
    hourlySummary,
    totalWeekMinutes,
    peakHourLabel,
    mostActiveDayName: mostActiveDay,
    dailyAverageMinutes,
    dayLabels,
  };
}

/**
 * Theoretical optimal minimum moves required to solve each of the 26 Solitaire variants
 */
export const GAME_OPTIMAL_MIN_MOVES: Record<string, number> = {
  klondike: 52,     // 52 cards built onto 4 foundation piles
  klondike3: 52,    // 52 cards built onto 4 foundation piles
  freecell: 52,     // 52 cards built onto 4 foundation piles
  bakersgame: 52,   // 52 cards built onto 4 foundation piles
  eightoff: 52,     // 52 cards built onto 4 foundation piles
  seahaven: 52,     // 52 cards built onto 4 foundation piles
  yukon: 52,        // 52 cards built onto 4 foundation piles
  russian: 52,      // 52 cards built onto 4 foundation piles
  scorpion: 52,     // 4 suits of 13 completed in tableau
  canfield: 52,     // 52 cards built onto 4 foundation piles
  castle: 52,       // 52 cards built onto 4 foundation piles
  bristol: 52,      // 52 cards built onto 4 foundation piles
  calculation: 52,  // 52 cards built onto 4 foundation piles
  clock: 52,        // 52 cards placed onto 13 clock positions
  grandfather: 52,  // 52 cards built onto 4 foundation piles
  osmosis: 52,      // 52 cards built onto 4 foundation piles
  acesup: 48,       // 48 cards discarded to 4 Aces
  montecarlo: 26,   // 26 pair elimination moves
  gaps: 48,         // 48 cards ordered into sequence after Aces removed
  golf: 35,         // 35 tableau cards cleared onto waste pile
  tripeaks: 28,     // 28 cards across 3 peaks cleared onto waste
  pyramid: 26,      // 26 pair removals totaling rank 13
  spider1: 104,     // 8 completed suits assembled (104 cards)
  spider2: 104,     // 8 completed suits assembled (104 cards)
  spider4: 104,     // 8 completed suits assembled (104 cards)
  fortythieves: 104,// 8 foundations from Ace to King (104 cards)
};

export interface MoveEfficiencyResult {
  scorePercent: number;          // 0 to 100
  scoreFormatted: string;        // "83.9%" or "--"
  ratingTier: 'Grandmaster' | 'Expert' | 'Skilled' | 'Solid' | 'Novice' | 'Unranked';
  ratingColor: string;           // Tailwind text class
  ratingBadgeBg: string;         // Tailwind bg/border class
  ratingGrade: 'S' | 'A' | 'B' | 'C' | 'D' | '—';
  playerMoves: number | null;    // Best / average moves
  optimalMoves: number;          // Minimum theoretical moves
  moveDelta: number | null;      // Player moves minus optimal moves
  completedGamesCount: number;   // Completed games analyzed
  description: string;
}

/**
 * Calculates Move Efficiency by comparing player's moves against the optimal minimum moves required
 */
export function calculateMoveEfficiency(
  stats: UserStats,
  gameFilter: GameId | 'all' = 'all',
  completedDailyDates?: Record<string, { won: boolean; moves?: number }>
): MoveEfficiencyResult {
  if (gameFilter !== 'all') {
    const optimalMoves = GAME_OPTIMAL_MIN_MOVES[gameFilter] || 52;
    const gStat = stats.byGame[gameFilter];
    const playerMoves = gStat?.bestMoves ?? null;
    const completedGamesCount = gStat?.won || 0;

    if (!playerMoves || playerMoves <= 0 || completedGamesCount === 0) {
      return {
        scorePercent: 0,
        scoreFormatted: '--',
        ratingTier: 'Unranked',
        ratingColor: 'text-slate-400',
        ratingBadgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
        ratingGrade: '—',
        playerMoves: null,
        optimalMoves,
        moveDelta: null,
        completedGamesCount: 0,
        description: `Theoretical minimum is ${optimalMoves} moves. Complete a game to establish an efficiency rating.`,
      };
    }

    const scorePercent = Math.min(100, Math.round((optimalMoves / playerMoves) * 1000) / 10);
    const moveDelta = Math.max(0, playerMoves - optimalMoves);

    let ratingTier: MoveEfficiencyResult['ratingTier'] = 'Novice';
    let ratingColor = 'text-slate-300';
    let ratingBadgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
    let ratingGrade: MoveEfficiencyResult['ratingGrade'] = 'D';

    if (scorePercent >= 90) {
      ratingTier = 'Grandmaster';
      ratingColor = 'text-amber-300';
      ratingBadgeBg = 'bg-amber-400/20 text-amber-200 border-amber-400/40';
      ratingGrade = 'S';
    } else if (scorePercent >= 80) {
      ratingTier = 'Expert';
      ratingColor = 'text-emerald-400';
      ratingBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      ratingGrade = 'A';
    } else if (scorePercent >= 70) {
      ratingTier = 'Skilled';
      ratingColor = 'text-teal-300';
      ratingBadgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      ratingGrade = 'B';
    } else if (scorePercent >= 60) {
      ratingTier = 'Solid';
      ratingColor = 'text-cyan-300';
      ratingBadgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      ratingGrade = 'C';
    }

    return {
      scorePercent,
      scoreFormatted: `${scorePercent.toFixed(1)}%`,
      ratingTier,
      ratingColor,
      ratingBadgeBg,
      ratingGrade,
      playerMoves,
      optimalMoves,
      moveDelta,
      completedGamesCount,
      description: `${playerMoves} best moves vs ${optimalMoves} optimal moves (+${moveDelta} move overhead)`,
    };
  }

  // "All Games" mode - aggregate optimal vs player best moves across all won variants
  let sumOptimal = 0;
  let sumPlayer = 0;
  let wonGamesCount = 0;

  Object.entries(stats.byGame || {}).forEach(([gId, gStat]) => {
    if (gStat && gStat.won > 0 && gStat.bestMoves && gStat.bestMoves > 0) {
      const opt = GAME_OPTIMAL_MIN_MOVES[gId] || 52;
      sumOptimal += opt;
      sumPlayer += gStat.bestMoves;
      wonGamesCount += gStat.won;
    }
  });

  // Also include daily challenge wins if any
  if (completedDailyDates) {
    Object.values(completedDailyDates).forEach((d) => {
      if (d.won && d.moves && d.moves > 0) {
        // Daily challenge standard baseline
        sumOptimal += 52;
        sumPlayer += d.moves;
        wonGamesCount += 1;
      }
    });
  }

  if (sumPlayer <= 0 || wonGamesCount === 0) {
    return {
      scorePercent: 0,
      scoreFormatted: '--',
      ratingTier: 'Unranked',
      ratingColor: 'text-slate-400',
      ratingBadgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
      ratingGrade: '—',
      playerMoves: null,
      optimalMoves: 52,
      moveDelta: null,
      completedGamesCount: 0,
      description: 'Win a game in any variant to compute your global move efficiency score.',
    };
  }

  const scorePercent = Math.min(100, Math.round((sumOptimal / sumPlayer) * 1000) / 10);
  const moveDelta = Math.max(0, sumPlayer - sumOptimal);

  let ratingTier: MoveEfficiencyResult['ratingTier'] = 'Novice';
  let ratingColor = 'text-slate-300';
  let ratingBadgeBg = 'bg-slate-800 text-slate-300 border-slate-700';
  let ratingGrade: MoveEfficiencyResult['ratingGrade'] = 'D';

  if (scorePercent >= 90) {
    ratingTier = 'Grandmaster';
    ratingColor = 'text-amber-300';
    ratingBadgeBg = 'bg-amber-400/20 text-amber-200 border-amber-400/40';
    ratingGrade = 'S';
  } else if (scorePercent >= 80) {
    ratingTier = 'Expert';
    ratingColor = 'text-emerald-400';
    ratingBadgeBg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    ratingGrade = 'A';
  } else if (scorePercent >= 70) {
    ratingTier = 'Skilled';
    ratingColor = 'text-teal-300';
    ratingBadgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    ratingGrade = 'B';
  } else if (scorePercent >= 60) {
    ratingTier = 'Solid';
    ratingColor = 'text-cyan-300';
    ratingBadgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
    ratingGrade = 'C';
  }

  return {
    scorePercent,
    scoreFormatted: `${scorePercent.toFixed(1)}%`,
    ratingTier,
    ratingColor,
    ratingBadgeBg,
    ratingGrade,
    playerMoves: sumPlayer,
    optimalMoves: sumOptimal,
    moveDelta,
    completedGamesCount: wonGamesCount,
    description: `Aggregated ${sumOptimal} optimal moves vs ${sumPlayer} player moves across completed games`,
  };
}

export interface AverageMovesPerWinResult {
  averageMoves: number | null;
  averageMovesFormatted: string;
  totalWinningMoves: number;
  totalWinningGames: number;
  bestMoves: number | null;
  description: string;
}

/**
 * Calculates and returns the average number of moves across all winning games in all 26 variants or a filtered variant
 */
export function calculateAverageMovesPerWin(
  stats: UserStats,
  completedDailyDates?: Record<string, { won: boolean; moves?: number }>,
  gameFilter: GameId | 'all' = 'all'
): AverageMovesPerWinResult {
  if (gameFilter !== 'all') {
    const gStat = stats.byGame[gameFilter];
    const wonCount = gStat?.won || 0;
    if (!gStat || wonCount === 0) {
      return {
        averageMoves: null,
        averageMovesFormatted: '--',
        totalWinningMoves: 0,
        totalWinningGames: 0,
        bestMoves: null,
        description: 'No winning games recorded yet',
      };
    }

    const totalWinningMoves = gStat.totalWinningMoves 
      || (gStat.bestMoves ? Math.round(gStat.bestMoves * wonCount * 1.08) : 0);
    const averageMoves = totalWinningMoves > 0 ? Math.round(totalWinningMoves / wonCount) : gStat.bestMoves;

    return {
      averageMoves,
      averageMovesFormatted: averageMoves !== null ? `${averageMoves}` : '--',
      totalWinningMoves,
      totalWinningGames: wonCount,
      bestMoves: gStat.bestMoves,
      description: `${wonCount} win${wonCount === 1 ? '' : 's'} · Best: ${gStat.bestMoves ?? '--'}m`,
    };
  }

  // Across all 26 variants:
  let sumMoves = 0;
  let sumWins = 0;
  let overallBest: number | null = null;

  Object.values(stats.byGame || {}).forEach((gStat) => {
    if (gStat && gStat.won > 0) {
      const gMoves = gStat.totalWinningMoves 
        || (gStat.bestMoves ? Math.round(gStat.bestMoves * gStat.won * 1.08) : 0);
      if (gMoves > 0) {
        sumMoves += gMoves;
        sumWins += gStat.won;
      }
      if (gStat.bestMoves !== null) {
        if (overallBest === null || gStat.bestMoves < overallBest) {
          overallBest = gStat.bestMoves;
        }
      }
    }
  });

  // Also include daily challenge wins if present
  if (completedDailyDates) {
    Object.values(completedDailyDates).forEach((d) => {
      if (d.won && d.moves && d.moves > 0) {
        sumMoves += d.moves;
        sumWins += 1;
        if (overallBest === null || d.moves < overallBest) {
          overallBest = d.moves;
        }
      }
    });
  }

  // Fallback to stats.totalWinningMoves and stats.totalGamesWon if set
  if (sumWins === 0 && stats.totalGamesWon > 0 && stats.totalWinningMoves) {
    sumWins = stats.totalGamesWon;
    sumMoves = stats.totalWinningMoves;
  }

  if (sumWins === 0 || sumMoves === 0) {
    return {
      averageMoves: null,
      averageMovesFormatted: '--',
      totalWinningMoves: 0,
      totalWinningGames: 0,
      bestMoves: null,
      description: 'Across all winning games in 26 variants',
    };
  }

  const averageMoves = Math.round(sumMoves / sumWins);

  return {
    averageMoves,
    averageMovesFormatted: `${averageMoves}`,
    totalWinningMoves: sumMoves,
    totalWinningGames: sumWins,
    bestMoves: overallBest,
    description: `Across ${sumWins} winning game${sumWins === 1 ? '' : 's'} in all 26 variants`,
  };
}

// ==========================================
// Session Duration & User-Defined Daily Goal
// ==========================================

export const SESSION_STORAGE_KEY = 'solitaire_session_active_seconds_v1';
export const SESSION_START_KEY = 'solitaire_session_start_timestamp_v1';
export const DAILY_GOAL_STORAGE_KEY = 'solitaire_user_daily_goal_minutes_v1';
export const DEFAULT_DAILY_GOAL_MINUTES = 30; // 30 minutes default user daily goal

/**
 * Get current session active gameplay duration in seconds.
 * Fallbacks to elapsed session wall-clock time if available and active was not yet ticked.
 */
export function getSessionDurationSeconds(): number {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch {}
  return 0;
}

/**
 * Set current session active gameplay duration in seconds.
 */
export function setSessionDurationSeconds(seconds: number): void {
  try {
    const val = Math.max(0, Math.floor(seconds));
    sessionStorage.setItem(SESSION_STORAGE_KEY, val.toString());
  } catch {}
}

/**
 * Increment current session active gameplay duration.
 */
export function recordSessionTimeElapsed(secondsDelta: number): number {
  if (secondsDelta <= 0) return getSessionDurationSeconds();
  try {
    const current = getSessionDurationSeconds();
    const updated = current + secondsDelta;
    sessionStorage.setItem(SESSION_STORAGE_KEY, updated.toString());
    return updated;
  } catch {
    return 0;
  }
}

/**
 * Reset current session duration to 0 seconds.
 */
export function resetSessionDuration(): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, '0');
  } catch {}
}

/**
 * Get user-defined daily playtime goal in minutes. Defaults to 30 minutes.
 */
export function getUserDailyGoalMinutes(): number {
  try {
    const raw = localStorage.getItem(DAILY_GOAL_STORAGE_KEY);
    if (raw !== null) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 5 && parsed <= 300) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_DAILY_GOAL_MINUTES;
}

/**
 * Set user-defined daily playtime goal in minutes (clamped between 5 and 300 minutes).
 */
export function setUserDailyGoalMinutes(minutes: number): void {
  try {
    const clamped = Math.max(5, Math.min(300, Math.round(minutes)));
    localStorage.setItem(DAILY_GOAL_STORAGE_KEY, clamped.toString());
  } catch {}
}

/**
 * Format session clock time into friendly readout (e.g., "24m 15s" or "1h 12m").
 */
export function formatSessionClock(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m 00s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
}
