import { Achievement, GameId } from '../types/solitaire';
import { getUserStats } from './stats';
import { getPlayerProfile } from './dailyChallenge';

const ACHIEVEMENTS_STORAGE_KEY = 'solitaire_achievements_v3';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  // General Milestones
  {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win your very first game of Solitaire.',
    icon: 'Trophy',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 50,
  },
  {
    id: 'win_10',
    title: 'Decathlete',
    description: 'Win 10 games across any Solitaire variants.',
    icon: 'Award',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    rewardPoints: 150,
  },
  {
    id: 'win_25',
    title: 'Quarter Century',
    description: 'Win 25 games across any Solitaire variants.',
    icon: 'Medal',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 25,
    rewardPoints: 300,
  },
  {
    id: 'win_50',
    title: 'Centurion Club',
    description: 'Win 50 games across any Solitaire variants.',
    icon: 'Crown',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 50,
    rewardPoints: 600,
  },
  {
    id: 'devoted_player',
    title: 'Endurance Master',
    description: 'Play for over 30 minutes of total game time.',
    icon: 'Clock',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 1800, // 30 minutes = 1800s
    rewardPoints: 100,
  },

  // Skill Milestones
  {
    id: 'perfect_game',
    title: 'First Perfect Game',
    description: 'Win a complete game without using Undo or Hints.',
    icon: 'Sparkles',
    category: 'skill',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 250,
  },
  {
    id: 'minimalist',
    title: 'Minimalist Tactician',
    description: 'Win any game in fewer than 90 moves.',
    icon: 'Footprints',
    category: 'skill',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 200,
  },
  {
    id: 'high_scorer',
    title: 'High Roller',
    description: 'Score over 1,500 points in a single game.',
    icon: 'Flame',
    category: 'skill',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 150,
  },

  // Speed Milestones
  {
    id: 'fastest_win',
    title: 'Fastest Win',
    description: 'Win any Solitaire game in under 2 minutes (120s).',
    icon: 'Zap',
    category: 'speed',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 200,
  },
  {
    id: 'lightning_win',
    title: 'Lightning Reflexes',
    description: 'Win any Solitaire game in under 90 seconds.',
    icon: 'Timer',
    category: 'speed',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 350,
  },

  // Streak Milestones
  {
    id: 'streak_3',
    title: 'Hot Streak',
    description: 'Achieve a winning streak of 3 games.',
    icon: 'Flame',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    rewardPoints: 150,
  },
  {
    id: 'streak_5',
    title: 'Unstoppable Force',
    description: 'Achieve a winning streak of 5 games in a row.',
    icon: 'ShieldCheck',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    rewardPoints: 300,
  },

  // Variety Milestones (The 26 Variants)
  {
    id: 'variety_5',
    title: 'Variant Master',
    description: 'Win at least 5 different Solitaire game variants.',
    icon: 'Layers',
    category: 'variety',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    rewardPoints: 200,
  },
  {
    id: 'variety_10',
    title: 'Grandmaster of 10',
    description: 'Win at least 10 different Solitaire game variants.',
    icon: 'Compass',
    category: 'variety',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
    rewardPoints: 400,
  },
  {
    id: 'freecell_expert',
    title: 'FreeCell Prodigy',
    description: 'Win a full game of FreeCell.',
    icon: 'LayoutGrid',
    category: 'variety',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 150,
  },
  {
    id: 'spider_sovereign',
    title: 'Spider Sovereign',
    description: 'Win any Spider variant (1, 2, or 4 Suits).',
    icon: 'GitFork',
    category: 'variety',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 150,
  },
  {
    id: 'pyramid_conqueror',
    title: 'Pharaoh’s Triumph',
    description: 'Win a game of Pyramid or TriPeaks.',
    icon: 'Mountain',
    category: 'variety',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 150,
  },

  // Daily Challenge Milestones
  {
    id: 'daily_crown',
    title: 'First Crown',
    description: 'Complete and win your first Daily Challenge.',
    icon: 'Crown',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 1,
    rewardPoints: 100,
  },
  {
    id: 'crown_collector',
    title: 'Crown Jewels',
    description: 'Earn 5 Daily Challenge crowns.',
    icon: 'Sparkle',
    category: 'general',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
    rewardPoints: 250,
  },
  {
    id: 'daily_streak_3',
    title: 'Daily Devotee',
    description: 'Complete the Daily Challenge 3 days in a row.',
    icon: 'Flame',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 3,
    rewardPoints: 200,
  },
  {
    id: 'daily_streak_7',
    title: 'Week of Royalty',
    description: 'Achieve a 7-day consecutive Daily Challenge streak.',
    icon: 'Crown',
    category: 'streaks',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    rewardPoints: 500,
  },
];

