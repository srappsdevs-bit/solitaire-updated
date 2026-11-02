import React, { useState, useMemo } from 'react';
import { Flame, Trophy, Calendar, CheckCircle2, AlertCircle, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { offsetDateString, getTodayDateString } from '../utils/dailyChallenge';

export interface DailyStreakHistoryPoint {
  dateStr: string;
  dayIndex: number;
  shortLabel: string; // e.g. "Oct 12"
  dayOfMonth: string; // e.g. "12"
  weekday: string;    // e.g. "Mon"
  isWon: boolean;
  streak: number;
  score?: number;
  timeSeconds?: number;
  moves?: number;
  isToday: boolean;
}

interface DailyStreakChartProps {
  completedDates: Record<string, { won?: boolean; score?: number; time?: number; moves?: number }>;
  referenceDateStr?: string;
  onOpenDailyChallenge?: () => void;
  className?: string;
}

/**
 * Generates sample demo streak data for previewing 30-day performance
 */
function generateDemoHistory(today: string): Record<string, { won: boolean; score: number; time: number; moves: number }> {
  const result: Record<string, { won: boolean; score: number; time: number; moves: number }> = {};
  
  // Create an engaging 30-day pattern:
  // Days 0-4 won (streak 5), day 5 missed, days 6-13 won (streak 8), day 14 missed,
  // days 15-22 won (streak 8), day 23 missed, days 24-29 won (current streak 6)
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

/**
 * Calculates a smooth cubic bezier SVG path (Catmull-Rom spline approximation)
 */
function getCurvedPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export const DailyStreakChart: React.FC<DailyStreakChartProps> = ({
  completedDates,
  referenceDateStr,
  onOpenDailyChallenge,
  className = '',
}) => {
  const today = referenceDateStr || getTodayDateString();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [useDemoData, setUseDemoData] = useState<boolean>(() => {
    // If the user has zero completed daily challenge wins, default to demo mode so the visualization shines immediately
    const realWins = Object.values(completedDates || {}).filter(d => d?.won).length;
    return realWins === 0;
  });

  const activeDataMap = useMemo(() => {
    if (useDemoData) {
      return generateDemoHistory(today);
    }
    return completedDates || {};
  }, [useDemoData, completedDates, today]);

  // Compute 30-day sequential timeline with running streaks
  const historyPoints: DailyStreakHistoryPoint[] = useMemo(() => {
    const points: DailyStreakHistoryPoint[] = [];

    // Helper to calculate streak on any given date
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
      const streak = getStreakOnDate(dateStr);

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
        score: dayRecord?.score,
        timeSeconds: dayRecord?.time,
        moves: dayRecord?.moves,
        isToday: i === 0,
      });
    }

    return points;
  }, [today, activeDataMap]);

  // Aggregated 30-day telemetry metrics
  const totalWins = useMemo(() => historyPoints.filter(p => p.isWon).length, [historyPoints]);
  const winRatePercent = Math.round((totalWins / 30) * 100);
  const maxStreakInWindow = useMemo(() => Math.max(...historyPoints.map(p => p.streak), 0), [historyPoints]);
  const currentStreak = historyPoints[historyPoints.length - 1]?.streak || 0;

  // Chart Dimensions & Vector Coordinates
  const chartWidth = 600;
  const chartHeight = 160;
  const padLeft = 34;
  const padRight = 20;
  const padTop = 22;
  const padBottom = 26;

  const plotWidth = chartWidth - padLeft - padRight;
  const plotHeight = chartHeight - padTop - padBottom;

  // Y-axis upper limit (at least 5 for pleasant proportions)
  const maxY = Math.max(5, Math.ceil((maxStreakInWindow + 1) / 2) * 2);

  // Compute SVG coordinates for each of the 30 days
  const svgPoints = useMemo(() => {
    return historyPoints.map((p, idx) => {
      const x = padLeft + (idx / 29) * plotWidth;
      const y = padTop + plotHeight - (p.streak / maxY) * plotHeight;
      return { x, y, point: p, idx };
    });
  }, [historyPoints, padLeft, plotWidth, padTop, plotHeight, maxY]);

  // Path strings
  const linePath = useMemo(() => getCurvedPath(svgPoints), [svgPoints]);
  const areaPath = useMemo(() => {
    if (svgPoints.length === 0) return '';
    const bottomY = padTop + plotHeight;
    const startX = svgPoints[0].x.toFixed(1);
    const endX = svgPoints[svgPoints.length - 1].x.toFixed(1);
    return `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }, [linePath, svgPoints, padTop, plotHeight]);

  // Selected or active point for tooltip
  const activePoint = hoveredIndex !== null ? svgPoints[hoveredIndex] : svgPoints[svgPoints.length - 1];

  // Y-axis tick lines (0, middle, top)
  const yTicks = [0, Math.round(maxY / 2), maxY];

  return (
    <div className={`bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-3 select-none ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs uppercase font-black text-amber-300 tracking-wider">
                30-Day Streak Trajectory
              </h3>
              {useDemoData && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Preview
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Consecutive win progression over the past month
            </p>
          </div>
        </div>

        {/* Live vs Demo Toggle */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-[10px]">
          <button
            type="button"
            onClick={() => setUseDemoData(false)}
            className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
              !useDemoData
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My History
          </button>
          <button
            type="button"
            onClick={() => setUseDemoData(true)}
            className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
              useDemoData
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Demo Preview
          </button>
        </div>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">30-Day Wins</div>
          <div className="text-base sm:text-lg font-black text-amber-300 font-mono mt-0.5">
            {totalWins} <span className="text-xs font-normal text-slate-500">/ 30</span>
          </div>
          <div className="text-[9px] text-slate-400 font-medium">{winRatePercent}% completed</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">30-Day Peak</div>
          <div className="text-base sm:text-lg font-black text-orange-400 font-mono mt-0.5 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current text-orange-400" />
            <span>{maxStreakInWindow}</span>
            <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <div className="text-[9px] text-slate-400 font-medium">longest continuous run</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-2">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Streak</div>
          <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-1">
            <span>{currentStreak}</span>
            <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <div className="text-[9px] text-slate-400 font-medium">
            {historyPoints[historyPoints.length - 1]?.isWon ? 'Won today' : 'Pending challenge'}
          </div>
        </div>
      </div>

      {/* SVG Chart Surface */}
      <div className="relative bg-slate-950/80 rounded-xl border border-white/10 p-2 overflow-hidden shadow-inner">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible touch-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            {/* Smooth amber-to-transparent area gradient */}
            <linearGradient id="streakAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7c2d12" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing stroke gradient along the path */}
            <linearGradient id="streakStrokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="streakGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Horizontal Background Grid Lines */}
          {yTicks.map(tick => {
            const y = padTop + plotHeight - (tick / maxY) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.75"
                  strokeDasharray={tick === 0 ? undefined : '3 3'}
                  opacity={tick === 0 ? 0.6 : 0.3}
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {tick}d
                </text>
              </g>
            );
          })}

          {/* Shaded Area Fill */}
          <path
            d={areaPath}
            fill="url(#streakAreaGradient)"
            className="transition-all duration-300"
          />

          {/* Glowing Stroke Curve */}
          <path
            d={linePath}
            fill="none"
            stroke="url(#streakStrokeGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#streakGlow)"
            className="transition-all duration-300"
          />

          {/* Vertical Guide Line on Hover */}
          {hoveredIndex !== null && activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + plotHeight}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.8"
            />
          )}

          {/* Individual Data Points */}
          {svgPoints.map(({ x, y, point, idx }) => {
            const isHovered = hoveredIndex === idx;
            const isPeak = point.streak === maxStreakInWindow && point.streak > 0;

            return (
              <g
                key={point.dateStr}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(idx)}
                onTouchStart={() => setHoveredIndex(idx)}
              >
                {/* Invisible larger hover hit target for effortless mobile touch */}
                <rect
                  x={x - (plotWidth / 29) / 2}
                  y={padTop}
                  width={plotWidth / 29}
                  height={plotHeight}
                  fill="transparent"
                />

                {/* Peak Crown / Marker */}
                {isPeak && !isHovered && (
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1"
                    opacity="0.6"
                    className="animate-ping"
                  />
                )}

                {/* Node Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5.5 : point.isWon ? (point.isToday ? 4.5 : 3.5) : 2}
                  fill={
                    isHovered
                      ? '#ffffff'
                      : point.isWon
                      ? point.isToday
                        ? '#34d399' // emerald for today
                        : '#fbbf24' // amber for historical wins
                      : '#475569'   // slate for non-won days
                  }
                  stroke={point.isWon ? '#1e293b' : '#0f172a'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all duration-150"
                />

                {/* Special Today Glow Ring */}
                {point.isToday && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 7.5 : 6}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                    opacity="0.85"
                  />
                )}
              </g>
            );
          })}

          {/* X-axis Date Markers (First, 10th, 20th, and Today) */}
          <g>
            {svgPoints.filter((_, idx) => idx === 0 || idx === 10 || idx === 20 || idx === 29).map(({ x, point, idx }) => (
              <text
                key={idx}
                x={x}
                y={chartHeight - 8}
                textAnchor={idx === 0 ? 'start' : idx === 29 ? 'end' : 'middle'}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="sans-serif"
                fontWeight={point.isToday ? 'bold' : 'normal'}
              >
                {point.isToday ? 'Today' : point.shortLabel}
              </text>
            ))}
          </g>
        </svg>

        {/* Active Hover Floating Micro-Badge */}
        {activePoint && (
          <div
            className="mt-2.5 p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-amber-400/30 flex items-center justify-between gap-3 text-xs shadow-lg animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                activePoint.point.isWon
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {activePoint.point.isWon ? (
                  <Flame className="w-3.5 h-3.5 fill-current text-amber-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>{activePoint.point.shortLabel}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({activePoint.point.weekday})</span>
                  {activePoint.point.isToday && (
                    <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      Today
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300">
                  {activePoint.point.isWon ? (
                    <span className="text-amber-300 font-semibold">
                      🔥 {activePoint.point.streak} {activePoint.point.streak === 1 ? 'Day' : 'Days'} Consecutive Streak
                    </span>
                  ) : (
                    <span className="text-slate-400">Daily challenge not completed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Score & Time Details if available */}
            {activePoint.point.isWon && activePoint.point.score !== undefined && (
              <div className="text-right shrink-0 font-mono text-[11px]">
                <div className="font-bold text-amber-300">{activePoint.point.score} pts</div>
                <div className="text-[10px] text-slate-400">
                  {activePoint.point.timeSeconds ? `${Math.floor(activePoint.point.timeSeconds / 60)}m ${activePoint.point.timeSeconds % 60}s` : ''}
                  {activePoint.point.moves ? ` • ${activePoint.point.moves} moves` : ''}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 30-Day Calendar Micro-Pill Matrix Strip */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>30-Day Activity Strip:</span>
          </span>
          <span className="text-slate-400">
            Hover or tap any day to inspect
          </span>
        </div>

        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1">
          {historyPoints.map((point, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <button
                key={point.dateStr}
                type="button"
                onClick={() => setHoveredIndex(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                title={`${point.shortLabel}: ${point.isWon ? `Won (Streak: ${point.streak})` : 'Incomplete'}`}
                className={`group py-1 px-0.5 rounded-md flex flex-col items-center justify-center border transition-all cursor-pointer ${
                  isHovered
                    ? 'ring-2 ring-white scale-110 z-10 shadow-lg'
                    : ''
                } ${
                  point.isWon
                    ? 'bg-amber-500/25 border-amber-400/50 text-amber-300 hover:bg-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-600 hover:bg-slate-900'
                } ${
                  point.isToday
                    ? 'ring-1 ring-emerald-400 border-emerald-400/70'
                    : ''
                }`}
              >
                <span className="text-[8px] font-mono leading-none">{point.dayOfMonth}</span>
                <span className={`text-[7px] leading-none mt-0.5 ${point.isWon ? 'text-amber-400 font-bold' : 'text-slate-700'}`}>
                  {point.isWon ? '✓' : '·'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
