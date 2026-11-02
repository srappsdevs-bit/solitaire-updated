import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Trophy, Clock, Move, ArrowRight, RotateCcw, Crown, Globe, Sparkles, PartyPopper, Film } from 'lucide-react';
import { Achievement, GameId } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';

interface VictoryModalProps {
  gameId: GameId;
  moves: number;
  timeSeconds: number;
  score: number;
  isNewBest?: boolean;
  isDailyChallenge?: boolean;
  dailyDate?: string;
  dailyRank?: number | null;
  unlockedAchievements?: Achievement[];
  onPlayAgain: () => void;
  onSelectAnotherGame: () => void;
  onViewLeaderboard?: () => void;
  onViewAchievements?: () => void;
  onWatchReplay?: () => void;
}

type ConfettiShape = 'rect' | 'ribbon' | 'circle' | 'star';

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  shape: ConfettiShape;
  rotation: number;
  rotationSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  tilt: number;
  tiltSpeed: number;
  opacity: number;
  decay: number;
  gravity: number;
  drag: number;
}

const CONFETTI_COLORS = [
  '#f59e0b', // Amber Gold
  '#fbbf24', // Warm Gold
  '#fef08a', // Shimmer Gold
  '#10b981', // Emerald
  '#34d399', // Bright Mint
  '#3b82f6', // Royal Sapphire
  '#60a5fa', // Sky Blue
  '#ec4899', // Ruby Pink
  '#f43f5e', // Rose
  '#a855f7', // Amethyst
  '#ffffff', // Diamond White
];