export function getAchievements(): Achievement[] {
  if (typeof window === 'undefined') return INITIAL_ACHIEVEMENTS;

  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    if (!raw) {
      // First time initialization: sync with current stats in case player already played
      return syncWithCurrentStats(INITIAL_ACHIEVEMENTS);
    }
    const stored = JSON.parse(raw) as Achievement[];
    
    // Ensure all defined initial achievements exist (in case new ones were added)
    const storedMap = new Map(stored.map(a => [a.id, a]));
    const merged: Achievement[] = INITIAL_ACHIEVEMENTS.map(initial => {
      const existing = storedMap.get(initial.id);
      if (existing) {
        return {
          ...initial,
          unlocked: existing.unlocked,
          unlockedAt: existing.unlockedAt,
          progress: existing.progress,
        };
      }
      return initial;
    });

    return syncWithCurrentStats(merged);
  } catch (e) {
    console.error('Failed to load achievements:', e);
    return INITIAL_ACHIEVEMENTS;
  }
}

export function saveAchievements(achievements: Achievement[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  } catch (e) {
    console.error('Failed to save achievements:', e);
  }
}

export function resetAchievements(): Achievement[] {
  const fresh = INITIAL_ACHIEVEMENTS.map(a => ({
    ...a,
    unlocked: false,
    unlockedAt: undefined,
    progress: 0,
  }));
  saveAchievements(fresh);
  return fresh;
}

export interface GameWinContext {
  gameId: GameId;
  timeSeconds: number;
  moves: number;
  score: number;
  usedUndo: boolean;
  usedHint: boolean;
  isDailyChallenge?: boolean;
}

/**
 * Check achievements upon winning a game and return any newly unlocked badges.
 */
