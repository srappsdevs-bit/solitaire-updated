import React, { useState, useMemo } from 'react';
import { TrendingUp, Zap, ChevronDown, ChevronUp, X, ShieldAlert, Sparkles, Eye, Layers } from 'lucide-react';
import { SolitaireState } from '../games/engine';
import { calculateGameMetrics } from '../utils/gameMetrics';

interface GameInfoOverlayProps {
  state: SolitaireState;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
}

export const GameInfoOverlay: React.FC<GameInfoOverlayProps> = ({
  state,
  isVisible,
  onClose,
  className = '',
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const metrics = useMemo(() => {
    return calculateGameMetrics(state);
  }, [state]);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Game Info Telemetry Overlay"
      className={`absolute z-30 transition-all duration-200 select-none ${className}`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Semi-transparent Glass Container */}
      <div className="backdrop-blur-md bg-slate-950/85 border border-white/15 rounded-2xl shadow-2xl shadow-black/60 text-slate-100 overflow-hidden transition-all duration-300 w-[240px] sm:w-[260px]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
              <TrendingUp className="w-3 h-3" />
            </div>
            <span className="text-[11px] font-bold tracking-wide uppercase text-slate-200 truncate">
              Game Info
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(prev => !prev)}
              aria-label={isMinimized ? "Expand Game Info" : "Minimize Game Info"}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isMinimized ? "Expand metrics" : "Minimize to pill"}
            >
              {isMinimized ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Close / Hide Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Game Info Overlay"
              className="p-1 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title="Hide overlay (can re-enable in Settings)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Minimized Compact View (Pill Strip) */}
        {isMinimized ? (
          <div
            onClick={() => setIsMinimized(false)}
            className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black ${metrics.winProbabilityColor}`}>
                {metrics.winProbability}%
              </span>
              <span className="text-[10px] text-slate-400">Win</span>
            </div>

            <div className="h-3 w-px bg-white/15" />

            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black ${metrics.efficiencyColor}`}>
                {metrics.moveEfficiency}%
              </span>
              <span className="text-[9px] font-bold px-1 rounded bg-white/10 text-slate-300">
                Grade {metrics.efficiencyGrade}
              </span>
            </div>
          </div>
        ) : (
          /* Expanded Full Telemetry Content */
          <div className="p-3 space-y-2.5 text-xs">
            {/* 1. Win Probability Gauge */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <span>Win Probability</span>
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={metrics.winProbabilityColor}>
                    {metrics.winProbability}%
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 font-semibold">
                    {metrics.winProbabilityLabel}
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-1.5 rounded-full bg-slate-800/90 overflow-hidden p-0.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${metrics.winProbabilityBg}`}
                  style={{ width: `${Math.max(4, metrics.winProbability)}%` }}
                />
              </div>
            </div>

            {/* 2. Move Efficiency Metric */}
            <div className="pt-2 border-t border-white/10 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Move Efficiency</span>
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={metrics.efficiencyColor}>
                    {metrics.moveEfficiency}%
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-black border ${
                    metrics.efficiencyGrade === 'S'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                      : metrics.efficiencyGrade === 'A'
                      ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-slate-800 text-slate-300 border-white/10'
                  }`}>
                    {metrics.efficiencyGrade}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{metrics.efficiencyLabel}</span>
                <span>{state.moves} {state.moves === 1 ? 'move' : 'moves'} taken</span>
              </div>
            </div>

            {/* 3. Board Real-time Telemetry Grid */}
            <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-1.5 text-[10px]">
              {/* Cleared Cards */}
              <div className="p-1.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                  <span>Cleared</span>
                </span>
                <span className="text-xs font-bold text-slate-200 mt-0.5">
                  {metrics.clearedCards} / {metrics.totalTargetCards}
                </span>
              </div>

              {/* Legal Moves Available */}
              <div className="p-1.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5 text-teal-400" />
                  <span>Legal Moves</span>
                </span>
                <span className="text-xs font-bold text-teal-300 mt-0.5">
                  {metrics.legalMovesCount} available
                </span>
              </div>

              {/* Hidden Cards */}
              <div className="p-1.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5 text-indigo-400" />
                  <span>Face-Down</span>
                </span>
                <span className="text-xs font-bold text-slate-200 mt-0.5">
                  {metrics.faceDownCount} cards
                </span>
              </div>

              {/* Open Columns */}
              <div className="p-1.5 rounded-xl bg-white/5 border border-white/5 flex flex-col justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Layers className="w-2.5 h-2.5 text-sky-400" />
                  <span>Open Cols</span>
                </span>
                <span className="text-xs font-bold text-slate-200 mt-0.5">
                  {metrics.emptyColumnsCount} empty
                </span>
              </div>
            </div>

            {/* Stalemate or Victory Banner if applicable */}
            {metrics.isStalemate && (
              <div className="py-1 px-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-rose-400 shrink-0" />
                <span>No legal moves remain. Try Undo or Hint.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
