import React, { useState } from 'react';
import {
  X,
  Trophy,
  Clock,
  Zap,
  Percent,
  Flame,
  BarChart3,
  RotateCcw,
  ChevronDown,
  CheckCircle2,
  ShieldAlert,
  Award,
  Medal,
  Crown,
  Sparkles,
  Footprints,
  Timer,
  ShieldCheck,
  Layers,
  Compass,
  LayoutGrid,
  GitFork,
  Mountain,
  Sparkle,
  Lock,
  Star,
  Globe,
  Target,
} from 'lucide-react';
import { Achievement, GameId, DailyStreakInfo, PlayerProfile } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';
import {
  getUserStats,
  resetUserStats,
  calculateWinRate,
  formatDuration,
  formatClockTime,
  formatHoursAndMinutes,
  calculateMoveEfficiency,
  calculateAverageMovesPerWin,
  GAME_OPTIMAL_MIN_MOVES,
  UserStats,
} from '../utils/stats';
import {
  getAchievements,
  resetAchievements,
} from '../utils/achievements';
import {
  getDailyStreakInfo,
  getPlayerProfile,
  getTodayDateString,
} from '../utils/dailyChallenge';
import { DailyStreakBarChart } from './DailyStreakBarChart';
import { DailyChallengeWinFrequencyGraph } from './DailyChallengeWinFrequencyGraph';
import { WinRateTrendChart } from './WinRateTrendChart';
import { TimeSpentHeatmap } from './TimeSpentHeatmap';
import { DailyGoalProgressBar } from './DailyGoalProgressBar';
import { SessionRadialGaugeChart } from './SessionRadialGaugeChart';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGameId?: GameId;
  initialTab?: 'stats' | 'achievements';
  onOpenDailyChallenge?: () => void;
}

