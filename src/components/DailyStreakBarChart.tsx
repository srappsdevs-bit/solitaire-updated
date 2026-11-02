import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Flame, Trophy, Crown, Sparkles, CheckCircle2, Clock, Calendar, ArrowRight } from 'lucide-react';
import { offsetDateString, getTodayDateString } from '../utils/dailyChallenge';
import { formatClockTime } from '../utils/stats';

export interface DailyStreakBarPoint {
  dateStr: string;
  dayIndex: number;
  shortLabel: string;
  dayOfMonth: string;
  weekday: string;
  isWon: boolean;
  streak: number;
  displayValue: number;
  score: number;
  timeSeconds?: number;
  moves?: number;
  isToday: boolean;
}

interface DailyStreakBarChartProps {
  completedDates: Record<string, { won?: boolean; score?: number; time?: number; moves?: number; rank?: number }>;
  referenceDateStr?: string;
  onOpenDailyChallenge?: () => void;
  className?: string;
}

/**
 * Generates sample demo streak data for previewing 30-day daily challenge participation
 */
function generateDemoHistory(today: string): Record<string, { won: boolean; score: number; time: number; moves: number }> {
  const result: Record<string, { won: boolean; score: number; time: number; moves: number }> = {};
  
  const pattern = [
    true, true, true, true, true, false,
    true, true, true, true, true, true, true, true, false,
    true, true, true, true, true, true, true, true, false,
    true, true, true, true, true, true,
  ];

  for (let i = 29; i >= 0; i--) {
    const dStr = offsetDateString(today, -i);
    const patternIdx = 29 - i;
    const isWon = pattern[patternIdx] ?? true;
    if (isWon) {
      result[dStr] = {
        won: true,
        score: 1100 + ((i * 37) % 450),
        time: 140 + ((i * 19) % 180),
        moves: 85 + ((i * 7) % 40),
      };
    }
  }

  return result;
}

