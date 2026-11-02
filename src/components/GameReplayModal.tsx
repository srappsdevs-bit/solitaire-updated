import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Trophy,
  Clock,
  Move,
  Film,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GameId, PlayerSettings, ReplayStep } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';
import { GameBoard } from './GameBoard';
import { SolitaireState } from '../games/engine';
import { sound } from '../utils/audio';

export interface GameReplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: GameId;
  replaySteps: ReplayStep[];
  settings: PlayerSettings;
  finalScore: number;
  finalTimeSeconds: number;
  onPlayAgain?: () => void;
}

const SPEED_CONFIGS: { label: string; intervalMs: number }[] = [
  { label: '1x', intervalMs: 1100 },
  { label: '2x', intervalMs: 550 },
  { label: '4x', intervalMs: 250 },
];

export const GameReplayModal: React.FC<GameReplayModalProps> = ({
  isOpen,
  onClose,
  gameId,
  replaySteps,
  settings,
  finalScore,
  finalTimeSeconds,
  onPlayAgain,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0); // 0 = 1x, 1 = 2x, 2 = 4x
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);

  const playbackTimerRef = useRef<number | null>(null);
  const gameDef = SOLITAIRE_GAMES[gameId];

  const totalSteps = replaySteps.length;
  const currentStep = replaySteps[Math.min(currentStepIndex, Math.max(0, totalSteps - 1))] || null;

  // Stop playback timer
  const stopPlayback = useCallback(() => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Jump to specific step safely
  const goToStep = useCallback((index: number, playSoundEffect: boolean = true) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, index));
    setCurrentStepIndex(clamped);

    if (playSoundEffect && soundEnabled) {
      if (clamped === totalSteps - 1) {
        sound.playWinFanfare();
      } else {
        sound.playCardFlip();
      }
    }
  }, [totalSteps, soundEnabled]);

  const handleNextStep = useCallback(() => {
    if (currentStepIndex < totalSteps - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      stopPlayback();
    }
  }, [currentStepIndex, totalSteps, goToStep, stopPlayback]);

  const handlePrevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  }, [currentStepIndex, goToStep]);

  // Toggle Play / Pause
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      // If at end, loop back to start
      if (currentStepIndex >= totalSteps - 1) {
        setCurrentStepIndex(0);
      }
      setIsPlaying(true);
    }
  }, [isPlaying, currentStepIndex, totalSteps, stopPlayback]);

  // Playback timer runner
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = SPEED_CONFIGS[speedIndex].intervalMs;
    playbackTimerRef.current = window.setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev >= totalSteps - 1) {
          stopPlayback();
          if (soundEnabled) sound.playWinFanfare();
          return prev;
        }
        if (soundEnabled) sound.playCardFlip();
        return prev + 1;
      });
    }, interval);

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isOpen, isPlaying, speedIndex, totalSteps, soundEnabled, stopPlayback]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      setIsPlaying(false);
    } else {
      stopPlayback();
    }
  }, [isOpen, stopPlayback]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stopPlayback();
        handleNextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stopPlayback();
        handlePrevStep();
      } else if (e.key === 'Home') {
        e.preventDefault();
        stopPlayback();
        goToStep(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        stopPlayback();
        goToStep(totalSteps - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, togglePlayPause, handleNextStep, handlePrevStep, goToStep, totalSteps, onClose, stopPlayback]);

  if (!isOpen || !currentStep) return null;

  // Build a synthetic SolitaireState for the read-only GameBoard at this frame
  const boardState: SolitaireState = {
    gameId,
    tableau: currentStep.state.tableau,
    foundations: currentStep.state.foundations,
    stock: currentStep.state.stock,
    waste: currentStep.state.waste,
    freecells: currentStep.state.freecells,
    reserve: currentStep.state.reserve,
    grid: currentStep.state.grid,
    clockPositions: currentStep.state.clockPositions,
    selectedCardId: null,
    selectedStack: null,
    moves: currentStep.state.moves,
    score: currentStep.state.score,
    startTime: 0,
    elapsedTime: 0,
    isWon: currentStepIndex === totalSteps - 1,
    history: [],
    historyIndex: -1,
    redealsLeft: currentStep.state.redealsLeft ?? 0,
    replaySteps: [],
  };

  const isAtStart = currentStepIndex === 0;
  const isAtEnd = currentStepIndex === totalSteps - 1;
  const progressPercent = totalSteps > 1 ? Math.round((currentStepIndex / (totalSteps - 1)) * 100) : 100;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-fadeIn overflow-hidden">
      <div className="relative w-full max-w-5xl h-[94vh] bg-slate-950 border border-amber-500/40 rounded-3xl flex flex-col shadow-2xl overflow-hidden text-white">
        
        {/* Header HUD: Game info, stats, and close button */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-white/10 z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                <Film className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>{gameDef.name}</span>
                  <span className="text-amber-400 font-normal">Replay</span>
                </span>
                <span className="py-0.5 px-2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold">
                  {isPlaying ? 'PLAYING' : isAtEnd ? 'COMPLETED' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Step-by-step move playback of your winning game
              </p>
            </div>
          </div>

          {/* Quick Metrics & Close */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-3 bg-slate-950/80 border border-white/10 px-3 py-1 rounded-xl text-xs font-mono">
              <div className="flex items-center gap-1 text-slate-300">
                <Move className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentStep.state.moves} / {replaySteps[totalSteps - 1]?.state.moves || totalSteps - 1} moves</span>
              </div>
              <div className="flex items-center gap-1 text-amber-300 border-l border-white/10 pl-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentStep.state.score} pts</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors active:scale-95"
              title="Close Replay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Board Playing Stage (Read-only Solitaire Board) */}
        <div className="flex-1 relative overflow-hidden flex flex-col bg-emerald-950/60 pointer-events-auto">
          {/* Subtle table felt texture */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_0.75px,transparent_0.75px)] [background-size:16px_16px]"></div>

          <GameBoard
            state={boardState}
            settings={settings}
            hint={null}
            onCardClick={() => {}}
            onCardDoubleClick={() => {}}
            onStockClick={() => {}}
            canAutoComplete={false}
          />

          {/* Victory Overlay Flash when reaching final step */}
          {isAtEnd && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-4 py-1.5 rounded-2xl shadow-2xl border-2 border-white/80 flex items-center gap-2 animate-bounce select-none">
              <Sparkles className="w-4 h-4 fill-current" />
              <span className="text-xs font-black uppercase tracking-wider">Winning Board Reached!</span>
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
          )}
        </div>

        {/* Playback Control Deck & Timeline Scrubber */}
        <div className="bg-slate-950/95 border-t border-white/10 px-4 py-3 flex flex-col gap-2.5 z-30 shrink-0">
          
          {/* Move Narration & Step Status Banner */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-mono font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 text-[11px] shrink-0">
                Step {currentStepIndex} of {totalSteps - 1}
              </span>
              <span className="text-slate-200 font-medium truncate">
                {currentStep.description}
              </span>
            </div>

            <span className="text-[11px] font-mono text-slate-400 shrink-0 ml-2">
              {progressPercent}%
            </span>
          </div>

          {/* Timeline Scrubber Slider */}
          <div className="relative flex items-center w-full">
            <input
              type="range"
              min={0}
              max={Math.max(1, totalSteps - 1)}
              value={currentStepIndex}
              onChange={e => {
                stopPlayback();
                goToStep(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
            />
          </div>

          {/* Control Buttons Bar */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Left: Speed selector & sound */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSpeedIndex(prev => (prev + 1) % SPEED_CONFIGS.length)}
                className="py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 text-xs font-mono font-bold active:scale-95 transition-all flex items-center gap-1"
                title="Change playback speed"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{SPEED_CONFIGS[speedIndex].label}</span>
              </button>

              <button
                onClick={() => setSoundEnabled(prev => !prev)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white active:scale-90 transition-all"
                title={soundEnabled ? 'Mute Replay Sound' : 'Enable Replay Sound'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>
            </div>

            {/* Center: Playback Navigation buttons */}
            <div className="flex items-center gap-2">
              {/* Jump to start */}
              <button
                onClick={() => {
                  stopPlayback();
                  goToStep(0);
                }}
                disabled={isAtStart}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                title="Jump to Start (Home)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Step back */}
              <button
                onClick={() => {
                  stopPlayback();
                  handlePrevStep();
                }}
                disabled={isAtStart}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                title="Step Back (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Play / Pause Primary Button */}
              <button
                onClick={togglePlayPause}
                className={`py-2 px-5 rounded-2xl font-bold text-sm shadow-lg flex items-center gap-2 active:scale-95 transition-all ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
                }`}
                title="Play / Pause (Spacebar)"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : isAtEnd ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Replay</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>

              {/* Step forward */}
              <button
                onClick={() => {
                  stopPlayback();
                  handleNextStep();
                }}
                disabled={isAtEnd}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                title="Step Forward (Right Arrow)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Jump to end */}
              <button
                onClick={() => {
                  stopPlayback();
                  goToStep(totalSteps - 1);
                }}
                disabled={isAtEnd}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all"
                title="Jump to Victory (End)"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Close or Return button */}
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold active:scale-95 transition-all"
              >
                Back to Victory
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
