import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Layers,
  Shield,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { sound } from '../utils/audio';

export interface KlondikeTutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartGame?: () => void;
}

interface TutorialStep {
  id: string;
  target: 'overview' | 'stock-waste' | 'tableau' | 'foundations' | 'shortcuts';
  title: string;
  badge: string;
  description: string;
  keyRule: string;
  tips: string[];
  visualExample?: {
    type: 'foundation' | 'tableau' | 'stock';
    content: string;
  };
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    target: 'overview',
    title: 'Objective of Klondike',
    badge: 'Step 1 of 5',
    description:
      'Klondike Solitaire is played with a single 52-card deck. Your main mission is to move all cards from the board into the 4 Foundation piles sorted by suit from Ace up to King.',
    keyRule: 'Clear all 7 tableau columns and stock pile into foundations to win!',
    tips: [
      'Games can be won by uncovering all face-down cards.',
      'Tap or drag cards to move them between piles.',
    ],
    visualExample: {
      type: 'foundation',
      content: 'A ➔ 2 ➔ 3 ➔ ... ➔ K',
    },
  },
  {
    id: 'stock-waste',
    target: 'stock-waste',
    title: 'Stock & Waste Piles',
    badge: 'Step 2 of 5',
    description:
      'The face-down Stock pile holds reserve cards. Tap it to flip cards into the Waste pile. Only the topmost Waste card is active and ready to be played.',
    keyRule: 'Tap empty Stock to recycle waste cards back into the deck.',
    tips: [
      'Move playable waste cards to the Tableau columns or Foundation piles.',
      'In Easy mode, recycling passes are unlimited.',
    ],
    visualExample: {
      type: 'stock',
      content: 'Stock [🂠] ➔ Waste [Q♥] ➔ Playable',
    },
  },
  {
    id: 'tableau',
    target: 'tableau',
    title: 'The 7 Tableau Columns',
    badge: 'Step 3 of 5',
    description:
      'The playing field has 7 columns. Stack cards in descending rank order with alternating colors (Red on Black, Black on Red).',
    keyRule: 'Alternating Colors: Black ♠/♣ on Red ♥/♦ (and vice versa).',
    tips: [
      'Sequences: K ➔ Q ➔ J ➔ 10 ➔ 9 ➔ 8 ➔ 7 ➔ 6 ➔ 5 ➔ 4 ➔ 3 ➔ 2 ➔ A.',
      'You can drag or tap a whole stack of sequenced cards at once.',
      'Empty columns can only be filled by a King (K) or a stack starting with a King.',
    ],
    visualExample: {
      type: 'tableau',
      content: '[K♠ Black] ➔ [Q♥ Red] ➔ [J♣ Black]',
    },
  },
  {
    id: 'foundations',
    target: 'foundations',
    title: 'The 4 Foundation Piles',
    badge: 'Step 4 of 5',
    description:
      'Located at the top (or right rail in landscape). There are 4 piles, one for each suit: Spades (♠), Hearts (♥), Diamonds (♦), and Clubs (♣).',
    keyRule: 'Build up each suit starting strictly with the Ace (A), then 2, 3, up to King (K).',
    tips: [
      'Double-tap any card to instantly send it to an eligible foundation pile.',
      'When all cards on the table are turned face-up, the Auto-Finish button appears!',
    ],
    visualExample: {
      type: 'foundation',
      content: '[A♠] ➔ [2♠] ➔ [3♠] ... [K♠]',
    },
  },
  {
    id: 'shortcuts',
    target: 'shortcuts',
    title: 'Pro Controls & Smart Moves',
    badge: 'Step 5 of 5',
    description:
      'Our mobile-optimized controls make playing smooth and effortless with one thumb or mouse.',
    keyRule: 'Smart Tap: Single-tap any card to automatically move it to the best spot!',
    tips: [
      'Hint Button: Highlights the best available strategic move when you are stuck.',
      'Undo Button: Reverse moves freely without penalty to test alternate paths.',
      'Difficulty Setting: Switch between Easy (solvable deals), Medium, and Hard.',
    ],
    visualExample: {
      type: 'stock',
      content: 'Tap ➔ Auto Move | Double Tap ➔ Foundation',
    },
  },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const KlondikeTutorialOverlay: React.FC<KlondikeTutorialOverlayProps> = ({
  isOpen,
  onClose,
  onRestartGame,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const currentStep = TUTORIAL_STEPS[currentStepIndex];

  // Measure target DOM element bounding rect
  const updateSpotlight = useCallback(() => {
    if (!isOpen) return;

    if (currentStep.target === 'overview' || currentStep.target === 'shortcuts') {
      // In overview or shortcuts, highlight center or full board softly
      setTargetRect(null);
      return;
    }

    const selector = `[data-tutorial="${currentStep.target}"]`;
    const el = document.querySelector(selector);

    if (el) {
      const rect = el.getBoundingClientRect();
      const padding = 6;
      setTargetRect({
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        bottom: rect.bottom + padding,
        right: rect.right + padding,
      });
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep.target]);

  // Keep spotlight positioned on resize/orientation change
  useEffect(() => {
    if (!isOpen) return;
    updateSpotlight();

    const handleResize = () => {
      requestAnimationFrame(updateSpotlight);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    const timer = setTimeout(updateSpotlight, 120);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      clearTimeout(timer);
    };
  }, [isOpen, currentStepIndex, updateSpotlight]);

  const handleNext = () => {
    sound.playCardFlip();
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    sound.playCardFlip();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleStepJump = (idx: number) => {
    sound.playCardFlip();
    setCurrentStepIndex(idx);
  };

  const handleComplete = () => {
    sound.playSuccess();
    try {
      localStorage.setItem('solitaire_klondike_tutorial_completed', 'true');
      if (neverShowAgain) {
        localStorage.setItem('solitaire_klondike_tutorial_never_show', 'true');
      }
    } catch {}
    onClose();
  };

  // Compute Dialog Card Position
  const dialogPosition = useMemo(() => {
    if (typeof window === 'undefined') {
      return { top: 80, left: 20, width: 340 };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardWidth = Math.min(vw - 28, 440);

    // If no specific spotlight or overview, center nicely
    if (!targetRect) {
      return {
        top: Math.max(40, (vh - 380) / 2),
        left: Math.max(14, (vw - cardWidth) / 2),
        width: cardWidth,
        positionClass: 'center',
      };
    }

    // Determine whether to place card below or above target
    const spaceBelow = vh - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let targetTop: number;
    let positionClass: 'above' | 'below' = 'below';

    if (spaceBelow >= 260) {
      // Enough space below
      targetTop = targetRect.bottom + 12;
      positionClass = 'below';
    } else if (spaceAbove >= 260) {
      // Place above
      targetTop = Math.max(16, targetRect.top - 280);
      positionClass = 'above';
    } else {
      // Tight space: clamp to bottom or center of screen
      targetTop = Math.max(16, vh - 290);
      positionClass = 'below';
    }

    // Center horizontally relative to target rect, bounded by screen edges
    const idealLeft = targetRect.left + targetRect.width / 2 - cardWidth / 2;
    const targetLeft = Math.max(14, Math.min(vw - cardWidth - 14, idealLeft));

    return {
      top: Math.max(12, Math.min(vh - 290, targetTop)),
      left: targetLeft,
      width: cardWidth,
      positionClass,
    };
  }, [targetRect]);

  if (!isOpen) return null;

  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none animate-fadeIn">
      {/* SVG Spotlight Mask Backdrop */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="tutorial-spotlight-mask">
            {/* White covers all (opaque) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cutout reveals element underneath */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>

        {/* Shaded backdrop masked by spotlight */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.82)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Target Spotlight Highlight Border Ring */}
      {targetRect && (
        <div
          style={{
            position: 'absolute',
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          className="pointer-events-none rounded-2xl border-2 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.65)] ring-4 ring-amber-400/25 animate-pulse transition-all duration-300"
        />
      )}

      {/* Close / Skip button in top corner */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        <button
          onClick={handleComplete}
          className="py-1 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold backdrop-blur-md shadow-md transition-all active:scale-95 flex items-center gap-1.5"
        >
          <span>Skip Tutorial</span>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Floating Card */}
      <div
        style={{
          position: 'absolute',
          top: dialogPosition.top,
          left: dialogPosition.left,
          width: dialogPosition.width,
        }}
        className="z-50 bg-slate-900/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl p-4 sm:p-5 text-white flex flex-col gap-3 transition-all duration-300 animate-slideUp"
      >
        {/* Header: Badge & Title */}
        <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-300">
                {currentStep.target === 'stock-waste' ? (
                  <RotateCcw className="w-4 h-4" />
                ) : currentStep.target === 'foundations' ? (
                  <Shield className="w-4 h-4 text-emerald-400" />
                ) : currentStep.target === 'tableau' ? (
                  <Layers className="w-4 h-4 text-amber-400" />
                ) : currentStep.target === 'shortcuts' ? (
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                ) : (
                  <HelpCircle className="w-4 h-4 text-amber-300" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400">
                  {currentStep.badge}
                </span>
                <span className="text-[10px] text-slate-400">• Klondike Guide</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Close tutorial"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body Description */}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {currentStep.description}
        </p>

        {/* Key Golden Rule Box */}
        <div className="bg-amber-950/40 border border-amber-400/30 rounded-xl p-2.5 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold text-amber-200 leading-snug">
            {currentStep.keyRule}
          </div>
        </div>

        {/* Visual Example Badge if available */}
        {currentStep.visualExample && (
          <div className="bg-slate-950/70 border border-white/10 rounded-xl py-1.5 px-3 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Example:</span>
            <span className="font-bold text-amber-300">{currentStep.visualExample.content}</span>
          </div>
        )}

        {/* Tips list */}
        <div className="space-y-1">
          {currentStep.tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-normal">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>

        {/* Footer: Step Indicator Dots & Navigation Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-1">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {TUTORIAL_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleStepJump(idx)}
                className={`transition-all rounded-full ${
                  idx === currentStepIndex
                    ? 'w-5 h-2 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Go to step ${idx + 1}: ${s.title}`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold active:scale-95 transition-all flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className={`py-1.5 px-4 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 ${
                isLastStep
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-amber-500/20'
              }`}
            >
              <span>{isLastStep ? 'Play Klondike!' : 'Next Step'}</span>
              {isLastStep ? <ArrowRight className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Don't show automatically checkbox */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={neverShowAgain}
              onChange={e => setNeverShowAgain(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-400/30 w-3 h-3"
            />
            <span>Don't show automatically on start</span>
          </label>

          {onRestartGame && isLastStep && (
            <button
              onClick={() => {
                handleComplete();
                onRestartGame();
              }}
              className="text-amber-300 hover:underline font-semibold"
            >
              Deal Fresh Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
