import React from 'react';
import { Volume2, VolumeX, Smartphone, Monitor, ShieldCheck, ChevronDown, Crown, Trophy, Columns2, Flame, Dices, GraduationCap, BookOpen, Home } from 'lucide-react';
import { GameId, PlayerSettings } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';

interface HeaderHUDProps {
  gameId: GameId;
  moves: number;
  timeSeconds: number;
  score: number;
  settings: PlayerSettings;
  isMobileDeviceFrame: boolean;
  isDailyChallenge?: boolean;
  dailyDate?: string;
  dailyStreak?: number;
  isDailyCompletedToday?: boolean;
  onOpenHome?: () => void;
  onToggleDeviceFrame: () => void;
  onOpenGameSelector: () => void;
  onOpenDiagnostics: () => void;
  onOpenDailyChallenge: () => void;
  onOpenAchievements?: () => void;
  onCycleLandscapeLayout?: () => void;
  onToggleSound: () => void;
  onOpenSettings?: () => void;
  onCycleDifficulty?: () => void;
  onOpenTutorial?: () => void;
  onOpenRules?: () => void;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  gameId,
  moves,
  timeSeconds,
  score,
  settings,
  isMobileDeviceFrame,
  isDailyChallenge = false,
  dailyDate,
  dailyStreak = 0,
  isDailyCompletedToday = false,
  onOpenHome,
  onToggleDeviceFrame,
  onOpenGameSelector,
  onOpenDiagnostics,
  onOpenDailyChallenge,
  onOpenAchievements,
  onCycleLandscapeLayout,
  onToggleSound,
  onOpenSettings,
  onCycleDifficulty,
  onOpenTutorial,
  onOpenRules,
}) => {
  const gameDef = SOLITAIRE_GAMES[gameId];

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="w-full bg-slate-950/90 border-b border-white/10 px-3 py-2 flex flex-col gap-1.5 z-30 select-none backdrop-blur-md">
      {/* Top Android App Bar */}
      <div className="flex items-center justify-between">
        {/* Game Title with Selector Button, Daily Challenge, & Daily Streak */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Home Hub Button */}
          {onOpenHome && (
            <button
              onClick={onOpenHome}
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-400/80 text-slate-200 hover:text-amber-300 text-xs font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
              title="Home Hub: Overview, 26 Games, Daily Challenge & Records"
              aria-label="Home"
            >
              <Home className="w-4 h-4 text-amber-400" />
              <span className="hidden xs:inline">Home</span>
            </button>
          )}

          <button
            onClick={onOpenGameSelector}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-xl border transition-all ${
              isDailyChallenge
                ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/30'
                : 'bg-slate-900 border-amber-500/30 hover:border-amber-400'
            }`}
          >
            <span className="text-base sm:text-lg leading-none">{gameDef.icon}</span>
            <div className="text-left flex items-center gap-1">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {gameDef.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </button>

          {/* Special Daily Challenge Crown Badge */}
          {isDailyChallenge ? (
            <button
              onClick={onOpenDailyChallenge}
              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border border-amber-400/60 text-amber-300 text-[10px] font-bold shadow-sm animate-pulse"
              title="Daily Challenge Mode - Compete for Global Leaderboard Rank"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>{dailyDate}</span>
            </button>
          ) : (
            <button
              onClick={onOpenDailyChallenge}
              className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-[11px] font-black shadow-sm active:scale-95 transition-all"
              title="Play Today's Seeded Daily Challenge"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>Daily</span>
            </button>
          )}

          {/* Daily Streak Counter Badge */}
          <button
            onClick={onOpenDailyChallenge}
            className={`flex items-center gap-1 py-1 px-2 rounded-lg border text-[11px] font-bold font-mono transition-all active:scale-95 ${
              isDailyCompletedToday
                ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/20 border-amber-400/60 text-amber-300 shadow-sm shadow-amber-500/10'
                : dailyStreak > 0
                ? 'bg-gradient-to-r from-orange-500/15 to-amber-500/10 border-orange-500/30 text-orange-400 hover:border-orange-400/60'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
            title={
              isDailyCompletedToday
                ? `Daily Streak: ${dailyStreak} day${dailyStreak === 1 ? '' : 's'} (Completed today! 🔥)`
                : dailyStreak > 0
                ? `Daily Streak: ${dailyStreak} day${dailyStreak === 1 ? '' : 's'} (Complete today's challenge to keep streak alive!)`
                : 'Daily Streak: 0 days (Complete today\'s challenge to start a streak!)'
            }
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                isDailyCompletedToday
                  ? 'text-amber-400 fill-amber-400 animate-pulse'
                  : dailyStreak > 0
                  ? 'text-orange-400 fill-orange-400'
                  : 'text-slate-500'
              }`}
            />
            <span className={isDailyCompletedToday ? 'text-amber-300' : dailyStreak > 0 ? 'text-orange-300' : 'text-slate-400'}>
              {dailyStreak}
            </span>
            <span className="hidden xs:inline text-[9px] font-sans font-semibold text-slate-400">
              {dailyStreak === 1 ? 'day' : 'days'}
            </span>
          </button>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-1.5">
          {/* Context-Aware Game Rules Button */}
          {onOpenRules && (
            <button
              onClick={onOpenRules}
              className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-500/15 border border-amber-500/35 hover:border-amber-400/70 text-amber-300 hover:text-amber-200 text-[11px] font-bold active:scale-95 transition-all shadow-sm cursor-pointer"
              title={`View rules, mechanics, and objectives for ${gameDef.name}`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Rules</span>
            </button>
          )}

          {/* Klondike Interactive Tutorial Button */}
          {onOpenTutorial && (gameId === 'klondike' || gameId === 'klondike3') && (
            <button
              onClick={onOpenTutorial}
              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold active:scale-95 transition-all hover:bg-indigo-500/25 shadow-sm"
              title="Open Interactive Klondike Move Tutorial & Rules Guide"
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden xs:inline">Tutorial</span>
            </button>
          )}

          {/* Achievements Button */}
          {onOpenAchievements && (
            <button
              onClick={onOpenAchievements}
              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold active:scale-95 transition-all hover:bg-amber-500/25"
              title="View Solitaire Achievements & Milestones"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xs:inline">Badges</span>
            </button>
          )}

          {/* Difficulty Level Indicator / Quick Cycle */}
          {!isDailyChallenge && (
            <button
              onClick={onCycleDifficulty || onOpenSettings}
              className={`flex items-center gap-1 py-1 px-2 rounded-lg border text-[10px] font-bold uppercase transition-all active:scale-95 ${
                (settings.difficultyLevel || 'easy') === 'easy'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:border-emerald-400/60'
                  : (settings.difficultyLevel || 'easy') === 'medium'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:border-amber-400/60'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:border-rose-400/60'
              }`}
              title={`Deal Difficulty: ${(settings.difficultyLevel || 'easy').toUpperCase()} (Click to cycle Easy / Medium / Hard)`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>{settings.difficultyLevel || 'easy'}</span>
            </button>
          )}

          {/* Audit / All 26 Fixed Badge */}
          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1 py-1 px-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold active:scale-95 transition-all"
            title="View 26 Variants & Bugfix Diagnostics"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">26 Fixed</span>
          </button>

          {/* Device Frame Toggle (Mobile Phone shell vs Fullscreen) */}
          <button
            onClick={onToggleDeviceFrame}
            className="hidden sm:flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-300 text-xs active:scale-95 transition-all"
            title={isMobileDeviceFrame ? 'Switch to Fullscreen Table' : 'Switch to Android Phone Preview'}
          >
            {isMobileDeviceFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px]">Full View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Phone Frame</span>
              </>
            )}
          </button>

          {/* Landscape Layout Mode Toggle */}
          {onCycleLandscapeLayout && (
            <button
              onClick={onCycleLandscapeLayout}
              className="flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-slate-300 text-xs active:scale-95 transition-all"
              title={`Board Layout: ${settings.landscapeLayout || 'auto'} (Click to cycle)`}
            >
              <Columns2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline text-[10px] capitalize">
                {settings.landscapeLayout === 'top'
                  ? 'Top Bar'
                  : settings.landscapeLayout === 'split'
                  ? 'Split'
                  : settings.landscapeLayout === 'side-left'
                  ? 'Left Dock'
                  : 'Auto Layout'}
              </span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-90 transition-all"
            title="Toggle Sound FX"
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>
      </div>

      {/* Live Mobile Stats Bar (Score, Time, Moves) */}
      <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 px-3 py-1 rounded-lg text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-slate-400">Score</span>
          <span className="font-bold text-amber-300">{score}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-slate-400">Moves</span>
          <span className="font-bold text-white">{moves}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase text-slate-400">Time</span>
          <span className="font-bold text-slate-200">{formatTime(timeSeconds)}</span>
        </div>
      </div>
    </header>
  );
};
