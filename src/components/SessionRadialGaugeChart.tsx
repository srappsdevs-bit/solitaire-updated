import React, { useState, useEffect, useMemo } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  Clock,
  Target,
  Trophy,
  Sparkles,
  Flame,
  CheckCircle2,
  Plus,
  Minus,
  Settings2,
  RotateCcw,
  Sliders,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  getSessionDurationSeconds,
  setSessionDurationSeconds,
  getUserDailyGoalMinutes,
  setUserDailyGoalMinutes,
  formatSessionClock,
} from '../utils/stats';

interface SessionRadialGaugeChartProps {
  className?: string;
  onGoalChange?: (newGoalMinutes: number) => void;
}

const PRESET_GOALS = [15, 30, 45, 60, 90, 120];

export const SessionRadialGaugeChart: React.FC<SessionRadialGaugeChartProps> = ({
  className = '',
  onGoalChange,
}) => {
  // User-defined daily goal in minutes
  const [goalMinutes, setGoalMinutes] = useState<number>(() => getUserDailyGoalMinutes());
  // Current session duration in seconds
  const [sessionSeconds, setSessionSeconds] = useState<number>(() => getSessionDurationSeconds());
  // Show custom goal input editor
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [customGoalInput, setCustomGoalInput] = useState<string>(() => goalMinutes.toString());
  // Show simulation / testing controls
  const [showSimControls, setShowSimControls] = useState(false);

  // Poll current session time every second so the gauge ticks live
  useEffect(() => {
    const timer = setInterval(() => {
      const current = getSessionDurationSeconds();
      setSessionSeconds(current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Update goal handler
  const handleSelectGoal = (minutes: number) => {
    const clamped = Math.max(5, Math.min(300, Math.round(minutes)));
    setGoalMinutes(clamped);
    setUserDailyGoalMinutes(clamped);
    setCustomGoalInput(clamped.toString());
    setIsEditingGoal(false);
    if (onGoalChange) onGoalChange(clamped);
  };

  const handleAdjustGoalDelta = (deltaMinutes: number) => {
    const next = Math.max(5, Math.min(300, goalMinutes + deltaMinutes));
    handleSelectGoal(next);
  };

  const handleCustomGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customGoalInput, 10);
    if (!isNaN(parsed) && parsed >= 5 && parsed <= 300) {
      handleSelectGoal(parsed);
    }
  };

  // Simulation controls for testing/demoing different gauge percentages
  const handleSimulateAddMinutes = (addedMinutes: number) => {
    const current = getSessionDurationSeconds();
    const updated = current + addedMinutes * 60;
    setSessionDurationSeconds(updated);
    setSessionSeconds(updated);
  };

  const handleResetSession = () => {
    setSessionDurationSeconds(0);
    setSessionSeconds(0);
  };

  // Calculations
  const goalSeconds = goalMinutes * 60;
  const rawPercentage = goalSeconds > 0 ? (sessionSeconds / goalSeconds) * 100 : 0;
  const isGoalAchieved = sessionSeconds >= goalSeconds;
  const remainingSeconds = Math.max(0, goalSeconds - sessionSeconds);
  const overtimeSeconds = Math.max(0, sessionSeconds - goalSeconds);

  // Clamped value for the radial bar gauge arc (0 to goalSeconds)
  const chartGaugeValue = Math.min(sessionSeconds, goalSeconds);

  // Data for Recharts RadialBarChart
  const chartData = useMemo(() => {
    return [
      {
        name: 'Current Session Duration',
        value: chartGaugeValue,
        fill: isGoalAchieved ? 'url(#gaugeCompletedGradient)' : 'url(#gaugeProgressGradient)',
      },
    ];
  }, [chartGaugeValue, isGoalAchieved]);

  // Status helper text
  const getStatusInfo = () => {
    if (isGoalAchieved) {
      return {
        text: `Daily Goal Achieved! (+${Math.floor(overtimeSeconds / 60)}m overtime)`,
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: <Trophy className="w-3.5 h-3.5 text-emerald-400" />,
      };
    }
    if (rawPercentage >= 75) {
      return {
        text: `Final Stretch (${Math.ceil(remainingSeconds / 60)}m remaining)`,
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
        icon: <Flame className="w-3.5 h-3.5 text-amber-400" />,
      };
    }
    if (rawPercentage >= 50) {
      return {
        text: `Past Halfway (${Math.ceil(remainingSeconds / 60)}m remaining)`,
        badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
        icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />,
      };
    }
    if (sessionSeconds > 0) {
      return {
        text: `Session Active (${Math.ceil(remainingSeconds / 60)}m remaining)`,
        badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
        icon: <Clock className="w-3.5 h-3.5 text-sky-400" />,
      };
    }
    return {
      text: `Ready to play (${goalMinutes}m target)`,
      badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: <Target className="w-3.5 h-3.5 text-slate-400" />,
    };
  };

  const status = getStatusInfo();

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/40 shadow-xl relative overflow-hidden select-none ${className}`}>
      {/* Background glow */}
      <div
        className={`absolute top-0 right-0 w-44 h-44 ${
          isGoalAchieved ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        } rounded-full blur-3xl pointer-events-none -mr-12 -mt-12 transition-colors duration-700`}
      />

      {/* Header with Title and Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                Current Session Duration
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                Live Gauge
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tracks active playtime in this session against your customizable daily goal
            </p>
          </div>
        </div>

        {/* User-Defined Goal Stepper & Custom Toggle */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950/80 border border-slate-800 rounded-xl p-1 shrink-0">
          <span className="text-[10px] text-slate-400 font-bold px-2 uppercase tracking-wider">
            Daily Goal:
          </span>
          <button
            onClick={() => handleAdjustGoalDelta(-5)}
            disabled={goalMinutes <= 5}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 flex items-center justify-center transition-colors"
            title="Decrease goal by 5 minutes"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="font-mono text-xs font-bold text-amber-300 px-1 min-w-[34px] text-center">
            {goalMinutes}m
          </span>
          <button
            onClick={() => handleAdjustGoalDelta(5)}
            disabled={goalMinutes >= 300}
            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 flex items-center justify-center transition-colors"
            title="Increase goal by 5 minutes"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-colors ml-0.5 ${
              isEditingGoal ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Custom Goal Settings"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Goal Selectors Toolbar */}
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap relative z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {PRESET_GOALS.map((preset) => {
            const isSelected = goalMinutes === preset && !isEditingGoal;
            return (
              <button
                key={preset}
                onClick={() => handleSelectGoal(preset)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-400/20 border-amber-400/60 text-amber-200 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset}m
              </button>
            );
          })}
        </div>

        {/* Toggle simulation / preview controls */}
        <button
          onClick={() => setShowSimControls(!showSimControls)}
          className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-800/50"
        >
          <Sliders className="w-3 h-3 text-amber-400" />
          <span>{showSimControls ? 'Hide Tester' : 'Test Playtime'}</span>
        </button>
      </div>

      {/* Custom Goal Input Drawer (if open) */}
      {isEditingGoal && (
        <form
          onSubmit={handleCustomGoalSubmit}
          className="mt-2.5 p-2.5 bg-slate-950/90 border border-amber-500/30 rounded-xl flex items-center gap-2 relative z-10 animate-fadeIn"
        >
          <span className="text-xs text-slate-300 font-medium">Set Custom Daily Goal:</span>
          <input
            type="number"
            min={5}
            max={300}
            value={customGoalInput}
            onChange={(e) => setCustomGoalInput(e.target.value)}
            className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
            placeholder="Mins"
          />
          <span className="text-xs text-slate-400">minutes (5 - 300)</span>
          <button
            type="submit"
            className="ml-auto px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-bold rounded-lg shadow-sm active:scale-95 transition-all"
          >
            Apply Goal
          </button>
        </form>
      )}

      {/* Simulation / Testing Toolbar (if open) */}
      {showSimControls && (
        <div className="mt-2.5 p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center gap-2 flex-wrap relative z-10 text-xs animate-fadeIn">
          <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" /> Test Session:
          </span>
          <button
            onClick={() => handleSimulateAddMinutes(5)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] transition-colors"
          >
            +5m
          </button>
          <button
            onClick={() => handleSimulateAddMinutes(15)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] transition-colors"
          >
            +15m
          </button>
          <button
            onClick={() => handleSimulateAddMinutes(30)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] transition-colors"
          >
            +30m
          </button>
          <button
            onClick={handleResetSession}
            className="ml-auto px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset to 0s
          </button>
        </div>
      )}

      {/* Main Radial Gauge Visualization Area */}
      <div className="mt-3 relative z-10 flex flex-col items-center">
        {/* Recharts Radial Gauge Container */}
        <div className="relative w-full h-56 sm:h-60 max-w-sm mx-auto flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="65%"
              innerRadius="72%"
              outerRadius="100%"
              barSize={18}
              data={chartData}
              startAngle={200}
              endAngle={-20}
            >
              <defs>
                {/* Standard Progress Gradient: Amber -> Yellow -> Emerald */}
                <linearGradient id="gaugeProgressGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="60%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>

                {/* Completed / Goal Achieved Gradient: Emerald -> Bright Mint */}
                <linearGradient id="gaugeCompletedGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>

              <PolarAngleAxis
                type="number"
                domain={[0, goalSeconds]}
                angleAxisId={0}
                tick={false}
              />

              <RadialBar
                background={{ fill: '#1e293b' }}
                dataKey="value"
                cornerRadius={9}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Centered Gauge Readout Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center top-6 pointer-events-none">
            {/* Percentage Badge */}
            <div
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black border flex items-center gap-1 mb-1 transition-colors ${
                isGoalAchieved
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                  : 'bg-amber-400/20 border-amber-400/40 text-amber-200'
              }`}
            >
              {isGoalAchieved && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              <span>{rawPercentage.toFixed(1)}%</span>
            </div>

            {/* Current Session Duration (Large Typography) */}
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-md">
              {formatSessionClock(sessionSeconds)}
            </div>

            {/* Goal Target Subtext */}
            <div className="text-xs font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
              <span>Goal:</span>
              <span className="font-mono font-bold text-amber-300">{goalMinutes} mins</span>
              <span className="text-slate-500">daily</span>
            </div>

            {/* Status Pill Indicator */}
            <div className="mt-2.5">
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm transition-all ${status.badgeBg}`}
              >
                {status.icon}
                <span>{status.text}</span>
              </span>
            </div>
          </div>

          {/* Gauge Dial Arc Min & Max Labels */}
          <div className="absolute bottom-5 left-10 sm:left-14 text-center pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-slate-500 block">0m</span>
            <span className="text-[9px] text-slate-600 block uppercase">Start</span>
          </div>

          <div className="absolute bottom-5 right-10 sm:right-14 text-center pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-amber-400 block">{goalMinutes}m</span>
            <span className="text-[9px] text-slate-500 block uppercase">Goal</span>
          </div>
        </div>

        {/* 3 Metric Summary Badges Under Gauge */}
        <div className="w-full grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-800/80">
          {/* 1. Session Duration */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Session Duration
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-300 mt-0.5">
              {formatSessionClock(sessionSeconds)}
            </div>
            <div className="text-[10px] text-slate-500 truncate">Current play session</div>
          </div>

          {/* 2. Daily Goal */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Daily Target
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
              {goalMinutes} <span className="text-xs font-sans text-slate-400 font-normal">min</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate">Customizable goal</div>
          </div>

          {/* 3. Goal Delta / Remaining */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {isGoalAchieved ? 'Overtime' : 'Time Remaining'}
            </div>
            <div
              className={`text-base sm:text-lg font-black font-mono mt-0.5 ${
                isGoalAchieved ? 'text-emerald-400' : 'text-amber-200'
              }`}
            >
              {isGoalAchieved
                ? `+${Math.floor(overtimeSeconds / 60)}m`
                : `${Math.ceil(remainingSeconds / 60)}m`}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {isGoalAchieved ? 'Goal completed! 🏆' : 'Until target met'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
