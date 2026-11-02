import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Calendar,
  Trophy,
  TrendingUp,
  CheckCircle2,
  Crown,
  Sparkles,
  Flame,
  Activity,
  Award,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  offsetDateString,
  getTodayDateString,
  getDailyChallengeConfig,
} from '../utils/dailyChallenge';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';
import { formatClockTime } from '../utils/stats';

export interface DayWinFrequencyData {
  dateStr: string;
  dayIndex: number;
  label: string;
  dayOfMonth: string;
  weekday: string;
  gameId: string;
  gameName: string;
  gameIcon: string;
  isWon: boolean;
  score: number;
  timeSeconds?: number;
  moves?: number;
  isToday: boolean;
  // 7-day rolling window win frequency percentage (0-100)
  rolling7DayFrequency: number;
  // 7-day window wins count (0-7)
  rolling7DayWins: number;
  // Cumulative win frequency percentage up to this day (0-100)
  cumulativeFrequency: number;
  // Cumulative wins total up to this day
  cumulativeWins: number;
  // Discrete binary bar height for composite visual
  wonBarValue: number;
}

interface DailyChallengeWinFrequencyGraphProps {
  completedDates: Record<string, { won?: boolean; score?: number; time?: number; moves?: number; rank?: number }>;
  referenceDateStr?: string;
  onOpenDailyChallenge?: () => void;
  className?: string;
}

/**
 * Generates engaging demo 30-day daily challenge participation data for new players
 */
function generateDemoWinHistory(today: string): Record<string, { won: boolean; score: number; time: number; moves: number }> {
  const result: Record<string, { won: boolean; score: number; time: number; moves: number }> = {};
  
  // High engagement realistic win pattern: 24 wins out of 30 days
  const winPattern = [
    true, true, false, true, true, true, true,
    true, false, true, true, true, true, true,
    true, true, true, false, true, true, true,
    true, true, false, true, true, true, true, true, true,
  ];

  for (let i = 29; i >= 0; i--) {
    const dStr = offsetDateString(today, -i);
    const patternIdx = 29 - i;
    const isWon = winPattern[patternIdx] ?? true;
    if (isWon) {
      result[dStr] = {
        won: true,
        score: 1050 + ((i * 43) % 520),
        time: 130 + ((i * 23) % 190),
        moves: 80 + ((i * 11) % 45),
      };
    }
  }

  return result;
}