export const VictoryModal: React.FC<VictoryModalProps> = ({
  gameId,
  moves,
  timeSeconds,
  score,
  isNewBest = false,
  isDailyChallenge = false,
  dailyDate,
  dailyRank,
  unlockedAchievements = [],
  onPlayAgain,
  onSelectAnotherGame,
  onViewLeaderboard,
  onViewAchievements,
  onWatchReplay,
}) => {
  const gameDef = SOLITAIRE_GAMES[gameId];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const [burstCount, setBurstCount] = useState(0);

  // Helper to spawn a burst of confetti particles
  const spawnBurst = useCallback((originX: number, originY: number, count: number, spreadAngle: number, baseVelocity: number) => {
    const newParticles: ConfettiParticle[] = [];
    const shapes: ConfettiShape[] = ['rect', 'ribbon', 'circle', 'star'];

    for (let i = 0; i < count; i++) {
      const angle = spreadAngle + (Math.random() - 0.5) * 1.2; // Radians spread
      const speed = baseVelocity * (0.6 + Math.random() * 0.9);
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];

      const isRibbon = shape === 'ribbon';
      const isStar = shape === 'star';

      newParticles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        width: isRibbon ? 4 + Math.random() * 4 : isStar ? 8 + Math.random() * 4 : 7 + Math.random() * 6,
        height: isRibbon ? 16 + Math.random() * 12 : isStar ? 8 + Math.random() * 4 : 8 + Math.random() * 6,
        color,
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.05 + Math.random() * 0.08,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: 0.06 + Math.random() * 0.08,
        opacity: 1,
        decay: 0.003 + Math.random() * 0.004,
        gravity: 0.32 + Math.random() * 0.16,
        drag: 0.982,
      });
    }

    particlesRef.current.push(...newParticles);
  }, []);

  // Manual interactive burst trigger
  const triggerCelebrationBurst = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    // Left cannon
    spawnBurst(w * 0.15, h * 0.85, 45, -Math.PI / 3, 20);
    // Right cannon
    spawnBurst(w * 0.85, h * 0.85, 45, (-2 * Math.PI) / 3, 20);
    // Center fountain
    spawnBurst(w * 0.5, h * 0.5, 30, -Math.PI / 2, 14);

    setBurstCount(prev => prev + 1);
  }, [spawnBurst]);

  // High performance Canvas Confetti Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle high DPI scaling for crisp visuals
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for mobile battery efficiency
    const resizeCanvas = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initial festive cannon bursts
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Dual corner cannons at startup
    spawnBurst(width * 0.1, height * 0.9, 70, -Math.PI / 3, 22);
    spawnBurst(width * 0.9, height * 0.9, 70, (-2 * Math.PI) / 3, 22);

    // Secondary delayed waves for dynamic celebration
    const timer1 = window.setTimeout(() => {
      spawnBurst(width * 0.25, height * 0.8, 45, -Math.PI / 2.6, 18);
      spawnBurst(width * 0.75, height * 0.8, 45, -Math.PI / 1.6, 18);
    }, 450);

    const timer2 = window.setTimeout(() => {
      spawnBurst(width * 0.5, height * 0.3, 50, -Math.PI / 2, 12);
    }, 1100);

    // Animation Loop using requestAnimationFrame
    let isActive = true;
    const render = () => {
      if (!isActive) return;

      const currentWidth = canvas.width / dpr;
      const currentHeight = canvas.height / dpr;

      ctx.clearRect(0, 0, currentWidth, currentHeight);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply physics
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        p.rotation += p.rotationSpeed;
        p.wobble += p.wobbleSpeed;
        p.tilt += p.tiltSpeed;
        p.opacity -= p.decay;

        // Remove dead particles
        if (p.opacity <= 0 || p.y > currentHeight + 40) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle with genuine 3D paper tumbling
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // 3D paper flutter using scale matrix
        const scaleX = Math.cos(p.tilt);
        const scaleY = Math.sin(p.wobble);
        ctx.scale(scaleX, scaleY);

        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'star') {
          // 4-point sparkle diamond
          ctx.beginPath();
          const r = p.width;
          ctx.moveTo(0, -r);
          ctx.quadraticCurveTo(0, 0, r, 0);
          ctx.quadraticCurveTo(0, 0, 0, r);
          ctx.quadraticCurveTo(0, 0, -r, 0);
          ctx.quadraticCurveTo(0, 0, 0, -r);
          ctx.fill();
        } else {
          // Rectangular / Ribbon slip
          ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        }

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      isActive = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      particlesRef.current = [];
    };
  }, [spawnBurst]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none overflow-hidden">
      {/* High-Performance Canvas Confetti Layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-10 w-full h-full"
      />

      <div className="relative z-20 w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 text-center shadow-2xl shadow-emerald-950/80 overflow-hidden">
        {/* Glow backdrop ring */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 bg-amber-400/25 rounded-full blur-3xl pointer-events-none"></div>

        {/* Crown or Trophy Hero Icon - Interactive trigger for more bursts */}
        <button
          onClick={triggerCelebrationBurst}
          title="Click to blast more confetti!"
          className="group relative w-20 h-20 mx-auto mb-3.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-500 p-0.5 shadow-xl shadow-amber-500/40 flex items-center justify-center animate-bounce transition-transform active:scale-95 cursor-pointer"
        >
          <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center group-hover:bg-slate-900 transition-colors">
            {isDailyChallenge ? (
              <Crown className="w-10 h-10 text-amber-400 fill-current drop-shadow" />
            ) : (
              <Trophy className="w-10 h-10 text-amber-400 drop-shadow" />
            )}
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold shadow">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
          </span>
        </button>

        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-400 font-serif tracking-wide mb-1">
          {isDailyChallenge ? 'CROWN EARNED!' : 'VICTORY!'}
        </h2>
        <p className="text-emerald-300/90 text-sm font-medium mb-4">
          {isDailyChallenge ? (
            <>Daily Challenge Complete for <span className="font-bold text-white">{dailyDate}</span></>
          ) : (
            <>You mastered <span className="font-bold text-white">{gameDef.name}</span></>
          )}
        </p>

        {/* Daily Challenge Global Rank Banner */}
        {isDailyChallenge && (
          <div className="mb-4 py-2 px-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-bold text-white">Global Leaderboard Rank</span>
            </div>
            <span className="font-extrabold font-mono text-amber-300 text-sm bg-slate-900 px-2.5 py-0.5 rounded-lg border border-amber-400/50">
              #{dailyRank || 1}
            </span>
          </div>
        )}

        {isNewBest && !isDailyChallenge && (
          <div className="mb-4 py-1 px-3 bg-amber-500/20 border border-amber-400/50 rounded-full inline-block text-amber-300 text-xs font-bold tracking-wider animate-pulse">
            ★ NEW PERSONAL BEST! ★
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-950/70 border border-emerald-500/20 rounded-2xl p-3.5 mb-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Time</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{formatTime(timeSeconds)}</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-800">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-1">
              <Move className="w-3.5 h-3.5" />
              <span>Moves</span>
            </div>
            <span className="text-lg font-bold text-white font-mono">{moves}</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-slate-400 text-[11px] mb-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Score</span>
            </div>
            <span className="text-lg font-bold text-amber-300 font-mono">{score}</span>
          </div>
        </div>

        {/* Newly Unlocked Achievements Badge Celebration */}
        {unlockedAchievements && unlockedAchievements.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border-2 border-amber-400/80 rounded-2xl shadow-lg">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 mb-2">
              <Sparkles className="w-4 h-4 fill-current text-yellow-300" />
              <span>ACHIEVEMENT UNLOCKED!</span>
              <Sparkles className="w-4 h-4 fill-current text-yellow-300" />
            </div>
            <div className="space-y-1.5">
              {unlockedAchievements.map(ach => (
                <div key={ach.id} className="bg-slate-950/80 rounded-xl p-2 flex items-center justify-between text-left border border-amber-500/40">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{ach.title}</div>
                      <div className="text-[10px] text-slate-400 leading-tight">{ach.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">
                    +{ach.rewardPoints} pts
                  </span>
                </div>
              ))}
            </div>
            {onViewAchievements && (
              <button
                onClick={onViewAchievements}
                className="mt-2 text-[11px] font-bold text-amber-300 hover:text-white underline decoration-amber-400/50 transition-colors"
              >
                View all achievements in Stats Modal →
              </button>
            )}
          </div>
        )}

        {/* Interactive Confetti Popper Action */}
        <div className="mb-3 flex justify-center">
          <button
            onClick={triggerCelebrationBurst}
            className="py-1 px-3 rounded-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 hover:text-amber-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span>Blast Confetti ({burstCount})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Watch Game Playback Replay */}
          {onWatchReplay && (
            <button
              onClick={onWatchReplay}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 group"
            >
              <Film className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
              <span>Watch Game Replay ({moves} Moves)</span>
            </button>
          )}

          {isDailyChallenge && onViewLeaderboard && (
            <button
              onClick={onViewLeaderboard}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>View Global Leaderboard</span>
            </button>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={onPlayAgain}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>

            <button
              onClick={onSelectAnotherGame}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span>All 26 Games</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
