import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Clock, Flame, Calendar, Sparkles, TrendingUp, BarChart2, Grid } from 'lucide-react';
import {
  UserStats,
  HeatmapDataPoint,
  HourlySummaryPoint,
  generateLastWeekHourlyHeatmapData,
  formatDuration,
  formatHourDisplay,
} from '../utils/stats';

interface TimeSpentHeatmapProps {
  stats: UserStats;
  className?: string;
}

export const TimeSpentHeatmap: React.FC<TimeSpentHeatmapProps> = ({
  stats,
  className = '',
}) => {
  const hasZeroTime = stats.totalTimePlayed === 0;
  const [useDemo, setUseDemo] = useState<boolean>(() => hasZeroTime);
  const [viewMode, setViewMode] = useState<'calendar' | 'hourly'>('calendar');

  const {
    heatmapPoints,
    hourlySummary,
    totalWeekMinutes,
    peakHourLabel,
    mostActiveDayName,
    dailyAverageMinutes,
    dayLabels,
  } = useMemo(() => {
    return generateLastWeekHourlyHeatmapData(stats, useDemo);
  }, [stats, useDemo]);

  // Color palette for heat intensities
  const intensityFills = ['#1e293b', '#065f46', '#059669', '#10b981', '#f59e0b'];

  // Custom cell shape for Recharts ScatterChart Calendar Heatmap
  const renderHeatmapCell = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || !payload) return null;

    const cellWidth = 14;
    const cellHeight = 16;
    const fill = intensityFills[payload.intensity] || intensityFills[0];
    const isToday = payload.isToday;

    return (
      <rect
        x={cx - cellWidth / 2}
        y={cy - cellHeight / 2}
        width={cellWidth}
        height={cellHeight}
        rx={3}
        fill={fill}
        stroke={isToday ? '#fbbf24' : '#0f172a'}
        strokeWidth={isToday ? 1.2 : 0.5}
        className="transition-all hover:opacity-85 cursor-pointer"
      />
    );
  };

  // Custom Tooltip for Calendar Heatmap Grid
  const CalendarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt: HeatmapDataPoint = payload[0].payload;
      const hourEnd = formatHourDisplay((pt.hour + 1) % 24);

      return (
        <div className="bg-slate-950/95 border border-emerald-500/50 shadow-2xl rounded-xl p-3 text-xs backdrop-blur-md min-w-[190px] select-none pointer-events-none z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
            <span className="font-bold text-slate-200">
              {pt.dayName}, {pt.displayDate}
            </span>
            {pt.isToday && (
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                Today
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span>Time Window:</span>
              <span className="font-mono text-slate-200 font-semibold">
                {pt.hourLabel} – {hourEnd}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Time Played:</span>
              <span className="font-mono font-black text-sm text-emerald-400">
                {pt.timeMinutes > 0 ? `${pt.timeMinutes} min` : '0 min'}
              </span>
            </div>

            {pt.timeSeconds > 0 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Duration:</span>
                <span className="font-mono text-amber-300">
                  {formatDuration(pt.timeSeconds)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Hourly Bar Distribution
  const HourlyBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const pt: HourlySummaryPoint = payload[0].payload;
      const hourEnd = formatHourDisplay((pt.hour + 1) % 24);

      return (
        <div className="bg-slate-950/95 border border-amber-500/50 shadow-2xl rounded-xl p-3 text-xs backdrop-blur-md min-w-[180px] select-none pointer-events-none z-50">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-2">
            {pt.hourLabel} – {hourEnd}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Week Total:</span>
            <span className="font-mono font-black text-sm text-amber-400">
              {pt.totalMinutes} min
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Aggregated across past 7 days
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-xl relative overflow-hidden select-none ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/3 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Time Spent Calendar Heatmap
              </h3>
              {useDemo && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Sample Preview
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Playtime distribution across hours of the day over the last week
            </p>
          </div>
        </div>

        {/* View Switch and Sample Toggle */}
        <div className="flex items-center gap-2">
          {hasZeroTime && (
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
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'calendar'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3 h-3" />
              <span>Heatmap</span>
            </button>
            <button
              onClick={() => setViewMode('hourly')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'hourly'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Hourly Bars</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5 relative z-10">
        <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Week Total</span>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
              {formatDuration(totalWeekMinutes * 60)}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Past 7 calendar days
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Daily Average</span>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black text-amber-300 font-mono">
              {dailyAverageMinutes} <span className="text-xs font-normal text-slate-400">min/day</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Typical daily duration
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peak Hour</span>
          <div className="mt-1">
            <div className="text-sm sm:text-base font-black text-yellow-300 font-mono truncate">
              {peakHourLabel}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Highest activity window
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Day</span>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black text-teal-300 font-mono">
              {mostActiveDayName}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              Most sessions played
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Visualization */}
      <div className="w-full h-56 sm:h-64 relative z-10 pt-1">
        {viewMode === 'calendar' ? (
          /* Recharts ScatterChart 2D Matrix Heatmap */
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 10, right: 12, left: -10, bottom: 0 }}
            >
              <XAxis
                type="number"
                dataKey="hour"
                domain={[-0.5, 23.5]}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
                tickFormatter={(h) => formatHourDisplay(h)}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <YAxis
                type="number"
                dataKey="dayIndex"
                domain={[-0.5, 6.5]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
                tickFormatter={(idx) => dayLabels[idx] || ''}
                reversed={true}
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />

              <Tooltip content={<CalendarTooltip />} />

              <Scatter
                data={heatmapPoints}
                shape={renderHeatmapCell}
                isAnimationActive={false}
              />
            </ScatterChart>
          </ResponsiveContainer>
        ) : (
          /* Recharts Hourly Bar Chart Distribution */
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlySummary}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                opacity={0.35}
                vertical={false}
              />

              <XAxis
                dataKey="hour"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
                tickFormatter={(h) => formatHourDisplay(h)}
              />

              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(v) => `${v}m`}
              />

              <Tooltip content={<HourlyBarTooltip />} />

              <Bar
                dataKey="totalMinutes"
                radius={[3, 3, 0, 0]}
                maxBarSize={16}
              >
                {hourlySummary.map((entry, index) => {
                  const fill = intensityFills[entry.intensity] || intensityFills[0];
                  return <Cell key={`bar-${index}`} fill={entry.totalMinutes > 0 ? fill : '#1e293b'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Legend & Context Notes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Playtime Intensity:</span>
          <span className="text-slate-500">None</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-[#1e293b] border border-slate-800" title="0 min" />
            <div className="w-3 h-3 rounded-sm bg-[#065f46]" title="1-10 min" />
            <div className="w-3 h-3 rounded-sm bg-[#059669]" title="11-25 min" />
            <div className="w-3 h-3 rounded-sm bg-[#10b981]" title="26-45 min" />
            <div className="w-3 h-3 rounded-sm bg-[#f59e0b]" title="46+ min (Peak)" />
          </div>
          <span className="text-amber-300 font-semibold">Peak</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full border border-amber-400 bg-slate-900" />
          <span className="text-slate-400">Gold border indicates today</span>
        </div>
      </div>
    </div>
  );
};