export const DailyChallengeWinFrequencyGraph: React.FC<DailyChallengeWinFrequencyGraphProps> = ({
  completedDates,
  referenceDateStr,
  onOpenDailyChallenge,
  className = '',
}) => {
  const today = referenceDateStr || getTodayDateString();
  const realWinsCount = Object.values(completedDates || {}).filter(d => d?.won).length;
  const [useDemoData, setUseDemoData] = useState<boolean>(() => realWinsCount === 0);
  const [viewMode, setViewMode] = useState<'rolling' | 'cumulative'>('rolling');

  const activeDatesMap = useMemo(() => {
    if (useDemoData) {
      return generateDemoWinHistory(today);
    }
    return completedDates || {};
  }, [useDemoData, completedDates, today]);

  // Compute 30-day time series dataset
  const chartData: DayWinFrequencyData[] = useMemo(() => {
    const points: DayWinFrequencyData[] = [];
    let runningWinsTotal = 0;

    for (let i = 29; i >= 0; i--) {
      const dateStr = offsetDateString(today, -i);
      const dayIndex = 30 - i;
      const isToday = i === 0;

      const record = activeDatesMap[dateStr];
      const isWon = !!record?.won;
      if (isWon) {
        runningWinsTotal++;
      }

      // Rolling 7-day window win count
      let rolling7Wins = 0;
      for (let w = 0; w < 7; w++) {
        const checkDate = offsetDateString(dateStr, -w);
        if (activeDatesMap[checkDate]?.won) {
          rolling7Wins++;
        }
      }
      const rolling7DayFrequency = Math.round((rolling7Wins / 7) * 100);
      const cumulativeFrequency = Math.round((runningWinsTotal / dayIndex) * 100);

      // Date labeling
      const dateParts = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthNum = parseInt(dateParts[1], 10) - 1;
      const dayNum = parseInt(dateParts[2], 10);
      const label = `${monthNames[monthNum]} ${dayNum}`;
      const dayOfMonth = `${dayNum}`;

      const dObj = new Date(dateStr + 'T00:00:00');
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekday = weekdayNames[dObj.getDay()] || '';

      const gameConfig = getDailyChallengeConfig(dateStr);
      const gameDef = SOLITAIRE_GAMES[gameConfig.gameId];

      points.push({
        dateStr,
        dayIndex,
        label,
        dayOfMonth,
        weekday,
        gameId: gameConfig.gameId,
        gameName: gameDef?.name || gameConfig.gameId,
        gameIcon: gameDef?.icon || '♠',
        isWon,
        score: record?.score || 0,
        timeSeconds: record?.time,
        moves: record?.moves,
        isToday,
        rolling7DayFrequency,
        rolling7DayWins: rolling7Wins,
        cumulativeFrequency,
        cumulativeWins: runningWinsTotal,
        wonBarValue: isWon ? 22 : 0,
      });
    }

    return points;
  }, [activeDatesMap, today]);

  // Summary statistics across the 30-day window
  const summary = useMemo(() => {
    const totalWinsIn30d = chartData.filter(d => d.isWon).length;
    const overallWinFrequency = Math.round((totalWinsIn30d / 30) * 100);

    const latestDay = chartData[chartData.length - 1];
    const current7dFrequency = latestDay ? latestDay.rolling7DayFrequency : 0;
    const current7dWins = latestDay ? latestDay.rolling7DayWins : 0;

    const peak7dFrequency = Math.max(...chartData.map(d => d.rolling7DayFrequency), 0);
    const peakCumulativeFrequency = Math.max(...chartData.map(d => d.cumulativeFrequency), 0);

    return {
      totalWinsIn30d,
      overallWinFrequency,
      current7dFrequency,
      current7dWins,
      peak7dFrequency,
      peakCumulativeFrequency,
    };
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayWinFrequencyData = payload[0].payload;

      return (
        <div className="bg-slate-950/95 border border-amber-500/40 shadow-2xl rounded-xl p-3 text-xs backdrop-blur-md min-w-[210px] select-none pointer-events-none z-50 text-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold text-slate-200">
                {data.weekday}, {data.label}
              </span>
            </div>
            {data.isToday && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-400/30">
                Today
              </span>
            )}
          </div>

          {/* Game Variant on this Date */}
          <div className="flex items-center gap-2 mb-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <span className="text-base leading-none">{data.gameIcon}</span>
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400 uppercase font-semibold leading-none">
                Challenge Game
              </div>
              <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                {data.gameName}
              </div>
            </div>
          </div>

          {/* Win Status & Metrics */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Result:</span>
              {data.isWon ? (
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Victory</span>
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Unplayed / Missed</span>
              )}
            </div>

            {data.isWon && (
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="text-slate-400">Score & Time:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {data.score} pts {data.timeSeconds ? `· ${formatClockTime(data.timeSeconds)}` : ''}
                </span>
              </div>
            )}

            <div className="border-t border-slate-800/80 pt-1.5 mt-1.5 flex items-center justify-between">
              <span className="text-slate-400">
                {viewMode === 'rolling' ? '7-Day Rolling Frequency:' : 'Cumulative Frequency:'}
              </span>
              <span className="font-mono font-black text-sm text-amber-400">
                {viewMode === 'rolling' ? `${data.rolling7DayFrequency}%` : `${data.cumulativeFrequency}%`}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>{viewMode === 'rolling' ? 'Wins in past 7 days:' : 'Wins up to this day:'}</span>
              <span className="font-mono font-bold text-slate-300">
                {viewMode === 'rolling' ? `${data.rolling7DayWins} / 7 days` : `${data.cumulativeWins} / ${data.dayIndex} days`}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-xl relative overflow-hidden select-none ${className}`}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-12 -mt-12" />

      {/* Top Header & View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Daily Challenge Win Frequency</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                  30 Days
                </span>
              </h4>
              {useDemoData && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Demo Preview
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Visual consistency graph tracking daily challenge victories & rolling frequency
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setViewMode('rolling')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'rolling'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="7-Day Rolling Window Win Frequency Rate"
            >
              7-Day Rolling
            </button>
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'cumulative'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cumulative 30-Day Win Frequency Progression"
            >
              Cumulative %
            </button>
          </div>

          {/* Demo toggle when applicable */}
          <button
            onClick={() => setUseDemoData(prev => !prev)}
            className="text-[10px] px-2 py-1 rounded-lg border border-slate-800 text-slate-400 hover:text-amber-300 hover:border-slate-700 transition-colors cursor-pointer"
            title="Toggle between real game history and demonstration data"
          >
            {useDemoData ? 'My Data' : 'Preview Demo'}
          </button>
        </div>
      </div>

      {/* 4 Summary Metrics Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 relative z-10">
        {/* 1. 30-Day Win Frequency */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">30-Day Frequency</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {summary.overallWinFrequency}%
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {summary.totalWinsIn30d} of 30 days won
            </div>
          </div>
        </div>

        {/* 2. Current 7-Day Frequency */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Current 7-Day</span>
            <Flame className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
              {summary.current7dFrequency}%
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {summary.current7dWins} of past 7 days won
            </div>
          </div>
        </div>

        {/* 3. Peak Frequency Window */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Peak Frequency</span>
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-yellow-300 font-mono">
              {viewMode === 'rolling' ? `${summary.peak7dFrequency}%` : `${summary.peakCumulativeFrequency}%`}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {viewMode === 'rolling' ? 'Best 7-day rate' : 'Peak cumulative rate'}
            </div>
          </div>
        </div>

        {/* 4. Total Daily Crowns */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Challenges Won</span>
            <Crown className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {summary.totalWinsIn30d} <span className="text-xs font-sans text-slate-400 font-normal">/ 30</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {30 - summary.totalWinsIn30d} days unplayed
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Area + Bar Visualization */}
      <div className="w-full h-56 sm:h-64 relative z-10 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 12, right: 12, left: -18, bottom: 4 }}
          >
            <defs>
              {/* Gradient for Rolling 7-Day Frequency */}
              <linearGradient id="freqRollingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                <stop offset="50%" stopColor="#d97706" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#b45309" stopOpacity={0.0} />
              </linearGradient>

              {/* Gradient for Cumulative Win Rate */}
              <linearGradient id="freqCumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="50%" stopColor="#059669" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
              </linearGradient>

              {/* Win Pillar Bar Gradient */}
              <linearGradient id="winBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              strokeOpacity={0.3}
              vertical={false}
            />

            <XAxis
              dataKey="dayOfMonth"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155', strokeOpacity: 0.5 }}
              interval="preserveStartEnd"
              tickFormatter={(val, idx) => {
                // Show dates every ~5 days and the latest day
                if (idx === 0 || idx === 7 || idx === 14 || idx === 21 || idx === 28 || idx === chartData.length - 1) {
                  return chartData[idx]?.label || val;
                }
                return '';
              }}
            />

            <YAxis
              stroke="#64748b"
              fontSize={10}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              axisLine={{ stroke: '#334155', strokeOpacity: 0.5 }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Benchmark 30-Day Average Reference Line */}
            <ReferenceLine
              y={summary.overallWinFrequency}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{
                value: `Avg: ${summary.overallWinFrequency}%`,
                position: 'insideTopRight',
                fill: '#fbbf24',
                fontSize: 10,
                opacity: 0.8,
              }}
            />

            {/* Underlying discrete daily win pillars (shows which days had a win) */}
            <Bar
              dataKey="wonBarValue"
              fill="url(#winBarGradient)"
              radius={[3, 3, 0, 0]}
              maxBarSize={8}
            />

            {/* Continuous Frequency Smooth Area Curve */}
            {viewMode === 'rolling' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="rolling7DayFrequency"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  fill="url(#freqRollingGradient)"
                  activeDot={{ r: 5, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="rolling7DayFrequency"
                  stroke="#fbbf24"
                  strokeWidth={2.5}
                  dot={false}
                />
              </>
            ) : (
              <>
                <Area
                  type="monotone"
                  dataKey="cumulativeFrequency"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#freqCumulativeGradient)"
                  activeDot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeFrequency"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Quick Launch Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs relative z-10">
        <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-sm" />
            <span>{viewMode === 'rolling' ? '7-Day Rolling Frequency' : 'Cumulative Win %'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-t from-amber-600 to-yellow-400 inline-block" />
            <span>Daily Victory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-b border-dashed border-amber-400 inline-block" />
            <span>30-Day Average</span>
          </div>
        </div>

        {onOpenDailyChallenge && (
          <button
            onClick={onOpenDailyChallenge}
            className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
          >
            <span>Play Today's Challenge</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
