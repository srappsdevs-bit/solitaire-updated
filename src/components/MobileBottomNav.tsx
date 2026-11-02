import React from 'react';
import { RotateCcw, RotateCw, Lightbulb, Grid, Sparkles, RefreshCw, HelpCircle, Settings, Crown, ArrowDownUp, Home } from 'lucide-react';

interface MobileBottomNavProps {
  canUndo: boolean;
  canRedo?: boolean;
  canAutoComplete: boolean;
  canAutoSort?: boolean;
  isSorting?: boolean;
  isDailyChallenge?: boolean;
  onOpenHome?: () => void;
  onUndo: () => void;
  onRedo?: () => void;
  onHint: () => void;
  onOpenGames: () => void;
  onOpenDaily: () => void;
  onAutoComplete: () => void;
  onAutoSort?: () => void;
  onRestart: () => void;
  onOpenDiagnostics: () => void;
  onOpenSettings: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  canUndo,
  canRedo = false,
  canAutoComplete,
  canAutoSort = false,
  isSorting = false,
  isDailyChallenge = false,
  onOpenHome,
  onUndo,
  onRedo,
  onHint,
  onOpenGames,
  onOpenDaily,
  onAutoComplete,
  onAutoSort,
  onRestart,
  onOpenDiagnostics,
  onOpenSettings,
}) => {
  return (
    <nav className="w-full bg-slate-950/95 border-t border-white/10 px-1 py-1.5 flex items-center justify-around z-30 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {/* Home */}
      {onOpenHome && (
        <button
          onClick={onOpenHome}
          className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl text-slate-300 hover:text-white active:scale-90 transition-all cursor-pointer"
          title="Home Hub & Overview"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-0.5 shadow-sm hover:border-amber-400/60">
            <Home className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-[9px] font-semibold tracking-tight">Home</span>
        </button>
      )}

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl transition-all ${
          canUndo
            ? 'text-slate-200 active:scale-90 hover:text-white cursor-pointer'
            : 'text-slate-600 cursor-not-allowed opacity-40'
        }`}
        title="Undo last move (Ctrl+Z)"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-0.5 shadow-sm">
          <RotateCcw className="w-3.5 h-3.5" />
        </div>
        <span className="text-[9px] font-semibold tracking-tight">Undo</span>
      </button>

      {/* Redo (Replay Last Undone Move with Pulsing Indicator) */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl transition-all ${
          canRedo
            ? 'text-slate-200 active:scale-90 hover:text-white cursor-pointer'
            : 'text-slate-600 cursor-not-allowed opacity-40'
        }`}
        title="Redo move (Ctrl+Y)"
      >
        <div className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center mb-0.5 shadow-sm transition-colors ${
          canRedo
            ? 'bg-slate-900 border-amber-400/60 text-amber-300 ring-1 ring-amber-400/20'
            : 'bg-slate-900 border-slate-700/80 text-slate-500'
        }`}>
          <RotateCw className="w-3.5 h-3.5" />
          {canRedo && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 border border-slate-950 shadow-sm shadow-amber-400/50"></span>
            </span>
          )}
        </div>
        <span className={`text-[9px] font-semibold tracking-tight ${canRedo ? 'text-amber-300 font-bold' : ''}`}>Redo</span>
      </button>

      {/* Hint */}
      <button
        onClick={onHint}
        className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl text-amber-300 active:scale-90 transition-all cursor-pointer"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center mb-0.5 shadow-sm">
          <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
        </div>
        <span className="text-[9px] font-semibold tracking-tight">Hint</span>
      </button>

      {/* Auto-Sort into Foundations */}
      <button
        onClick={onAutoSort}
        disabled={!canAutoSort && !isSorting}
        className={`flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl transition-all ${
          canAutoSort || isSorting
            ? 'text-emerald-300 active:scale-90 hover:text-white cursor-pointer'
            : 'text-slate-500 opacity-40 cursor-not-allowed'
        }`}
        title="Auto-Sort: Move eligible sequenced cards into foundations"
      >
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center mb-0.5 shadow-sm transition-all ${
          isSorting
            ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 animate-pulse ring-2 ring-emerald-400/40'
            : canAutoSort
            ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-emerald-500/20'
            : 'bg-slate-900 border-slate-700/80 text-slate-500'
        }`}>
          <ArrowDownUp className="w-3.5 h-3.5" />
        </div>
        <span className="text-[9px] font-semibold tracking-tight">Sort</span>
      </button>

      {/* Daily Challenge Crown Button */}
      <button
        onClick={onOpenDaily}
        className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl text-yellow-400 active:scale-90 transition-all"
      >
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center mb-0.5 shadow-sm ${
          isDailyChallenge
            ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/40'
            : 'bg-amber-500/20 text-amber-400 border-amber-400/40'
        }`}>
          <Crown className={`w-3.5 h-3.5 ${isDailyChallenge ? 'fill-slate-950' : 'fill-current'}`} />
        </div>
        <span className="text-[9px] font-bold text-amber-300 tracking-tight">Daily</span>
      </button>

      {/* 26 Games Center Hero Button */}
      <button
        onClick={onOpenGames}
        className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 -translate-y-2 active:scale-95 transition-all group"
      >
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center text-amber-300">
            <Grid className="w-4 h-4 text-amber-300 mb-0.5" />
            <span className="text-[8px] font-extrabold font-mono tracking-tighter leading-none">26</span>
          </div>
        </div>
        <span className="text-[9px] font-bold text-amber-300 mt-0.5">Games</span>
      </button>

      {/* Auto-Finish or Restart */}
      {canAutoComplete ? (
        <button
          onClick={onAutoComplete}
          className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl text-emerald-300 active:scale-90 transition-all animate-pulse"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mb-0.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <span className="text-[9px] font-semibold tracking-tight">Auto</span>
        </button>
      ) : (
        <button
          onClick={onRestart}
          className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl text-slate-300 active:scale-90 transition-all"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-0.5 shadow-sm">
            <RefreshCw className="w-3.5 h-3.5 text-slate-300" />
          </div>
          <span className="text-[9px] font-semibold tracking-tight">Restart</span>
        </button>
      )}

      {/* Rules & Diagnostics */}
      <button
        onClick={onOpenDiagnostics}
        className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl text-slate-300 active:scale-90 transition-all"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-0.5 shadow-sm">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-300" />
        </div>
        <span className="text-[9px] font-semibold tracking-tight">Rules</span>
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="flex-1 flex flex-col items-center justify-center py-0.5 px-0.5 rounded-xl text-slate-300 active:scale-90 transition-all hidden xs:flex"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center mb-0.5 shadow-sm">
          <Settings className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <span className="text-[9px] font-semibold tracking-tight">Theme</span>
      </button>
    </nav>
  );
};