export function checkAchievementsOnWin(context: GameWinContext): {
  newlyUnlocked: Achievement[];
  allAchievements: Achievement[];
} {
  const current = getAchievements();
  const stats = getUserStats();
  const dailyProfile = getPlayerProfile();
  const newlyUnlocked: Achievement[] = [];
  const now = Date.now();

  // Count distinct variants won
  const variantsWonCount = Object.values(stats.byGame).filter(g => g.won > 0).length;

  const updated = current.map(item => {
    if (item.unlocked) return item; // Already unlocked

    let shouldUnlock = false;
    let newProgress = item.progress;

    switch (item.id) {
      case 'first_win':
        newProgress = Math.min(item.maxProgress, stats.totalGamesWon);
        shouldUnlock = stats.totalGamesWon >= 1;
        break;

      case 'win_10':
        newProgress = Math.min(item.maxProgress, stats.totalGamesWon);
        shouldUnlock = stats.totalGamesWon >= 10;
        break;

      case 'win_25':
        newProgress = Math.min(item.maxProgress, stats.totalGamesWon);
        shouldUnlock = stats.totalGamesWon >= 25;
        break;

      case 'win_50':
        newProgress = Math.min(item.maxProgress, stats.totalGamesWon);
        shouldUnlock = stats.totalGamesWon >= 50;
        break;

      case 'devoted_player':
        newProgress = Math.min(item.maxProgress, stats.totalTimePlayed);
        shouldUnlock = stats.totalTimePlayed >= 1800;
        break;

      case 'perfect_game':
        // Win without undo and without hints
        if (!context.usedUndo && !context.usedHint) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'minimalist':
        if (context.moves < 90) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'high_scorer':
        if (context.score >= 1500) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'fastest_win':
        if (context.timeSeconds < 120) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'lightning_win':
        if (context.timeSeconds < 90) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'streak_3':
        newProgress = Math.min(item.maxProgress, Math.max(item.progress, stats.currentStreak, stats.longestStreak));
        shouldUnlock = stats.currentStreak >= 3 || stats.longestStreak >= 3;
        break;

      case 'streak_5':
        newProgress = Math.min(item.maxProgress, Math.max(item.progress, stats.currentStreak, stats.longestStreak));
        shouldUnlock = stats.currentStreak >= 5 || stats.longestStreak >= 5;
        break;

      case 'variety_5':
        newProgress = Math.min(item.maxProgress, variantsWonCount);
        shouldUnlock = variantsWonCount >= 5;
        break;

      case 'variety_10':
        newProgress = Math.min(item.maxProgress, variantsWonCount);
        shouldUnlock = variantsWonCount >= 10;
        break;

      case 'freecell_expert':
        if (context.gameId === 'freecell') {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'spider_sovereign':
        if (context.gameId === 'spider1' || context.gameId === 'spider2' || context.gameId === 'spider4') {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'pyramid_conqueror':
        if (context.gameId === 'pyramid' || context.gameId === 'tripeaks') {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'daily_crown':
        if (context.isDailyChallenge || dailyProfile.totalCrowns >= 1) {
          newProgress = 1;
          shouldUnlock = true;
        }
        break;

      case 'crown_collector':
        const crowns = dailyProfile.totalCrowns + (context.isDailyChallenge ? 1 : 0);
        newProgress = Math.min(item.maxProgress, crowns);
        shouldUnlock = crowns >= 5;
        break;

      case 'daily_streak_3': {
        const streak = Math.max(dailyProfile.currentStreak, dailyProfile.highestStreak);
        newProgress = Math.min(item.maxProgress, streak);
        shouldUnlock = streak >= 3;
        break;
      }

      case 'daily_streak_7': {
        const streak = Math.max(dailyProfile.currentStreak, dailyProfile.highestStreak);
        newProgress = Math.min(item.maxProgress, streak);
        shouldUnlock = streak >= 7;
        break;
      }

      default:
        break;
    }

    if (shouldUnlock) {
      const unlockedItem: Achievement = {
        ...item,
        unlocked: true,
        unlockedAt: now,
        progress: item.maxProgress,
      };
      newlyUnlocked.push(unlockedItem);
      return unlockedItem;
    }

    return {
      ...item,
      progress: Math.max(item.progress, newProgress),
    };
  });

  saveAchievements(updated);

  return {
    newlyUnlocked,
    allAchievements: updated,
  };
}

/**
 * Re-sync progress against current stats and profiles (called periodically or on load)
 */
function syncWithCurrentStats(list: Achievement[]): Achievement[] {
  const stats = getUserStats();
  const dailyProfile = getPlayerProfile();
  const variantsWonCount = Object.values(stats.byGame).filter(g => g.won > 0).length;

  return list.map(item => {
    let p = item.progress;
    let unlocked = item.unlocked;

    switch (item.id) {
      case 'first_win':
        p = Math.min(item.maxProgress, stats.totalGamesWon);
        if (stats.totalGamesWon >= 1) unlocked = true;
        break;
      case 'win_10':
        p = Math.min(item.maxProgress, stats.totalGamesWon);
        if (stats.totalGamesWon >= 10) unlocked = true;
        break;
      case 'win_25':
        p = Math.min(item.maxProgress, stats.totalGamesWon);
        if (stats.totalGamesWon >= 25) unlocked = true;
        break;
      case 'win_50':
        p = Math.min(item.maxProgress, stats.totalGamesWon);
        if (stats.totalGamesWon >= 50) unlocked = true;
        break;
      case 'devoted_player':
        p = Math.min(item.maxProgress, stats.totalTimePlayed);
        if (stats.totalTimePlayed >= 1800) unlocked = true;
        break;
      case 'streak_3':
        p = Math.min(item.maxProgress, Math.max(item.progress, stats.currentStreak, stats.longestStreak));
        if (stats.currentStreak >= 3 || stats.longestStreak >= 3) unlocked = true;
        break;
      case 'streak_5':
        p = Math.min(item.maxProgress, Math.max(item.progress, stats.currentStreak, stats.longestStreak));
        if (stats.currentStreak >= 5 || stats.longestStreak >= 5) unlocked = true;
        break;
      case 'fastest_win':
        if (stats.fastestWinTime !== null && stats.fastestWinTime < 120) {
          p = 1;
          unlocked = true;
        }
        break;
      case 'lightning_win':
        if (stats.fastestWinTime !== null && stats.fastestWinTime < 90) {
          p = 1;
          unlocked = true;
        }
        break;
      case 'variety_5':
        p = Math.min(item.maxProgress, variantsWonCount);
        if (variantsWonCount >= 5) unlocked = true;
        break;
      case 'variety_10':
        p = Math.min(item.maxProgress, variantsWonCount);
        if (variantsWonCount >= 10) unlocked = true;
        break;
      case 'freecell_expert':
        if (stats.byGame['freecell']?.won > 0) {
          p = 1;
          unlocked = true;
        }
        break;
      case 'spider_sovereign':
        if (
          (stats.byGame['spider1']?.won || 0) > 0 ||
          (stats.byGame['spider2']?.won || 0) > 0 ||
          (stats.byGame['spider4']?.won || 0) > 0
        ) {
          p = 1;
          unlocked = true;
        }
        break;
      case 'pyramid_conqueror':
        if (
          (stats.byGame['pyramid']?.won || 0) > 0 ||
          (stats.byGame['tripeaks']?.won || 0) > 0
        ) {
          p = 1;
          unlocked = true;
        }
        break;
      case 'daily_crown':
        if (dailyProfile.totalCrowns >= 1) {
          p = 1;
          unlocked = true;
        }
        break;
      case 'crown_collector':
        p = Math.min(item.maxProgress, dailyProfile.totalCrowns);
        if (dailyProfile.totalCrowns >= 5) unlocked = true;
        break;
      case 'daily_streak_3': {
        const streak = Math.max(dailyProfile.currentStreak, dailyProfile.highestStreak);
        p = Math.min(item.maxProgress, streak);
        if (streak >= 3) unlocked = true;
        break;
      }
      case 'daily_streak_7': {
        const streak = Math.max(dailyProfile.currentStreak, dailyProfile.highestStreak);
        p = Math.min(item.maxProgress, streak);
        if (streak >= 7) unlocked = true;
        break;
      }
      default:
        break;
    }

    if (unlocked && !item.unlocked) {
      return {
        ...item,
        unlocked: true,
        unlockedAt: item.unlockedAt || Date.now(),
        progress: item.maxProgress,
      };
    }

    return {
      ...item,
      progress: Math.max(item.progress, p),
    };
  });
}
