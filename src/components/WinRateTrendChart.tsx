import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Percent, Trophy, Sparkles, Activity, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { UserStats, WinRateDataPoint, generate30DayWinRateSeries } from '../utils/stats';
import { GameId } from '../types/solitaire';

interface WinRateTrendChartProps {
  stats: UserStats;
  completedDates?: Record<string, { won: boolean; score: number; time: number; moves: number; rank?: number }>;
  selectedGameFilter?: GameId | 'all';
  className?: string;
}

export const WinRateTrendChart: React.FC<WinRateTrendChartProps> = ({
  stats,
  completedDates,
  selectedGameFilter = 'all',
  className = '',
}) => {
  // Check if player has real activity
  const realGamesPlayed = selectedGameFilter === 'all'
    ? stats.totalGamesPlayed
    : (stats.byGame[selectedGameFilter]?.played || 0);

  // If player has 0 games, enable demo mode so the graph presents an engaging preview
  const [useDemo, setUseDemo] = useState<boolean>(() => realGamesPlayed === 0);
  const [chartMode, setChartMode] = useState<'cumulative' | 'daily'>('cumulative');

  // Compute 30 days of data
  const data: WinRateDataPoint[] = useMemo(() => {
    return generate30DayWinRateSeries(stats, completedDates, selectedGameFilter, useDemo);
  }, [stats, completedDates, selectedGameFilter, useDemo]);

  // Derived metrics from 30-day window
  const metrics = useMemo(() => {
    const total30dPlayed = data.reduce((sum, d) => sum + d.played, 0);
    const total30dWon = data.reduce((sum, d) => sum + d.won, 0);
    const latestRate = data.length > 0 
      ? (chartMode === 'cumulative' ? data[data.length - 1].cumulativeWinRate : data[data.length - 1].dailyWinRate)
      : 0;
    const startRate = data.length > 0 
      ? (chartMode === 'cumulative' ? data[0].cumulativeWinRate : data[0].dailyWinRate)
      : 0;
    const peakRate = Math.max(...data.map(d => chartMode === 'cumulative' ? d.cumulativeWinRate : d.dailyWinRate), 0);
    const delta = latestRate - startRate;

    // Average win rate for reference line
    const avgWinRate = total30dPlayed > 0 ? Math.round((total30dWon / total30dPlayed) * 100) : latestRate;

    return {
      total30dPlayed,
      total30dWon,
      latestRate,
      peakRate,
      delta,
      avgWinRate,
    };
  }, [data, chartMode]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point: WinRateDataPoint = payload[0].payload;
      const rateVal = chartMode === 'cumulative' ? point.cumulativeWinRate : point.dailyWinRate;

      return (
        <div className="bg-slate-950/95 border border-emerald-500/50 shadow-2xl rounded-xl p-3 text-xs backdrop-blur-md min-w-[170px] select-none pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-slate-200">
              {point.weekday}, {point.label}
            </span>
            {point.isToday && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Today
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                {chartMode === 'cumulative' ? 'Cumulative Win %:' : 'Daily Win %:'}
              </span>
              <span className="font-mono font-black text-sm text-emerald-400">
                {rateVal}%
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="text-slate-400">Day Record:</span>
              <span className="font-mono">
                <span className="text-emerald-400 font-bold">{point.won}W</span>
                <span className="text-slate-500"> / </span>
                <span className="text-slate-300">{point.played}P</span>
              </span>
            </div>

            {chartMode === 'cumulative' && (
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Day Win Rate:</span>
                <span className="font-mono text-slate-300">{point.dailyWinRate}%</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/40 border border-emerald-500/30 shadow-xl relative overflow-hidden ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Mode Toggles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                30-Day Win Rate Trend
              </h3>
              {useDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Sample Preview
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Historical winning trajectory and skill progression
            </p>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center gap-2">
          {realGamesPlayed === 0 && (
            <button
              onClick={() => setUseDemo(!useDemo)}
              className="text-[10px] px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-all font-semibold"
              title="Toggle between live empty record and realistic sample preview"
            >
              {useDemo ? 'Show Live (0)' : 'Show Sample'}
            </button>
          )}

          <div className="flex rounded-lg bg-slate-950/80 border border-slate-800 p-0.5">
            <button
              onClick={() => setChartMode('cumulative')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                chartMode === 'cumulative'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cumulative Trend
            </button>
            <button
              onClick={() => setChartMode('daily')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                chartMode === 'daily'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Daily %
            </button>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards for 30-Day Overview */}
      <div className="grid grid-cols-3 gap-2 mb-3.5 relative z-10">
        {/* Latest Win Rate */}
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">Current Win %</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              {metrics.latestRate}%
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
              {metrics.delta >= 0 ? (
                <span className="text-emerald-400 font-bold">↑ +{metrics.delta}%</span>
              ) : (
                <span className="text-red-400 font-bold">↓ {metrics.delta}%</span>
              )}
              <span className="text-slate-500">over 30d</span>
            </div>
          </div>
        </div>

        {/* Peak Win Rate */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">30-Day Peak</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              {metrics.peakRate}%
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Highest win rate reached
            </div>
          </div>
        </div>

        {/* 30-Day Matches Won */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold tracking-wider">30-Day Matches</span>
            <Activity className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl sm:text-2xl font-black text-teal-300 font-mono">
              {metrics.total30dWon}
              <span className="text-xs font-normal text-slate-400 ml-1">/ {metrics.total30dPlayed}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Avg: {metrics.avgWinRate}% win rate
            </div>
          </div>
        </div>
      </div>

      {/* Recharts Area + Line Chart */}
      <div className="w-full h-56 sm:h-64 relative z-10 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -22, bottom: 0 }}
          >
            <defs>
              <linearGradient id="winRateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
                // Show tick every ~5 days to prevent clutter
                return idx % 5 === 0 || idx === data.length - 1 ? `${val}` : '';
              }}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Average Win Rate dashed benchmark line */}
            {metrics.avgWinRate > 0 && (
              <ReferenceLine
                y={metrics.avgWinRate}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            )}

            {/* Gradient fill under trend line */}
            <Area
              type="monotone"
              dataKey={chartMode === 'cumulative' ? 'cumulativeWinRate' : 'dailyWinRate'}
              stroke="transparent"
              fillOpacity={1}
              fill="url(#winRateGradient)"
            />

            {/* Solid vibrant trend line */}
            <Line
              type="monotone"
              dataKey={chartMode === 'cumulative' ? 'cumulativeWinRate' : 'dailyWinRate'}
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#059669', stroke: '#34d399', strokeWidth: 1 }}
              activeDot={{
                r: 6,
                fill: '#34d399',
                stroke: '#ffffff',
                strokeWidth: 2,
                className: 'filter drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]',
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Legend & Context Notes */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-slate-300 font-medium">Win Rate Curve</span>
          </div>
          {metrics.avgWinRate > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 border-t border-dashed border-amber-400" />
              <span className="text-amber-300/80">30d Avg ({metrics.avgWinRate}%)</span>
            </div>
          )}
        </div>

        <span className="text-slate-500">
          Last 30 Days (T-29 to Today)
        </span>
      </div>
    </div>
  );
};
