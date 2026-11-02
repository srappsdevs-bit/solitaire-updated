import React from 'react';
import {
  X,
  Play,
  RotateCcw,
  Crown,
  Grid,
  BarChart3,
  BookOpen,
  Settings,
  Sparkles,
  Flame,
  Clock,
  Layers,
  ChevronRight,
  Shield,
  HelpCircle,
  Trophy,
} from 'lucide-react';
import { GameId, PlayerSettings, DifficultyLevel } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';
import { UserStats, getUserStats } from '../utils/stats';
import { DailyStreakInfo } from '../types/solitaire';

interface HomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGameId: GameId;
  currentDifficulty?: DifficultyLevel;
  currentMoves: number;
  currentTimeSeconds: number;
  currentScore: number;
  isDailyChallengeActive: boolean;
  dailyStreakInfo: DailyStreakInfo;
  todayDateStr: string;
  onSelectGame: (id: GameId) => void;
  onRestartCurrentGame: () => void;
  onOpenDailyChallenge: () => void;
  onOpenGameSelector: () => void;
  onOpenStats: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
  onOpenTutorial?: () => void;
}

export const HomeModal: React.FC<HomeModalProps> = ({
  isOpen,
  onClose,
  currentGameId,
  currentDifficulty,
  currentMoves,
  currentTimeSeconds,
  currentScore,
  isDailyChallengeActive,
  dailyStreakInfo,
  todayDateStr,
  onSelectGame,
  onRestartCurrentGame,
  onOpenDailyChallenge,
  onOpenGameSelector,
  onOpenStats,
  onOpenRules,
  onOpenSettings,
  onOpenTutorial,
}) => {
  if (!isOpen) return null;

  const currentGame = SOLITAIRE_GAMES[currentGameId];
  const stats: UserStats = getUserStats();
  const winRate = stats.totalGamesPlayed > 0
    ? Math.round((stats.totalGamesWon / stats.totalGamesPlayed) * 100)
    : 0;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Popular quick-launch game list
  const popularGames: GameId[] = ['klondike', 'freecell', 'spider2', 'pyramid', 'yukon', 'tripeaks'];

  const hasGameInProgress = currentMoves > 0 || currentTimeSeconds > 10;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-white tracking-wide flex items-center gap-2">
                <span>Solitaire Hub</span>
                <span className="text-[10px] font-sans font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  26 Games
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Master classic cards, daily challenges & puzzles
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Table (Esc)"
            aria-label="Close Home Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Active Game Resume / Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-amber-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl leading-none">{currentGame.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                      {isDailyChallengeActive ? 'Daily Challenge In Progress' : 'Current Table'}
                    </span>
                    {hasGameInProgress && (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        In Play
                      </span>
                    )}
                    {currentDifficulty && !isDailyChallengeActive && (
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase border ${
                        currentDifficulty === 'easy'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : currentDifficulty === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {currentDifficulty}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {currentGame.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-300 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentMoves} moves</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatTime(currentTimeSeconds)}</span>
                    </span>
                    <span className="text-amber-300 font-bold">
                      {currentScore} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  title="Return to currently playing game"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>

                <button
                  onClick={() => {
                    onRestartCurrentGame();
                    onClose();
                  }}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors active:scale-95 cursor-pointer"
                  title="Deal a fresh game"
                  aria-label="Restart Current Game"
                >
                  <RotateCcw className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Core Hub Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. Daily Challenge Card */}
            <div
              onClick={() => {
                onClose();
                onOpenDailyChallenge();
              }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/40 hover:border-amber-400 transition-all cursor-pointer shadow-md group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center shadow">
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                    <Crown className="w-5 h-5 text-amber-400 fill-current" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      Daily Challenge
                    </span>
                    {dailyStreakInfo.isCompletedToday && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Won!
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{todayDateStr}</span>
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Flame className="w-3 h-3 fill-current" />
                      <span>{dailyStreakInfo.currentStreak} day streak</span>
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* 2. 26 Games Catalog Card */}
            <div
              onClick={() => {
                onClose();
                onOpenGameSelector();
              }}
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/60 transition-all cursor-pointer shadow-md group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow">
                  <Grid className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    26 Solitaire Games
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Classic, FreeCell, Spider, Builders & Puzzles
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* 3. Stats & Achievements */}
            <div
              onClick={() => {
                onClose();
                onOpenStats();
              }}
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/60 transition-all cursor-pointer shadow-md group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shadow">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Stats & Records
                  </span>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{stats.totalGamesWon} wins</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">{winRate}% win rate</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* 4. Rules & How To Play */}
            <div
              onClick={() => {
                onClose();
                onOpenRules();
              }}
              className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-amber-400/60 transition-all cursor-pointer shadow-md group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shadow">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Game Rules & Guide
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mechanics & strategies for all 26 variants
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Quick-Play Popular Solitaire Games */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Play Top Games</span>
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenGameSelector();
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
              >
                View all 26 &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {popularGames.map((id) => {
                const game = SOLITAIRE_GAMES[id];
                if (!game) return null;
                const isSelected = currentGameId === id;

                return (
                  <button
                    key={id}
                    onClick={() => {
                      onSelectGame(id);
                      onClose();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/80 ring-1 ring-amber-400/40 text-amber-300'
                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl leading-none">{game.icon}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        game.difficulty === 'Easy'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : game.difficulty === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {game.difficulty}
                      </span>
                    </div>
                    <div className="text-xs font-bold truncate">
                      {game.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">
                      {game.decks} deck{game.decks > 1 ? 's' : ''} • {game.category}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Settings & Themes Footer Bar */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Settings & Themes</span>
            </button>

            {onOpenTutorial && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTutorial();
                }}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Klondike Tutorial</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