type TabType = 'stats' | 'achievements';
type AchievementCategoryFilter = 'all' | 'general' | 'skill' | 'speed' | 'streaks' | 'variety';

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  currentGameId = 'klondike',
  initialTab = 'stats',
  onOpenDailyChallenge,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [stats, setStats] = useState<UserStats>(() => getUserStats());
  const [achievements, setAchievements] = useState<Achievement[]>(() => getAchievements());
  const [dailyStreakInfo, setDailyStreakInfo] = useState<DailyStreakInfo>(() => getDailyStreakInfo());
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => getPlayerProfile());
  const [selectedGameFilter, setSelectedGameFilter] = useState<GameId | 'all'>('all');
  const [achievementFilter, setAchievementFilter] = useState<AchievementCategoryFilter>('all');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Sync fresh stats & achievements whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setStats(getUserStats());
      setAchievements(getAchievements());
      setDailyStreakInfo(getDailyStreakInfo());
      setPlayerProfile(getPlayerProfile());
      if (initialTab) setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const allGames = Object.values(SOLITAIRE_GAMES);

  // Global Win Counter metrics across all 26 game variants
  const totalGlobalWins = Math.max(
    stats.totalGamesWon || 0,
    Object.values(stats.byGame || {}).reduce((sum, g) => sum + (g.won || 0), 0)
  );
  const totalGlobalPlayed = Math.max(
    stats.totalGamesPlayed || 0,
    Object.values(stats.byGame || {}).reduce((sum, g) => sum + (g.played || 0), 0)
  );
  const totalGlobalLosses = Math.max(0, totalGlobalPlayed - totalGlobalWins);

  // Win-Loss Ratio percentage across all 26 variants
  const globalWinLossRatioValue = totalGlobalPlayed > 0 
    ? (totalGlobalWins / totalGlobalPlayed) * 100 
    : 0;
  const globalWinLossRatioPercentage = totalGlobalPlayed > 0
    ? (globalWinLossRatioValue % 1 === 0 
        ? `${globalWinLossRatioValue.toFixed(0)}%` 
        : `${globalWinLossRatioValue.toFixed(1)}%`)
    : '0%';
  const globalWinLossRatioNumeric = totalGlobalLosses > 0
    ? (totalGlobalWins / totalGlobalLosses).toFixed(2)
    : (totalGlobalWins > 0 ? `${totalGlobalWins}.0` : '0.0');

  const variantsWithWins = allGames.filter(g => (stats.byGame[g.id]?.won || 0) > 0).length;
  const totalVariantsCount = allGames.length; // 26 variants
  const variantConquestPercent = totalVariantsCount > 0 ? Math.round((variantsWithWins / totalVariantsCount) * 100) : 0;

  // Statistics computations
  const isAll = selectedGameFilter === 'all';
  const specificGameStats = !isAll ? stats.byGame[selectedGameFilter] : null;

  const displayPlayed = isAll ? totalGlobalPlayed : (specificGameStats?.played || 0);
  const displayWon = isAll ? totalGlobalWins : (specificGameStats?.won || 0);
  const displayLosses = Math.max(0, displayPlayed - displayWon);
  const displayWinRate = calculateWinRate(displayWon, displayPlayed);
  const displayTotalTime = isAll ? stats.totalTimePlayed : (specificGameStats?.totalTime || 0);
  const totalGlobalTimePlayed = Math.max(
    stats.totalTimePlayed || 0,
    Object.values(stats.byGame || {}).reduce((sum, g) => sum + (g.totalTime || 0), 0)
  );
  const globalPlaytimeHoursAndMinutes = formatHoursAndMinutes(totalGlobalTimePlayed);
  const displayPlaytimeHoursAndMinutes = formatHoursAndMinutes(displayTotalTime);
  const displayFastest = isAll ? stats.fastestWinTime : (specificGameStats?.fastestWin || null);
  const displayStreak = isAll ? stats.currentStreak : (specificGameStats?.currentStreak || 0);
  const displayLongest = isAll ? stats.longestStreak : (specificGameStats?.longestStreak || 0);
  const displayHighScore = !isAll ? (specificGameStats?.highScore || 0) : null;
  const displayBestMoves = !isAll ? (specificGameStats?.bestMoves || null) : null;
  const moveEfficiency = calculateMoveEfficiency(stats, selectedGameFilter, playerProfile.completedDates);
  const avgMovesInfo = calculateAverageMovesPerWin(stats, playerProfile.completedDates, selectedGameFilter);

  // Daily Goal Progress: tracking progress toward completing 3 games today across all 26 variants
  const todayStr = getTodayDateString();
  const todayRecord = stats.dailyHistory?.[todayStr];
  const todayPlayed = todayRecord?.played || 0;
  const todayWon = (todayRecord?.won || 0) + (playerProfile.completedDates?.[todayStr]?.won ? 1 : 0);
  const gamesCompletedToday = Math.max(todayWon, todayPlayed);

  // Achievements computations
  const totalUnlocked = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const totalEarnedPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.rewardPoints, 0);
  const totalMaxPoints = achievements.reduce((sum, a) => sum + a.rewardPoints, 0);
  const completionPercentage = totalCount > 0 ? Math.round((totalUnlocked / totalCount) * 100) : 0;

  const filteredAchievements = achievements.filter(a => {
    if (achievementFilter === 'all') return true;
    return a.category === achievementFilter;
  });

  const handleResetAll = () => {
    const freshStats = resetUserStats();
    const freshAchievements = resetAchievements();
    setStats(freshStats);
    setAchievements(freshAchievements);
    setShowConfirmReset(false);
  };

  const renderAchievementIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-5 h-5 ${unlocked ? 'text-amber-300' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Trophy': return <Trophy className={className} />;
      case 'Award': return <Award className={className} />;
      case 'Medal': return <Medal className={className} />;
      case 'Crown': return <Crown className={className} />;
      case 'Clock': return <Clock className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Footprints': return <Footprints className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Timer': return <Timer className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Compass': return <Compass className={className} />;
      case 'LayoutGrid': return <LayoutGrid className={className} />;
      case 'GitFork': return <GitFork className={className} />;
      case 'Mountain': return <Mountain className={className} />;
      case 'Sparkle': return <Sparkle className={className} />;
      default: return <Star className={className} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 max-h-[92vh]">
        
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                {activeTab === 'stats' ? <BarChart3 className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-white tracking-wide">
                {activeTab === 'stats' ? 'Player Statistics' : 'Player Achievements'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'stats' 
                  ? 'Track your records, streaks, and winning metrics'
                  : 'Unlock badges and earn milestone achievement points'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/70 border-b border-slate-800 gap-1.5">
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'stats'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistics</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all relative ${
              activeTab === 'achievements'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'achievements'
                  ? 'bg-slate-950/80 text-amber-300'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {totalUnlocked}/{totalCount}
            </span>
          </button>
        </div>

        {/* Content Body: Tab 1 (Statistics) */}
        {activeTab === 'stats' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Global Win Counter - All 26 Game Variants Progress Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/70 via-slate-900 to-yellow-950/50 border border-amber-500/50 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
                      <Globe className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                        Global Win Counter
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 flex items-center gap-1 font-bold">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        All 26 Variants
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-amber-400">
                        {totalGlobalWins}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-300">
                        {totalGlobalWins === 1 ? 'Total Game Won' : 'Total Games Won'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-end">
                  <div className="text-right shrink-0 bg-slate-950/70 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-amber-300/90 tracking-wider">
                      Win-Loss Ratio
                    </div>
                    <div className="text-base sm:text-lg font-black font-mono text-emerald-400">
                      {globalWinLossRatioPercentage}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <span className="text-emerald-400 font-semibold">{totalGlobalWins}W</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-400 font-semibold">{totalGlobalLosses}L</span>
                      <span className="text-slate-500">· {totalGlobalPlayed} played</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 bg-slate-950/70 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-sm">
                    <div className="text-[10px] uppercase font-bold text-amber-300/90 tracking-wider flex items-center justify-end gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      Total Playtime
                    </div>
                    <div className="text-base sm:text-lg font-black font-mono text-amber-300">
                      {globalPlaytimeHoursAndMinutes}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      All 26 variants
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress across 26 Variants */}
              <div className="mt-3.5 pt-3 border-t border-amber-500/20 relative z-10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Variant Conquest Progress</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">
                    {variantsWithWins} of {totalVariantsCount} Variants Won ({variantConquestPercent}%)
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2.5 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(variantsWithWins > 0 ? 4 : 0, variantConquestPercent)}%` }}
                  />
                </div>

                {/* 26 Variant Mini-Pill Badges */}
                <div className="flex flex-wrap gap-1 pt-1 max-h-20 overflow-y-auto pr-1">
                  {allGames.map(game => {
                    const wins = stats.byGame[game.id]?.won || 0;
                    const hasWon = wins > 0;
                    return (
                      <span
                        key={game.id}
                        onClick={() => setSelectedGameFilter(game.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer transition-all ${
                          hasWon
                            ? 'bg-amber-400/15 border-amber-400/40 text-amber-200 font-bold hover:bg-amber-400/25'
                            : 'bg-slate-950/50 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
                        }`}
                        title={`${game.name}: ${wins} ${wins === 1 ? 'win' : 'wins'}`}
                      >
                        <span>{game.icon}</span>
                        <span className="truncate max-w-[70px]">{game.name}</span>
                        {hasWon && (
                          <span className="font-mono text-[9px] text-amber-400 ml-0.5">
                            {wins}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Game Selection Filter */}
            <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Filter by Game:</span>
              </span>

              <div className="relative">
                <select
                  value={selectedGameFilter}
                  onChange={(e) => setSelectedGameFilter(e.target.value as GameId | 'all')}
                  className="bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="all">🌟 All Games (Summary)</option>
                  {allGames.map(game => (
                    <option key={game.id} value={game.id}>
                      {game.icon} {game.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Daily Goal Progress (3 Games Across Any Variant) */}
            <DailyGoalProgressBar
              completedCount={gamesCompletedToday}
              targetCount={3}
              wonCount={todayWon}
              onPlayNow={onClose}
            />

            {/* Radial Gauge Chart: Current Session Duration vs User-Defined Daily Goal (Recharts) */}
            <SessionRadialGaugeChart />

            {/* Daily Challenge Consecutive Streak Banner */}
            <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-orange-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/20">
                    <Flame className="w-6 h-6 fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs uppercase font-black text-amber-300 tracking-wider">
                        Daily Challenge Streak
                      </span>
                      {dailyStreakInfo.isCompletedToday ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Today Completed
                        </span>
                      ) : dailyStreakInfo.streakActive ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Active (Play Today)
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Streak Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Consecutive calendar days solving the universal Daily Challenge
                    </p>
                  </div>
                </div>

                {onOpenDailyChallenge && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDailyChallenge();
                    }}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Crown className="w-3.5 h-3.5 fill-current" />
                    <span className="hidden sm:inline">{dailyStreakInfo.isCompletedToday ? 'View Challenge' : 'Play Today'}</span>
                    <span className="sm:hidden">Play</span>
                  </button>
                )}
              </div>

              {/* 3 Metric Cards for Daily Streak */}
              <div className="grid grid-cols-3 gap-2">
                {/* Current Daily Streak */}
                <div className="bg-slate-950/80 border border-orange-500/30 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Daily Streak</span>
                    <Flame className={`w-3.5 h-3.5 ${dailyStreakInfo.isCompletedToday ? 'text-amber-400 fill-amber-400' : dailyStreakInfo.currentStreak > 0 ? 'text-orange-400 fill-orange-400' : 'text-slate-600'}`} />
                  </div>
                  <div className="mt-1">
                    <div className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
                      {dailyStreakInfo.currentStreak} <span className="text-xs font-sans text-slate-400 font-normal">d</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {dailyStreakInfo.isCompletedToday
                        ? '🔥 Active today'
                        : dailyStreakInfo.currentStreak > 0
                        ? '⏳ Play today to extend'
                        : '0 days streak'}
                    </div>
                  </div>
                </div>

                {/* Longest Daily Streak */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Best Streak</span>
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="mt-1">
                    <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                      {dailyStreakInfo.highestStreak} <span className="text-xs font-sans text-slate-400 font-normal">d</span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      Personal record
                    </div>
                  </div>
                </div>

                {/* Total Crowns */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-bold tracking-wider">Crowns</span>
                    <Crown className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                  </div>
                  <div className="mt-1">
                    <div className="text-xl sm:text-2xl font-black text-yellow-300 font-mono">
                      {playerProfile.totalCrowns}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {dailyStreakInfo.lastCompletedDate ? `Last: ${dailyStreakInfo.lastCompletedDate.slice(5)}` : 'No wins yet'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 30-Day Daily Streak History Bar Chart Visualization */}
            <DailyStreakBarChart
              completedDates={playerProfile.completedDates || {}}
              onOpenDailyChallenge={() => {
                onClose();
                if (onOpenDailyChallenge) onOpenDailyChallenge();
              }}
            />

            {/* Recharts 30-Day Daily Challenge Win Frequency Visual Graph */}
            <DailyChallengeWinFrequencyGraph
              completedDates={playerProfile.completedDates || {}}
              onOpenDailyChallenge={() => {
                onClose();
                if (onOpenDailyChallenge) onOpenDailyChallenge();
              }}
            />

            {/* Core Key Statistics Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* 1. Win-Loss Ratio Percentage */}
              <div className="bg-gradient-to-br from-slate-950 to-emerald-950/50 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isAll ? 'Win-Loss Ratio (All 26)' : 'Win-Loss Ratio'}
                  </span>
                  <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                    {isAll ? globalWinLossRatioPercentage : displayWinRate}
                  </div>
                  <span className="text-[10px] text-emerald-300/70 truncate block">
                    {displayWon} won / {displayLosses} lost ({displayPlayed} played)
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
              </div>

              {/* 2. Total Games Played */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Games Played</span>
                  <div className="text-2xl font-black text-white font-mono mt-0.5">
                    {displayPlayed}
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {displayPlayed - displayWon} lost or exited
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>

              {/* 3. Average Moves per Win (All 26 Variants) */}
              <div className="bg-gradient-to-br from-slate-950 to-cyan-950/40 border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isAll ? 'Avg Moves / Win (All 26)' : 'Avg Moves / Win'}
                  </span>
                  <div className="text-2xl font-black text-cyan-300 font-mono mt-0.5">
                    {avgMovesInfo.averageMoves !== null ? avgMovesInfo.averageMoves : '--'}
                    {avgMovesInfo.averageMoves !== null && (
                      <span className="text-xs font-sans text-slate-400 font-normal ml-1">moves</span>
                    )}
                  </div>
                  <span className="text-[10px] text-cyan-200/70 truncate block">
                    {avgMovesInfo.description}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shrink-0">
                  <Footprints className="w-5 h-5" />
                </div>
              </div>

              {/* 4. Fastest Winning Time */}
              <div className="bg-gradient-to-br from-slate-950 to-yellow-950/40 border border-yellow-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Fastest Win</span>
                  <div className="text-2xl font-black text-yellow-300 font-mono mt-0.5">
                    {formatClockTime(displayFastest)}
                  </div>
                  <span className="text-[10px] text-yellow-200/70 truncate block">
                    {displayFastest !== null ? 'Personal best speed' : 'No wins recorded yet'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              {/* 5. Total Playtime (Aggregating all 26 variants in hours and minutes) */}
              <div className="bg-gradient-to-br from-slate-950 to-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isAll ? 'Total Playtime (All 26)' : 'Total Playtime'}
                  </span>
                  <div className="text-2xl font-black text-amber-300 font-mono mt-0.5">
                    {isAll ? globalPlaytimeHoursAndMinutes : displayPlaytimeHoursAndMinutes}
                  </div>
                  <span className="text-[10px] text-amber-200/70 truncate block">
                    {isAll
                      ? `Aggregated across all 26 variants (${formatDuration(totalGlobalTimePlayed)})`
                      : `Playtime in this variant · All 26: ${globalPlaytimeHoursAndMinutes}`}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              {/* 6. Fewest Winning Moves Record */}
              <div className="bg-gradient-to-br from-slate-950 to-purple-950/40 border border-purple-500/30 rounded-xl p-3.5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {isAll ? 'Best Moves (All 26)' : 'Fewest Moves'}
                  </span>
                  <div className="text-2xl font-black text-purple-300 font-mono mt-0.5">
                    {avgMovesInfo.bestMoves !== null ? avgMovesInfo.bestMoves : '--'}
                    {avgMovesInfo.bestMoves !== null && (
                      <span className="text-xs font-sans text-slate-400 font-normal ml-1">moves</span>
                    )}
                  </div>
                  <span className="text-[10px] text-purple-200/70 truncate block">
                    {avgMovesInfo.bestMoves !== null ? 'Personal fewest moves record' : 'No wins recorded yet'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Move Efficiency Score Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-xl relative overflow-hidden select-none">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
                    <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                      <Target className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300">
                        Move Efficiency
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold flex items-center gap-1 ${moveEfficiency.ratingBadgeBg}`}>
                        Grade {moveEfficiency.ratingGrade} · {moveEfficiency.ratingTier}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400">
                        {moveEfficiency.scoreFormatted}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {isAll ? 'Global Efficiency vs Optimal' : `${SOLITAIRE_GAMES[selectedGameFilter]?.name} vs Optimal`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 Metric Summary Badges */}
                <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950/80 border border-slate-800 rounded-xl p-2 text-center text-xs">
                  <div className="px-2">
                    <div className="text-[10px] text-slate-400">Optimal Min</div>
                    <div className="font-mono font-bold text-amber-300">{moveEfficiency.optimalMoves}m</div>
                  </div>
                  <div className="w-px h-6 bg-slate-800" />
                  <div className="px-2">
                    <div className="text-[10px] text-slate-400">Your Record</div>
                    <div className="font-mono font-bold text-white">
                      {moveEfficiency.playerMoves !== null ? `${moveEfficiency.playerMoves}m` : '--'}
                    </div>
                  </div>
                  <div className="w-px h-6 bg-slate-800" />
                  <div className="px-2">
                    <div className="text-[10px] text-slate-400">Move Delta</div>
                    <div className={`font-mono font-bold ${moveEfficiency.moveDelta !== null && moveEfficiency.moveDelta <= 15 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {moveEfficiency.moveDelta !== null ? `+${moveEfficiency.moveDelta}` : '--'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar visual for efficiency */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 relative z-10 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{moveEfficiency.description}</span>
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {moveEfficiency.scorePercent > 0 ? `${moveEfficiency.scorePercent}% optimal execution` : 'Needs 1 completed game'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.max(moveEfficiency.scorePercent > 0 ? 5 : 0, moveEfficiency.scorePercent)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recharts 30-Day Win Rate Trend Line Graph */}
            <WinRateTrendChart
              stats={stats}
              completedDates={playerProfile.completedDates}
              selectedGameFilter={selectedGameFilter}
            />

            {/* Recharts 'Time Spent' Calendar Heatmap */}
            <TimeSpentHeatmap stats={stats} />

            {/* Secondary Stats Row: Streaks & Extras */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-xl text-center">
                <div className="text-[10px] text-slate-400">Game Win Streak</div>
                <div className="text-lg font-bold text-rose-400 font-mono flex items-center justify-center gap-1 mt-0.5">
                  <Flame className="w-4 h-4 fill-current" />
                  <span>{displayStreak}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-xl text-center">
                <div className="text-[10px] text-slate-400">Best Win Streak</div>
                <div className="text-lg font-bold text-white font-mono flex items-center justify-center gap-1 mt-0.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>{displayLongest}</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-xl text-center">
                <div className="text-[10px] text-slate-400">{!isAll ? 'High Score' : 'Global Wins'}</div>
                <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">
                  {!isAll ? displayHighScore : totalGlobalWins}
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-2.5 rounded-xl text-center">
                <div className="text-[10px] text-slate-400">{!isAll ? 'Fewest Moves' : 'Move Efficiency'}</div>
                <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">
                  {!isAll ? (displayBestMoves !== null ? `${displayBestMoves}m` : '--') : moveEfficiency.scoreFormatted}
                </div>
              </div>
            </div>

            {/* Per-Game Breakdown Table when on All Games */}
            {isAll && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Top Games Breakdown</span>
                  <span className="text-[10px] font-normal text-slate-400">Played • Won • Time • Efficiency</span>
                </div>
                <div className="divide-y divide-slate-800/60 max-h-40 overflow-y-auto text-xs">
                  {allGames.map(game => {
                    const gStat = stats.byGame[game.id];
                    const played = gStat?.played || 0;
                    const won = gStat?.won || 0;
                    const rate = calculateWinRate(won, played);
                    const fastest = formatClockTime(gStat?.fastestWin || null);
                    const optMoves = GAME_OPTIMAL_MIN_MOVES[game.id] || 52;
                    const effPercent = gStat?.bestMoves && gStat.bestMoves > 0 
                      ? Math.min(100, Math.round((optMoves / gStat.bestMoves) * 100)) 
                      : null;

                    return (
                      <div
                        key={game.id}
                        onClick={() => setSelectedGameFilter(game.id)}
                        className="px-3 py-1.5 flex items-center justify-between hover:bg-slate-900/60 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span>{game.icon}</span>
                          <span className="font-medium text-slate-200">{game.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5 font-mono text-[11px]">
                          <span className="text-slate-400">{played}P / {won}W ({rate})</span>
                          <span className="text-amber-400 font-bold">{fastest}</span>
                          <span className={`text-[10px] px-1 py-0.5 rounded font-bold ${effPercent !== null ? (effPercent >= 80 ? 'text-emerald-300 bg-emerald-500/15' : 'text-slate-300 bg-slate-800') : 'text-slate-600'}`}>
                            {effPercent !== null ? `${effPercent}%` : '--'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reset Stats section */}
            <div className="pt-2 border-t border-slate-800/80">
              {showConfirmReset ? (
                <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Are you sure you want to reset all game statistics and achievements?</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResetAll}
                      className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Yes, Reset Everything
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-950/60 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-800/40 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Data & Achievements</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body: Tab 2 (Achievements) */}
        {activeTab === 'achievements' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {/* Achievement Summary Progress Card */}
            <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-yellow-950/40 border border-amber-500/40 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-md shadow-amber-500/30 text-slate-950">
                    <Trophy className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">Mastery Progress</div>
                    <div className="text-xl font-black text-white font-serif">
                      {totalUnlocked} of {totalCount} Unlocked
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Achievement Score</div>
                  <div className="text-xl font-black text-amber-300 font-mono">
                    {totalEarnedPoints} <span className="text-xs text-amber-400/70 font-normal">/ {totalMaxPoints} pts</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950/80 rounded-full h-3 p-0.5 border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-[11px] font-semibold text-slate-400">
                <span>{completionPercentage}% Complete</span>
                <span>{totalCount - totalUnlocked} badges remaining</span>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {(
                [
                  { id: 'all', label: 'All Badges' },
                  { id: 'general', label: 'General' },
                  { id: 'skill', label: 'Skill' },
                  { id: 'speed', label: 'Speed' },
                  { id: 'streaks', label: 'Streaks' },
                  { id: 'variety', label: 'Variants (26)' },
                ] as { id: AchievementCategoryFilter; label: string }[]
              ).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setAchievementFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all text-xs ${
                    achievementFilter === cat.id
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-950/70 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Achievements List */}
            <div className="space-y-2.5">
              {filteredAchievements.map(ach => {
                const isComplete = ach.unlocked;
                const progressPercent = ach.maxProgress > 0 
                  ? Math.min(100, Math.round((ach.progress / ach.maxProgress) * 100))
                  : 0;

                return (
                  <div
                    key={ach.id}
                    className={`relative p-3.5 rounded-xl border transition-all ${
                      isComplete
                        ? 'bg-gradient-to-r from-slate-950/90 to-amber-950/30 border-amber-500/50 shadow-sm shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon Avatar */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                          isComplete
                            ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border-amber-400/50 shadow-inner'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        {renderAchievementIcon(ach.icon, isComplete)}
                      </div>

                      {/* Info & Description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-bold truncate ${isComplete ? 'text-amber-200' : 'text-slate-300'}`}>
                            {ach.title}
                          </h4>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isComplete
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            +{ach.rewardPoints} pts
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {ach.description}
                        </p>

                        {/* Progress or Completion Stamp */}
                        <div className="mt-2.5 flex items-center justify-between gap-3">
                          {isComplete ? (
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Completed</span>
                              {ach.unlockedAt && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  • {new Date(ach.unlockedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 bg-slate-900 rounded-full h-1.5 border border-slate-800 overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full rounded-full"
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {ach.id === 'devoted_player'
                                  ? `${Math.round(ach.progress / 60)}/30 min`
                                  : `${ach.progress}/${ach.maxProgress}`}
                              </span>
                            </div>
                          )}

                          <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            {ach.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {activeTab === 'achievements' ? (
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Earn crowns & clear variants to unlock more!</span>
              </span>
            ) : (
              <span>Personal records update automatically</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