export const DailyStreakBarChart: React.FC<DailyStreakBarChartProps> = ({
  completedDates,
  referenceDateStr,
  onOpenDailyChallenge,
  className = '',
}) => {
  const today = referenceDateStr || getTodayDateString();
  const realWinsCount = Object.values(completedDates || {}).filter(d => d?.won).length;
  const [useDemoData, setUseDemoData] = useState<boolean>(() => realWinsCount === 0);
  const [chartMetric, setChartMetric] = useState<'streak' | 'score'>('streak');

  const activeDataMap = useMemo(() => {
    if (useDemoData) {
      return generateDemoHistory(today);
    }
    return completedDates || {};
  }, [useDemoData, completedDates, today]);

  // Compute 30-day sequential timeline with running consecutive streaks
  const barData: DailyStreakBarPoint[] = useMemo(() => {
    const points: DailyStreakBarPoint[] = [];

    const getStreakOnDate = (date: string): number => {
      let count = 0;
      let curr = date;
      while (activeDataMap[curr]?.won) {
        count++;
        curr = offsetDateString(curr, -1);
      }
      return count;
    };

    for (let i = 29; i >= 0; i--) {
      const dateStr = offsetDateString(today, -i);
      const dayRecord = activeDataMap[dateStr];
      const isWon = !!dayRecord?.won;
      const streak = isWon ? getStreakOnDate(dateStr) : 0;

      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const shortLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayOfMonth = String(d);
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

      points.push({
        dateStr,
        dayIndex: 29 - i,
        shortLabel,
        dayOfMonth,
        weekday,
        isWon,
        streak,
        displayValue: streak,
        score: dayRecord?.score || 0,
        timeSeconds: dayRecord?.time,
        moves: dayRecord?.moves,
        isToday: i === 0,
      });
    }

    return points;
  }, [today, activeDataMap]);

  // Aggregated 30-day metrics
  const totalParticipationWins = useMemo(() => barData.filter(p => p.isWon).length, [barData]);
  const participationRate = Math.round((totalParticipationWins / 30) * 100);
  const maxStreakInWindow = useMemo(() => Math.max(...barData.map(p => p.streak), 0), [barData]);
  const currentStreak = barData[barData.length - 1]?.isWon 
    ? barData[barData.length - 1]?.streak 
    : 0;
  const isTodayCompleted = barData[barData.length - 1]?.isWon;

  // Upper bound for Y-axis
  const maxStreakY = Math.max(5, Math.ceil((maxStreakInWindow + 1) / 2) * 2);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: DailyStreakBarPoint = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-amber-500/50 shadow-2xl rounded-xl p-3 text-xs backdrop-blur-md min-w-[190px] select-none pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-slate-200">
              {dataPoint.weekday}, {dataPoint.shortLabel}
            </span>
            {dataPoint.isToday && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Today
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status:</span>
              {dataPoint.isWon ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
              ) : dataPoint.isToday ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pending Today
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Missed</span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Consecutive Streak:</span>
              <span className="font-mono font-black text-amber-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                {dataPoint.streak} {dataPoint.streak === 1 ? 'day' : 'days'}
              </span>
            </div>

            {dataPoint.isWon && dataPoint.score > 0 && (
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80 text-slate-300">
                <span className="text-slate-400">Score / Time:</span>
                <span className="font-mono text-yellow-300">
                  {dataPoint.score.toLocaleString()} pts
                  {dataPoint.timeSeconds ? ` (${formatClockTime(dataPoint.timeSeconds)})` : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/40 shadow-xl relative overflow-hidden select-none ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Daily Streak History
              </h3>
              {useDemoData && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Sample Preview
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Consecutive daily challenge participation over the last 30 days
            </p>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          {realWinsCount === 0 && (
            <button
              onClick={() => setUseDemoData(!useDemoData)}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all font-semibold"
              title="Toggle between live empty record and realistic sample preview"
            >
              {useDemoData ? 'Show Live (0)' : 'Show Sample'}
            </button>
          )}

          <div className="flex rounded-lg bg-slate-950/80 border border-slate-800 p-0.5">
            <button
              onClick={() => setChartMetric('streak')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                chartMetric === 'streak'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Streak Days
            </button>
            <button
              onClick={() => setChartMetric('score')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                chartMetric === 'score'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Challenge Score
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Summary Badges */}
      <div className="grid grid-cols-3 gap-2 mb-3.5 relative z-10">
        {/* Participation Rate */}
        <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">30d Participation</span>
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {totalParticipationWins}
              <span className="text-xs font-normal text-slate-400 ml-1">/ 30 d</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {participationRate}% attendance rate
            </div>
          </div>
        </div>

        {/* Current Active Streak */}
        <div className="bg-slate-950/80 border border-orange-500/30 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Current Streak</span>
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-orange-400 font-mono">
              {currentStreak}
              <span className="text-xs font-normal text-slate-400 ml-1">d</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {isTodayCompleted ? '🔥 Solved today' : currentStreak > 0 ? '⏳ Play today to extend' : 'Ready to start'}
            </div>
          </div>
        </div>

        {/* Best Streak */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Best 30d Streak</span>
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-yellow-300 font-mono">
              {maxStreakInWindow}
              <span className="text-xs font-normal text-slate-400 ml-1">d</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Record in past month
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart Visualization */}
      <div className="w-full h-56 sm:h-64 relative z-10 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barData}
            margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.35}
              vertical={false}
            />

            <XAxis
              dataKey="dayOfMonth"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val, idx) => {
                return idx % 5 === 0 || idx === barData.length - 1 ? `${val}` : '';
              }}
            />

            <YAxis
              domain={chartMetric === 'streak' ? [0, maxStreakY] : [0, 'auto']}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => chartMetric === 'streak' ? `${v}d` : `${v}`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* 7-Day Milestone benchmark line in streak mode */}
            {chartMetric === 'streak' && maxStreakY >= 7 && (
              <ReferenceLine
                y={7}
                stroke="#eab308"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
                label={{
                  value: '7d Milestone',
                  fill: '#eab308',
                  fontSize: 9,
                  position: 'right',
                  opacity: 0.7,
                }}
              />
            )}

            <Bar
              dataKey={chartMetric === 'streak' ? 'displayValue' : 'score'}
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
            >
              {barData.map((entry, index) => {
                if (entry.isWon) {
                  // Vibrant gold/emerald for today, rich warm amber/orange gradient for consecutive streaks
                  if (entry.isToday) {
                    return <Cell key={`cell-${index}`} fill="#fbbf24" stroke="#fef08a" strokeWidth={1} />;
                  }
                  // Color gradient based on streak level
                  if (entry.streak >= 7) {
                    return <Cell key={`cell-${index}`} fill="#f59e0b" />;
                  } else if (entry.streak >= 3) {
                    return <Cell key={`cell-${index}`} fill="#fb923c" />;
                  }
                  return <Cell key={`cell-${index}`} fill="#f97316" />;
                }
                
                // Unsolved today
                if (entry.isToday) {
                  return <Cell key={`cell-${index}`} fill="#334155" stroke="#f59e0b" strokeDasharray="2 2" strokeWidth={1} />;
                }

                // Missed day
                return <Cell key={`cell-${index}`} fill="#1e293b" opacity={0.6} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-amber-500 to-orange-400" />
            <span className="text-slate-300 font-medium">Daily Challenge Solved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-yellow-400 border border-yellow-200" />
            <span className="text-amber-200">Today Solved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
            <span className="text-slate-500">Missed</span>
          </div>
        </div>

        {!isTodayCompleted && onOpenDailyChallenge && (
          <button
            onClick={onOpenDailyChallenge}
            className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>Play Today's Challenge</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
