import React from 'react';
import { Target, CheckCircle2, Sparkles, Trophy, ArrowRight, Flame } from 'lucide-react';

interface DailyGoalProgressBarProps {
  completedCount: number;
  targetCount?: number;
  wonCount?: number;
  onPlayNow?: () => void;
  className?: string;
}

export const DailyGoalProgressBar: React.FC<DailyGoalProgressBarProps> = ({
  completedCount,
  targetCount = 3,
  wonCount = 0,
  onPlayNow,
  className = '',
}) => {
  const current = Math.min(targetCount, Math.max(0, completedCount));
  const percent = Math.min(100, Math.round((current / targetCount) * 100));
  const isGoalAchieved = completedCount >= targetCount;

  // SVG Circular Math
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-xl relative overflow-hidden select-none ${className}`}>
      {/* Background ambient glow */}
      <div className={`absolute top-0 right-0 w-40 h-40 ${isGoalAchieved ? 'bg-emerald-500/10' : 'bg-amber-500/10'} rounded-full blur-3xl pointer-events-none -mr-10 -mt-10`} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        {/* Left Info & Header */}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Daily Goal Progress</span>
            </span>
            {isGoalAchieved ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Goal Completed!
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" />
                {targetCount - current} to go
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white mt-1">
            {isGoalAchieved ? 'Daily 3-Game Target Unlocked!' : 'Play 3 Games Today'}
          </h3>

          <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
            {isGoalAchieved
              ? 'Outstanding dedication! You completed your 3 daily games across the 26 variants.'
              : current === 0
              ? 'Complete 3 games in any of the 26 Solitaire variants today to boost your daily stats and streak.'
              : current === 1
              ? 'Great start! Complete 2 more games to fulfill your daily quota.'
              : 'Almost there! Complete 1 more game to hit your 3-game daily milestone.'}
          </p>

          {/* 3 Step Milestone Indicators */}
          <div className="flex items-center gap-2 mt-3">
            {[1, 2, 3].map((step) => {
              const isStepDone = completedCount >= step;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    isStepDone
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                  }`}
                >
                  {isStepDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[9px] font-mono font-bold text-slate-500 shrink-0">
                      {step}
                    </span>
                  )}
                  <span>Game {step}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Circular Progress Bar Ring */}
        <div className="flex items-center gap-3 sm:flex-col sm:items-center shrink-0 self-center sm:self-auto">
          <div className="relative w-22 h-22 sm:w-24 sm:h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="dailyGoalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>

              {/* Background Track Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="text-slate-800"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />

              {/* Foreground Animated Progress Circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="url(#dailyGoalGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Inner Center Metrics */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {isGoalAchieved ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold text-emerald-300 mt-0.5">3/3 Done</span>
                </>
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-black font-mono text-white leading-none">
                    {current}<span className="text-xs text-amber-400 font-normal">/{targetCount}</span>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Games</span>
                </>
              )}
            </div>
          </div>

          {!isGoalAchieved && onPlayNow && (
            <button
              onClick={onPlayNow}
              className="text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors flex items-center gap-1 active:scale-95"
            >
              <span>Play Game</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
