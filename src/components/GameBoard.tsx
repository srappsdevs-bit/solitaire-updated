import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Card, PlayerSettings } from '../types/solitaire';
import { CardView } from './CardView';
import { SolitaireState, isValidMove } from '../games/engine';
import { RotateCcw, Sparkles, ArrowDown, Layers, Shield, Sparkle } from 'lucide-react';
import { getRankSymbol } from '../utils/cardUtils';
import { sound } from '../utils/audio';

interface GameBoardProps {
  state: SolitaireState;
  settings: PlayerSettings;
  hint: { from: { type: string; index: number; cardId: string }; to: { type: string; index: number } } | null;
  onCardClick: (card: Card, location: { type: 'tableau' | 'waste' | 'freecell' | 'reserve' | 'grid' | 'clock'; colIndex?: number; cardIndex?: number }) => void;
  onCardDoubleClick: (card: Card) => void;
  onStockClick: () => void;
  onEmptyColClick?: (colIndex: number) => void;
  onEmptyFreeCellClick?: (cellIndex: number) => void;
  onEmptyFoundationClick?: (fIndex: number) => void;
  onConsolidateGrid?: () => void;
  onClockTurnNext?: () => void;
  onAutoComplete?: () => void;
  canAutoComplete?: boolean;
  undoTrigger?: number;
  dealTrigger?: number;
  isShaking?: boolean;
  onDropCards?: (
    source: { type: string; colIndex?: number; cardIndex?: number },
    target: { type: 'tableau' | 'foundation' | 'freecell'; index: number }
  ) => void;
}

/**
 * Responsive Hook to detect landscape or wide desktop displays
 */
const useIsLandscape = (setting: PlayerSettings['landscapeLayout'] = 'auto') => {
  const [isScreenLandscape, setIsScreenLandscape] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 820 || (window.innerWidth > window.innerHeight && window.innerWidth >= 560);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsScreenLandscape(window.innerWidth >= 820 || (window.innerWidth > window.innerHeight && window.innerWidth >= 560));
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (setting === 'top') return false;
  if (setting === 'split' || setting === 'side-left') return true;
  return isScreenLandscape;
};

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  settings,
  hint,
  onCardClick,
  onCardDoubleClick,
  onStockClick,
  onEmptyColClick,
  onEmptyFreeCellClick,
  onEmptyFoundationClick,
  onConsolidateGrid,
  onClockTurnNext,
  onAutoComplete,
  canAutoComplete = false,
  undoTrigger,
  dealTrigger,
  isShaking = false,
  onDropCards,
}) => {
  const { gameId, tableau, foundations, stock, waste, freecells, reserve, grid, clockPositions } = state;

  const isLandscape = useIsLandscape(settings.landscapeLayout);
  const layoutMode = settings.landscapeLayout || 'auto';
  const effectiveLayout = layoutMode === 'auto' ? (isLandscape ? 'split' : 'top') : layoutMode;

  const isCardHintSource = (cardId: string) => hint?.from.cardId === cardId;
  const isColHintTarget = (colIndex: number) => hint?.to.type === 'tableau' && hint.to.index === colIndex;
  const isFoundationHintTarget = (fIndex: number) => hint?.to.type === 'foundation' && hint.to.index === fIndex;
  const isFreeCellHintTarget = (cellIndex: number) => hint?.to.type === 'freecell' && hint.to.index === cellIndex;

  // Reference to board container and previous card bounding boxes for FLIP undo slide animation
  const boardRef = useRef<HTMLDivElement>(null);
  const lastCardPositionsRef = useRef<Map<string, { left: number; top: number; width: number; height: number }>>(new Map());
  const prevUndoTriggerRef = useRef<number | undefined>(undoTrigger);
  const prevDealTriggerRef = useRef<number | undefined>(dealTrigger);
  const isDealingRef = useRef<boolean>(false);
  const dealTimersRef = useRef<number[]>([]);
  const prevHistoryIndexRef = useRef<number>(state.historyIndex);
  const activeAnimationsRef = useRef<{ cardEl: HTMLElement; wrapperEl: HTMLElement | null; colEl: HTMLElement | null }[]>([]);
  const animationTimerRef = useRef<number | null>(null);

  // Helper: calculate cumulative top offset for each card in a tableau column
  const getCardTop = useCallback((column: Card[], cardIndex: number, isLandscapeMode: boolean): number => {
    if (cardIndex <= 0) return 0;
    const isDeep = column.length > 9;
    const faceDownPeek = isLandscapeMode ? (isDeep ? 12 : 16) : (isDeep ? 10 : 14);
    const faceUpPeek = isLandscapeMode ? (isDeep ? 28 : 34) : (isDeep ? 26 : 30);

    let total = 0;
    for (let i = 0; i < cardIndex; i++) {
      total += column[i]?.faceUp ? faceUpPeek : faceDownPeek;
    }
    return total;
  }, []);

  const getColumnMinHeight = useCallback((column: Card[], isLandscapeMode: boolean): number => {
    if (!column || column.length === 0) return isLandscapeMode ? 95 : 85;
    const topOfLast = getCardTop(column, column.length - 1, isLandscapeMode);
    return topOfLast + (isLandscapeMode ? 115 : 100);
  }, [getCardTop]);

  // State to track active undo action and disable transitions so cards snap cleanly into place
  const [isUndoing, setIsUndoing] = useState<boolean>(false);
  const undoTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (undoTrigger !== undefined && undoTrigger !== prevUndoTriggerRef.current) {
      prevUndoTriggerRef.current = undoTrigger;
      setIsUndoing(true);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = window.setTimeout(() => {
        setIsUndoing(false);
      }, 75);
    }
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, [undoTrigger]);

  // Short CSS transition delay for card movements to prevent visual overlap during rapid state updates and undo actions
  const isSnap = settings.cardAnimation === 'snap';
  const moveDuration = settings.fastAnimations ? '90ms' : '150ms';
  const cardTransition = (isSnap || isUndoing)
    ? 'none'
    : `top ${moveDuration} cubic-bezier(0.2, 0.8, 0.2, 1) 25ms, transform ${moveDuration} cubic-bezier(0.2, 0.8, 0.2, 1) 25ms`;

  // Capture all visible card rects currently rendered on the board
  const captureCardRects = useCallback(() => {
    const container = boardRef.current || document.querySelector('[data-solitaire-board="true"]');
    if (!container) return;

    const cardElements = container.querySelectorAll<HTMLElement>('[data-card-id]');
    const map = new Map<string, { left: number; top: number; width: number; height: number }>();
    cardElements.forEach(el => {
      const id = el.getAttribute('data-card-id');
      if (id) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          map.set(id, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
        }
      }
    });
    lastCardPositionsRef.current = map;
  }, []);

  // Clean up any active deal animation properties across cards on the board without stripping React-managed stacking styles
  const cleanupAnimations = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    activeAnimationsRef.current = [];

    // Strip any lingering inline deal animation styles from cards without touching React-controlled parent zIndex
    const container = boardRef.current || document.querySelector('[data-solitaire-board="true"]');
    if (container) {
      const cards = container.querySelectorAll<HTMLElement>('[data-card-id]');
      cards.forEach(cardEl => {
        cardEl.style.removeProperty('transform');
        cardEl.style.removeProperty('transition');
        cardEl.style.removeProperty('box-shadow');
        cardEl.style.removeProperty('pointer-events');
        cardEl.style.removeProperty('opacity');
        // Only remove inline z-index on the card itself if deal elevated it, never from wrapper
        cardEl.style.removeProperty('z-index');
      });
      const cols = container.querySelectorAll<HTMLElement>('[data-tableau-col]');
      cols.forEach(colEl => {
        colEl.style.removeProperty('z-index');
      });
    }
  }, []);

  // Clear any active deal animation timers
  const clearDealTimers = useCallback(() => {
    dealTimersRef.current.forEach(timer => clearTimeout(timer));
    dealTimersRef.current = [];
  }, []);

  // Instantly finish deal animation if user clicks the board or starts interacting
  const finishDealEarly = useCallback(() => {
    if (!isDealingRef.current) return;
    clearDealTimers();
    isDealingRef.current = false;
    const container = boardRef.current || document.querySelector('[data-solitaire-board="true"]');
    if (container) {
      const cards = container.querySelectorAll<HTMLElement>('[data-card-id]');
      cards.forEach(cardEl => {
        cardEl.style.removeProperty('transform');
        cardEl.style.removeProperty('transition');
        cardEl.style.removeProperty('opacity');
        cardEl.style.removeProperty('z-index');
        cardEl.style.removeProperty('pointer-events');
      });
    }
    captureCardRects();
  }, [clearDealTimers, captureCardRects]);

  // Staggered entrance animation for initial card deal from the stock pile
  const animateInitialDeal = useCallback(() => {
    const container = boardRef.current || document.querySelector('[data-solitaire-board="true"]');
    if (!container) return;

    clearDealTimers();
    cleanupAnimations();
    isDealingRef.current = true;

    // 1. Locate the stock pile position on board or fallback to top-left area
    const stockEl = container.querySelector<HTMLElement>('[data-stock-pile="true"], [data-tutorial="stock-waste"]');
    const boardRect = container.getBoundingClientRect();

    let stockRect: { left: number; top: number; width: number; height: number };
    if (stockEl && stockEl.getBoundingClientRect().width > 0) {
      stockRect = stockEl.getBoundingClientRect();
    } else {
      stockRect = {
        left: boardRect.left + (boardRect.width < 500 ? 16 : 32),
        top: boardRect.top + 20,
        width: 50,
        height: 70,
      };
    }

    // 2. Build dealing order: row-by-row across columns for classic dealer cadence
    const cardIdSequence: string[] = [];

    // Standard Tableau Columns (row-by-row deal)
    if (state.tableau && state.tableau.length > 0) {
      const maxColDepth = Math.max(...state.tableau.map(col => col.length), 0);
      for (let r = 0; r < maxColDepth; r++) {
        for (let c = 0; c < state.tableau.length; c++) {
          const card = state.tableau[c]?.[r];
          if (card) {
            cardIdSequence.push(card.id);
          }
        }
      }
    }

    // Grid cells (Monte Carlo)
    if (state.grid && state.grid.length > 0) {
      for (let r = 0; r < state.grid.length; r++) {
        for (let c = 0; c < state.grid[r].length; c++) {
          const card = state.grid[r][c];
          if (card) {
            cardIdSequence.push(card.id);
          }
        }
      }
    }

    // Clock positions (Grandfather / Clock)
    if (state.clockPositions && state.clockPositions.length > 0) {
      for (const pos of state.clockPositions) {
        for (const card of pos.cards) {
          cardIdSequence.push(card.id);
        }
      }
    }

    // Reserve cards (Canfield)
    if (state.reserve && state.reserve.length > 0) {
      for (const card of state.reserve) {
        cardIdSequence.push(card.id);
      }
    }

    if (cardIdSequence.length === 0) {
      isDealingRef.current = false;
      captureCardRects();
      return;
    }

    const animStyle = settings.cardAnimation || 'slide';
    if (animStyle === 'snap') {
      isDealingRef.current = false;
      captureCardRects();
      return;
    }

    // 3. Measure target card elements and position them at the stock pile or prepare fade
    const dealtCards: { cardEl: HTMLElement; deltaX: number; deltaY: number }[] = [];

    cardIdSequence.forEach(cardId => {
      const cardEl = container.querySelector<HTMLElement>(`[data-card-id="${cardId}"]`);
      if (cardEl) {
        const destRect = cardEl.getBoundingClientRect();
        if (destRect.width > 0 && destRect.height > 0) {
          const deltaX = (stockRect.left + stockRect.width / 2) - (destRect.left + destRect.width / 2);
          const deltaY = (stockRect.top + stockRect.height / 2) - (destRect.top + destRect.height / 2);
          dealtCards.push({ cardEl, deltaX, deltaY });

          // Start concealed
          cardEl.style.setProperty('opacity', '0', 'important');
          if (animStyle !== 'fade') {
            cardEl.style.setProperty('transform', `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.92)`, 'important');
          }
          cardEl.style.setProperty('transition', 'none', 'important');
          cardEl.style.setProperty('pointer-events', 'none', 'important');
        }
      }
    });

    if (dealtCards.length === 0) {
      isDealingRef.current = false;
      captureCardRects();
      return;
    }

    // 4. Staggered Deal Execution (50% faster in Fast Mode)
    const isFast = settings.fastAnimations;
    const staggerDelay = isFast ? 17 : 34; // ms between successive cards leaving stock
    const slideDuration = isFast ? 150 : 300; // ms duration of card flight
    const totalCount = dealtCards.length;

    dealtCards.forEach(({ cardEl }, index) => {
      const startTimer = window.setTimeout(() => {
        if (!isDealingRef.current) return;

        cardEl.style.setProperty('z-index', '50', 'important');
        cardEl.style.setProperty('opacity', '1', 'important');

        if (animStyle === 'fade') {
          cardEl.style.setProperty(
            'transition',
            `opacity ${slideDuration}ms ease-in-out`,
            'important'
          );
        } else {
          // Slide into place with slight spring momentum curve
          cardEl.style.setProperty(
            'transition',
            `transform ${slideDuration}ms cubic-bezier(0.18, 0.89, 0.32, 1.12), opacity 90ms ease`,
            'important'
          );
          cardEl.style.setProperty('transform', 'translate3d(0px, 0px, 0px) scale(1)', 'important');
        }

        // Tactile audio snap on deal cadence
        if (index % 2 === 0 || index === totalCount - 1) {
          sound.playCardPlace();
        }

        // On individual card landing, clean its temporary elevated z-index and pointer-events
        const landTimer = window.setTimeout(() => {
          if (!isDealingRef.current) return;
          cardEl.style.removeProperty('z-index');
          cardEl.style.removeProperty('pointer-events');
        }, slideDuration);
        dealTimersRef.current.push(landTimer);

      }, index * staggerDelay);

      dealTimersRef.current.push(startTimer);
    });

    // 5. Final completion cleanup
    const totalDealDuration = (totalCount * staggerDelay) + slideDuration + 60;
    const finishTimer = window.setTimeout(() => {
      if (!isDealingRef.current) return;
      isDealingRef.current = false;
      dealtCards.forEach(({ cardEl }) => {
        cardEl.style.removeProperty('transform');
        cardEl.style.removeProperty('transition');
        cardEl.style.removeProperty('opacity');
        cardEl.style.removeProperty('z-index');
        cardEl.style.removeProperty('pointer-events');
      });
      captureCardRects();
    }, totalDealDuration);

    dealTimersRef.current.push(finishTimer);
  }, [clearDealTimers, cleanupAnimations, state.tableau, state.grid, state.clockPositions, state.reserve, settings.fastAnimations, settings.cardAnimation, captureCardRects]);

  // Trigger staggered deal entrance when dealTrigger changes
  useLayoutEffect(() => {
    if (dealTrigger && dealTrigger !== prevDealTriggerRef.current) {
      prevDealTriggerRef.current = dealTrigger;
      let frameId2: number;
      const frameId1 = requestAnimationFrame(() => {
        frameId2 = requestAnimationFrame(() => {
          animateInitialDeal();
        });
      });
      return () => {
        cancelAnimationFrame(frameId1);
        if (frameId2) cancelAnimationFrame(frameId2);
      };
    }
  }, [dealTrigger, animateInitialDeal]);

  // On undo or state changes, ensure all animation transforms are cleaned up immediately
  useLayoutEffect(() => {
    if (isDealingRef.current) return;
    cleanupAnimations();
    captureCardRects();
  }, [state.historyIndex, undoTrigger, cleanupAnimations, captureCardRects]);

  useEffect(() => {
    const handleResize = () => {
      if (isDealingRef.current) {
        finishDealEarly();
      } else {
        captureCardRects();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearDealTimers();
      cleanupAnimations();
    };
  }, [captureCardRects, cleanupAnimations, clearDealTimers, finishDealEarly]);

  // -------------------------------------------------------------
  // DRAG AND DROP INTERACTION ENGINE (Tableau columns, foundations, freecells)
  // -------------------------------------------------------------
  const [dragSource, setDragSource] = useState<{
    type: 'tableau' | 'waste' | 'freecell';
    colIndex?: number;
    cardIndex?: number;
    cardId: string;
  } | null>(null);

  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [dragOverFoundation, setDragOverFoundation] = useState<number | null>(null);
  const [isValidDropHover, setIsValidDropHover] = useState<boolean>(false);

  const touchDragRef = useRef<{
    source: { type: 'tableau' | 'waste' | 'freecell'; colIndex?: number; cardIndex?: number };
    card: Card;
    startX: number;
    startY: number;
    isDragging: boolean;
  } | null>(null);

  const getMovingCards = useCallback((source: { type: string; colIndex?: number; cardIndex?: number }) => {
    if (source.type === 'tableau' && source.colIndex !== undefined && source.cardIndex !== undefined) {
      return state.tableau[source.colIndex]?.slice(source.cardIndex) || [];
    } else if (source.type === 'waste' && state.waste.length > 0) {
      return [state.waste[state.waste.length - 1]];
    } else if (source.type === 'freecell' && source.colIndex !== undefined) {
      const cell = state.freecells[source.colIndex];
      return cell ? [cell] : [];
    }
    return [];
  }, [state.tableau, state.waste, state.freecells]);

  const handleDragStart = useCallback((
    e: React.DragEvent,
    source: { type: 'tableau' | 'waste' | 'freecell'; colIndex?: number; cardIndex?: number },
    card: Card
  ) => {
    if (!card.faceUp) {
      e.preventDefault();
      return;
    }

    // Spider check: cards below must be in same-suit sequence to drag as a group
    if (source.type === 'tableau' && source.colIndex !== undefined && source.cardIndex !== undefined) {
      if (state.gameId === 'spider1' || state.gameId === 'spider2' || state.gameId === 'spider4') {
        const col = state.tableau[source.colIndex];
        for (let i = source.cardIndex; i < col.length - 1; i++) {
          if (col[i].suit !== col[i + 1].suit || col[i].rank !== col[i + 1].rank + 1) {
            e.preventDefault();
            return;
          }
        }
      }
    }

    const payload = JSON.stringify(source);
    e.dataTransfer.setData('text/plain', payload);
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.effectAllowed = 'move';

    setDragSource({
      ...source,
      cardId: card.id,
    });
  }, [state.gameId, state.tableau]);

  const handleDragOverCol = useCallback((e: React.DragEvent, colIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnterCol = useCallback((e: React.DragEvent, colIdx: number) => {
    e.preventDefault();
    setDragOverCol(colIdx);

    if (!dragSource) return;

    if (dragSource.type === 'tableau' && dragSource.colIndex === colIdx) {
      setIsValidDropHover(false);
      return;
    }

    const movingCards = getMovingCards(dragSource);
    if (movingCards.length > 0 && isValidMove(state, movingCards, { type: 'tableau', index: colIdx })) {
      setIsValidDropHover(true);
    } else {
      setIsValidDropHover(false);
    }
  }, [dragSource, getMovingCards, state]);

  const handleDragLeaveCol = useCallback((e: React.DragEvent, colIdx: number) => {
    const relatedTarget = e.relatedTarget as Node | null;
    if (e.currentTarget.contains(relatedTarget)) return;

    if (dragOverCol === colIdx) {
      setDragOverCol(null);
      setIsValidDropHover(false);
    }
  }, [dragOverCol]);

  const handleDropOnCol = useCallback((e: React.DragEvent, colIdx: number) => {
    e.preventDefault();
    setDragOverCol(null);
    setIsValidDropHover(false);

    let source = dragSource;
    if (!source) {
      try {
        const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
        if (raw) source = JSON.parse(raw);
      } catch {}
    }

    if (source && onDropCards) {
      onDropCards(source, { type: 'tableau', index: colIdx });
    }
    setDragSource(null);
  }, [dragSource, onDropCards]);

  const handleDragEnd = useCallback(() => {
    setDragSource(null);
    setDragOverCol(null);
    setDragOverFoundation(null);
    setIsValidDropHover(false);
  }, []);

  const handleDropOnFoundation = useCallback((e: React.DragEvent, fIdx: number) => {
    e.preventDefault();
    setDragOverFoundation(null);

    let source = dragSource;
    if (!source) {
      try {
        const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
        if (raw) source = JSON.parse(raw);
      } catch {}
    }

    if (source && onDropCards) {
      onDropCards(source, { type: 'foundation', index: fIdx });
    }
    setDragSource(null);
  }, [dragSource, onDropCards]);

  // Touch gesture support for mobile drag-and-drop
  const handleTouchStart = (
    e: React.TouchEvent,
    source: { type: 'tableau' | 'waste' | 'freecell'; colIndex?: number; cardIndex?: number },
    card: Card
  ) => {
    if (!card.faceUp || e.touches.length !== 1) return;
    touchDragRef.current = {
      source,
      card,
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      isDragging: false,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dist = Math.hypot(touch.clientX - touchDragRef.current.startX, touch.clientY - touchDragRef.current.startY);

    if (dist > 14) {
      touchDragRef.current.isDragging = true;
      if (!dragSource) {
        setDragSource({
          ...touchDragRef.current.source,
          cardId: touchDragRef.current.card.id,
        });
      }

      const elem = document.elementFromPoint(touch.clientX, touch.clientY);
      const colElem = elem?.closest('[data-tableau-col]');
      if (colElem) {
        const colIdx = parseInt(colElem.getAttribute('data-tableau-col') || '-1', 10);
        if (colIdx >= 0) {
          setDragOverCol(colIdx);
          const movingCards = getMovingCards(touchDragRef.current.source);
          if (movingCards.length > 0 && isValidMove(state, movingCards, { type: 'tableau', index: colIdx })) {
            setIsValidDropHover(true);
          } else {
            setIsValidDropHover(false);
          }
          return;
        }
      }
      setDragOverCol(null);
      setIsValidDropHover(false);
    }
  };

  const handleTouchEnd = () => {
    if (touchDragRef.current?.isDragging && dragOverCol !== null && onDropCards) {
      onDropCards(touchDragRef.current.source, { type: 'tableau', index: dragOverCol });
    }
    touchDragRef.current = null;
    setDragSource(null);
    setDragOverCol(null);
    setIsValidDropHover(false);
  };

  const renderBoardContent = () => {
    // -------------------------------------------------------------
    // LAYOUT 1: CLOCK SOLITAIRE (12 Hours + Center Kings)
    // -------------------------------------------------------------
    if (gameId === 'clock') {
      return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 relative select-none">
        <div className="relative w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] md:w-[460px] md:h-[460px]">
          {clockPositions?.map((pos, idx) => {
            const isCenter = pos.hour === 13;
            const angleDeg = isCenter ? 0 : pos.hour * 30 - 90;
            const radiusPercent = isCenter ? 0 : 38;
            const xPercent = 50 + radiusPercent * Math.cos((angleDeg * Math.PI) / 180);
            const yPercent = 50 + radiusPercent * Math.sin((angleDeg * Math.PI) / 180);

            const topCard = pos.cards[pos.cards.length - 1];
            const hasCards = pos.cards.length > 0;

            return (
              <div
                key={pos.hour}
                style={{
                  position: 'absolute',
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="flex flex-col items-center"
              >
                <div
                  onClick={() => {
                    if (hasCards) {
                      onCardClick(topCard, { type: 'clock', colIndex: idx, cardIndex: pos.cards.length - 1 });
                    }
                  }}
                  className={`relative w-[48px] sm:w-[60px] h-[66px] sm:h-[84px] rounded-lg border border-white/20 flex items-center justify-center shadow-md transition-transform ${
                    hasCards ? 'cursor-pointer hover:scale-105 active:scale-95' : 'bg-black/30'
                  }`}
                >
                  {hasCards ? (
                    <CardView card={topCard} cardBack={settings.cardBack} className="w-full h-full" />
                  ) : (
                    <span className="text-white/40 text-xs font-serif font-bold">
                      {isCenter ? 'K' : getRankSymbol(pos.hour)}
                    </span>
                  )}
                  <span className="absolute -top-2 -right-1 px-1 py-0.2 rounded-full bg-slate-900 border border-amber-400 text-[9px] font-bold text-amber-300 shadow">
                    {isCenter ? 'K' : pos.hour}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClockTurnNext}
          className="mt-3 py-2 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>Turn Next Card</span>
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LAYOUT 2: GAPS (MONTANA) 4x13 GRID
  // -------------------------------------------------------------
  if (gameId === 'gaps') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-x-auto">
        <div className="min-w-[620px] max-w-full bg-slate-950/70 p-2 sm:p-3 rounded-2xl border border-white/10 shadow-xl space-y-1.5">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1 justify-center">
              {row.map((cell, cIdx) => (
                <div key={`${rIdx}-${cIdx}`} className="w-[42px] sm:w-[50px] md:w-[58px] aspect-[2.5/3.5] rounded-md">
                  {cell ? (
                    <CardView
                      card={cell}
                      cardBack={settings.cardBack}
                      onClick={() => onCardClick(cell, { type: 'grid', colIndex: rIdx, cardIndex: cIdx })}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-md border border-dashed border-amber-400/40 bg-black/40 flex items-center justify-center text-amber-300/40 text-[9px] font-mono">
                      GAP
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2 text-[10px] sm:text-xs text-slate-300">
          <span className="bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 text-center">
            Rule: Match <b>same suit & rank +1</b> into gap of card to left. Column 1 accepts any 2!
          </span>
          {state.redealsLeft > 0 && (
            <button
              onClick={onStockClick}
              className="py-1 px-3 rounded-lg bg-amber-400 text-slate-950 font-bold active:scale-95 transition-all"
            >
              Redeal ({state.redealsLeft})
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LAYOUT 3: MONTE CARLO 5x5 GRID (Responsive Landscape & Portrait)
  // -------------------------------------------------------------
  if (gameId === 'montecarlo') {
    if (isLandscape) {
      return (
        <div className="w-full h-full flex items-center justify-center gap-6 p-3 select-none">
          {/* Landscape Side Station */}
          <div className="flex flex-col items-center gap-3 p-3 bg-slate-950/70 rounded-2xl border border-white/10 shadow-xl">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Stock Pile</span>
            <div
              onClick={stock.length > 0 ? onStockClick : undefined}
              className={`w-[54px] sm:w-[62px] aspect-[2.5/3.5] rounded-lg border ${
                stock.length > 0 ? 'border-amber-400/50 cursor-pointer hover:scale-105 active:scale-95 shadow' : 'border-white/10 bg-black/30'
              }`}
            >
              {stock.length > 0 ? (
                <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} fastAnimations={settings.fastAnimations} className="w-full h-full pointer-events-none" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">Empty</div>
              )}
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-300">{stock.length} cards left</span>

            <button
              onClick={onConsolidateGrid}
              className="mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span>Consolidate</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5x5 Playing Grid */}
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-white/10 shadow-xl space-y-2">
            {grid.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-2">
                {row.map((cell, cIdx) => (
                  <div key={`${rIdx}-${cIdx}`} className="w-[52px] sm:w-[62px] md:w-[68px] aspect-[2.5/3.5] rounded-md">
                    {cell ? (
                      <CardView
                        card={cell}
                        cardBack={settings.cardBack}
                        cardFace={settings.cardFace} fastAnimations={settings.fastAnimations}
                        isSelected={state.selectedCardId === cell.id}
                        onClick={() => onCardClick(cell, { type: 'grid', colIndex: rIdx, cardIndex: cIdx })}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-md border border-white/10 bg-black/30"></div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Portrait Monte Carlo
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-2 select-none">
        <div className="flex items-center gap-4 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Stock ({stock.length}):</span>
            <div
              onClick={stock.length > 0 ? onStockClick : undefined}
              className={`w-[48px] h-[68px] rounded-md border ${
                stock.length > 0 ? 'cursor-pointer hover:scale-105' : 'border-white/10 bg-black/20'
              }`}
            >
              {stock.length > 0 ? (
                <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-[10px]">Empty</div>
              )}
            </div>
          </div>

          <button
            onClick={onConsolidateGrid}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Consolidate</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-2xl border border-white/10 shadow-xl space-y-1.5">
          {grid.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-1.5">
              {row.map((cell, cIdx) => (
                <div key={`${rIdx}-${cIdx}`} className="w-[48px] sm:w-[58px] aspect-[2.5/3.5] rounded-md">
                  {cell ? (
                    <CardView
                      card={cell}
                      isSelected={state.selectedCardId === cell.id}
                      onClick={() => onCardClick(cell, { type: 'grid', colIndex: rIdx, cardIndex: cIdx })}
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-md border border-white/10 bg-black/30"></div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LAYOUT 4: PYRAMID & TRIPEAKS (Responsive Landscape & Portrait)
  // -------------------------------------------------------------
  if (gameId === 'pyramid' || gameId === 'tripeaks') {
    if (isLandscape) {
      return (
        <div className="w-full h-full flex items-center justify-between p-3 gap-4 overflow-hidden select-none">
          {/* Left Side Rail: Stock & Waste Station */}
          <div className="w-36 flex flex-col items-center gap-3 p-3 bg-slate-950/60 rounded-2xl border border-white/10 shadow-lg">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Talon & Waste</span>
            
            {/* Stock */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-300 mb-1">
                Stock ({stock.length}) {state.redealsLeft >= 0 && `• ${state.redealsLeft}`}
              </span>
              <div
                onClick={onStockClick}
                className={`w-[52px] sm:w-[60px] aspect-[2.5/3.5] rounded-lg border ${
                  stock.length > 0
                    ? 'border-amber-400/60 cursor-pointer hover:scale-105 active:scale-95 shadow-md'
                    : 'border-white/15 bg-black/30 flex items-center justify-center cursor-pointer'
                }`}
              >
                {stock.length > 0 ? (
                  <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full pointer-events-none" />
                ) : (
                  <RotateCcw className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </div>

            {/* Waste */}
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] text-slate-300 mb-1">Waste ({waste.length})</span>
              <div className="w-[52px] sm:w-[60px] aspect-[2.5/3.5] rounded-lg border border-white/20 bg-black/20 flex items-center justify-center shadow-inner">
                {waste.length > 0 ? (
                  <CardView
                    card={waste[waste.length - 1]}
                    cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                    isSelected={state.selectedCardId === waste[waste.length - 1].id}
                    onClick={() => onCardClick(waste[waste.length - 1], { type: 'waste' })}
                    className="w-full h-full"
                  />
                ) : (
                  <span className="text-white/30 text-[10px]">Empty</span>
                )}
              </div>
            </div>
          </div>

          {/* Center Stage: Pyramid / Peaks Formation */}
          <div className="flex-1 h-full flex flex-col items-center justify-center overflow-y-auto py-2">
            <div className="w-full max-w-xl flex flex-col items-center space-y-[-24px] sm:space-y-[-28px]">
              {tableau.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-1.5 sm:gap-2.5 z-10">
                  {row.map((card, cIdx) => (
                    <div key={card.id} className="w-[46px] sm:w-[56px] aspect-[2.5/3.5]">
                      <CardView
                        card={card}
                        cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                        isSelected={state.selectedCardId === card.id}
                        isHintSource={isCardHintSource(card.id)}
                        onClick={() => onCardClick(card, { type: 'tableau', colIndex: rIdx, cardIndex: cIdx })}
                        className="shadow-md"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Portrait Pyramid & Tripeaks
    return (
      <div className="w-full h-full flex flex-col justify-between items-center p-2 overflow-y-auto select-none">
        <div className="w-full max-w-lg flex flex-col items-center py-1 space-y-[-24px] sm:space-y-[-28px]">
          {tableau.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1 sm:gap-2 z-10">
              {row.map((card, cIdx) => (
                <div key={card.id} className="w-[42px] sm:w-[50px] aspect-[2.5/3.5]">
                  <CardView
                    card={card}
                    cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                    isSelected={state.selectedCardId === card.id}
                    isHintSource={isCardHintSource(card.id)}
                    onClick={() => onCardClick(card, { type: 'tableau', colIndex: rIdx, cardIndex: cIdx })}
                    className="shadow-md"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="w-full max-w-xs flex items-center justify-center gap-6 py-2.5 bg-slate-950/60 rounded-xl border border-white/10 mt-2">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 mb-0.5">
              Stock ({stock.length}) {state.redealsLeft >= 0 && `• ${state.redealsLeft}`}
            </span>
            <div
              onClick={onStockClick}
              className={`w-[48px] sm:w-[56px] aspect-[2.5/3.5] rounded-md border ${
                stock.length > 0
                  ? 'border-amber-400/50 cursor-pointer hover:scale-105 active:scale-95 shadow'
                  : 'border-white/15 bg-black/30 flex items-center justify-center cursor-pointer'
              }`}
            >
              {stock.length > 0 ? (
                <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full pointer-events-none" />
              ) : (
                <RotateCcw className="w-4 h-4 text-slate-500" />
              )}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 mb-0.5">Waste ({waste.length})</span>
            <div className="w-[48px] sm:w-[56px] aspect-[2.5/3.5] rounded-md border border-white/20 bg-black/20 flex items-center justify-center">
              {waste.length > 0 ? (
                <CardView
                  card={waste[waste.length - 1]}
                  cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                  isSelected={state.selectedCardId === waste[waste.length - 1].id}
                  onClick={() => onCardClick(waste[waste.length - 1], { type: 'waste' })}
                  className="w-full h-full"
                />
              ) : (
                <span className="text-white/30 text-[10px]">Empty</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LAYOUT 5: GOLF SOLITAIRE (Responsive Landscape & Portrait)
  // -------------------------------------------------------------
  if (gameId === 'golf') {
    if (isLandscape) {
      return (
        <div className="w-full h-full flex items-center justify-between p-3 gap-4 overflow-hidden select-none">
          {/* Left Side Rail: Stock & Waste */}
          <div className="w-36 flex flex-col items-center gap-3 p-3 bg-slate-950/60 rounded-2xl border border-white/10 shadow-lg shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Golf Dock</span>
            
            {/* Stock */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-300 mb-1">Stock ({stock.length})</span>
              <div
                onClick={stock.length > 0 ? onStockClick : undefined}
                className={`w-[54px] sm:w-[62px] aspect-[2.5/3.5] rounded-lg border ${
                  stock.length > 0 ? 'border-amber-400/60 cursor-pointer hover:scale-105 shadow-md' : 'border-white/10 bg-black/30'
                }`}
              >
                {stock.length > 0 ? (
                  <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full pointer-events-none" />
                ) : (
                  <span className="text-slate-500 text-[10px] flex items-center justify-center h-full">Done</span>
                )}
              </div>
            </div>

            {/* Waste Target */}
            <div className="flex flex-col items-center mt-1">
              <span className="text-[10px] text-slate-300 mb-1">Waste ({waste.length})</span>
              <div className="w-[54px] sm:w-[62px] aspect-[2.5/3.5] rounded-lg border border-white/20 bg-black/20 flex items-center justify-center shadow-inner">
                {waste.length > 0 ? (
                  <CardView card={waste[waste.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full" />
                ) : (
                  <span className="text-white/30 text-[10px]">Empty</span>
                )}
              </div>
            </div>
          </div>

          {/* Center Stage: 7 Columns cascading down */}
          <div className="flex-1 h-full flex flex-col justify-center items-center overflow-y-auto py-2">
            <div className="w-full max-w-3xl grid grid-cols-7 gap-2 sm:gap-3">
              {tableau.map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col items-center space-y-[-48px] sm:space-y-[-56px]">
                  {col.map((card, cIdx) => (
                    <div key={card.id} className="w-full max-w-[74px]">
                      <CardView
                        card={card}
                        cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                        isSelected={state.selectedCardId === card.id}
                        isHintSource={isCardHintSource(card.id)}
                        onClick={() => onCardClick(card, { type: 'tableau', colIndex: colIdx, cardIndex: cIdx })}
                        className="shadow-sm"
                      />
                    </div>
                  ))}
                  {col.length === 0 && (
                    <div className="w-full max-w-[74px] aspect-[2.5/3.5] rounded-md border border-dashed border-white/20 bg-black/20 flex items-center justify-center text-slate-500 text-xs font-mono">
                      -
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Portrait Golf
    return (
      <div className="w-full h-full flex flex-col justify-between items-center p-2 select-none">
        <div className="w-full max-w-lg grid grid-cols-7 gap-1 sm:gap-1.5 py-1">
          {tableau.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col items-center space-y-[-52px] sm:space-y-[-62px]">
              {col.map((card, cIdx) => (
                <div key={card.id} className="w-full">
                  <CardView
                    card={card}
                    cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                    isSelected={state.selectedCardId === card.id}
                    isHintSource={isCardHintSource(card.id)}
                    onClick={() => onCardClick(card, { type: 'tableau', colIndex: colIdx, cardIndex: cIdx })}
                    className="shadow-sm"
                  />
                </div>
              ))}
              {col.length === 0 && (
                <div className="w-full aspect-[2.5/3.5] rounded-md border border-dashed border-white/20 bg-black/20 flex items-center justify-center text-slate-500 text-[9px]">
                  -
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="w-full max-w-xs flex items-center justify-center gap-6 py-2 bg-slate-950/60 rounded-xl border border-white/10">
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 mb-0.5">Stock ({stock.length})</span>
            <div
              onClick={stock.length > 0 ? onStockClick : undefined}
              className={`w-[48px] sm:w-[56px] aspect-[2.5/3.5] rounded-md border ${
                stock.length > 0 ? 'border-amber-400/50 cursor-pointer hover:scale-105 shadow' : 'border-white/10 bg-black/30'
              }`}
            >
              {stock.length > 0 ? (
                <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full pointer-events-none" />
              ) : (
                <span className="text-slate-500 text-[10px] flex items-center justify-center h-full">Done</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 mb-0.5">Waste ({waste.length})</span>
            <div className="w-[48px] sm:w-[56px] aspect-[2.5/3.5] rounded-md border border-white/20 bg-black/20 flex items-center justify-center">
              {waste.length > 0 ? (
                <CardView card={waste[waste.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full" />
              ) : (
                <span className="text-white/30 text-[10px]">Empty</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LAYOUT 6: STANDARD SOLITAIRE TABLE (Klondike, FreeCell, Spider, etc.)
  // Supports:
  // 1) Responsive Landscape Split Flanks (Left Rail: Stock/Cells, Center: Tableau, Right Rail: Foundations)
  // 2) Responsive Landscape Side-Left Dock (Left Rail: Stock/Cells + Foundations, Right: Full Tableau)
  // 3) Mobile Portrait Top-Bar (Traditional Stacked)
  // -------------------------------------------------------------
  const showFreeCells = freecells && freecells.length > 0;
  const showStock = stock && (stock.length > 0 || waste.length > 0 || gameId === 'klondike' || gameId === 'klondike3' || gameId === 'fortythieves' || gameId === 'canfield');
  const showReserve = reserve && reserve.length > 0;
  const isGrandfather = gameId === 'grandfather';
  const columnCount = tableau.length;
  const foundationCount = foundations ? foundations.length : 4;

  // Reusable Foundation Pile Component
  const renderFoundationPile = (idx: number, sizeClass: string = 'w-[48px] sm:w-[56px]') => {
    const pile = foundations[idx] || [];
    const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
    return (
      <div
        key={idx}
        data-foundation-idx={idx}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDragEnter={(e) => { e.preventDefault(); setDragOverFoundation(idx); }}
        onDragLeave={() => setDragOverFoundation(null)}
        onDrop={(e) => handleDropOnFoundation(e, idx)}
        onClick={() => onEmptyFoundationClick && onEmptyFoundationClick(idx)}
        className={`${sizeClass} aspect-[2.5/3.5] rounded-lg border border-dashed border-amber-400/40 bg-black/25 flex items-center justify-center transition-all ${
          isFoundationHintTarget(idx) ? 'ring-2 ring-emerald-400 animate-pulse' : ''
        } ${dragOverFoundation === idx ? 'ring-2 ring-emerald-400 bg-emerald-500/20 shadow-lg' : ''}`}
      >
        {topCard ? (
          <CardView
            card={topCard}
            cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
            onClick={() => onCardClick(topCard, { type: 'tableau', colIndex: idx })}
            className="w-full h-full"
          />
        ) : (
          <span className="text-amber-400/40 text-sm sm:text-base font-serif font-bold">
            {gameId === 'canfield' && state.canfieldBaseRank
              ? getRankSymbol(state.canfieldBaseRank)
              : gameId === 'calculation'
              ? idx + 1
              : 'A'}
          </span>
        )}
      </div>
    );
  };

  // Reusable FreeCell Pile Component
  const renderFreeCell = (idx: number, cell: Card | null, sizeClass: string = 'w-[46px] sm:w-[52px]') => (
    <div
      key={idx}
      onClick={() => {
        if (cell) {
          onCardClick(cell, { type: 'freecell', colIndex: idx });
        } else if (onEmptyFreeCellClick) {
          onEmptyFreeCellClick(idx);
        }
      }}
      className={`${sizeClass} aspect-[2.5/3.5] rounded-lg border border-cyan-400/35 bg-cyan-950/20 flex items-center justify-center shadow-inner ${
        isFreeCellHintTarget(idx) ? 'ring-2 ring-emerald-400 animate-pulse' : ''
      }`}
    >
      {cell ? (
        <CardView
          card={cell}
          cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
          isSelected={state.selectedCardId === cell.id}
          isHintSource={isCardHintSource(cell.id)}
          isDragging={dragSource?.type === 'freecell' && dragSource.colIndex === idx}
          draggable={true}
          onDragStart={(e) => handleDragStart(e, { type: 'freecell', colIndex: idx }, cell)}
          onDragEnd={handleDragEnd}
          onDoubleClick={() => onCardDoubleClick(cell)}
          className="w-full h-full"
        />
      ) : (
        <span className="text-cyan-300/40 text-[10px] font-mono font-bold">C{idx + 1}</span>
      )}
    </div>
  );

  // -------------------------------------------------------------
  // LANDSCAPE LAYOUT (Split or Side-Left)
  // -------------------------------------------------------------
  if (isLandscape && (effectiveLayout === 'split' || effectiveLayout === 'side-left')) {
    const isSplit = effectiveLayout === 'split';

    return (
      <div className="w-full h-full flex flex-row items-stretch justify-between p-2 sm:p-3 gap-2 sm:gap-3 overflow-hidden select-none">
        {/* LEFT DOCK: Stock, Waste, FreeCells, Reserves (and Foundations if side-left) */}
        <div className={`flex flex-col items-center justify-start gap-2.5 p-2.5 bg-slate-950/65 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md overflow-y-auto shrink-0 ${
          isSplit ? 'w-32 sm:w-36 md:w-40' : 'w-44 sm:w-48 md:w-56'
        }`}>
          {/* Header Badge */}
          <div className="w-full flex items-center justify-center gap-1 pb-1 border-b border-white/10">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
              {showFreeCells ? 'Free Cells' : 'Deck Station'}
            </span>
          </div>

          {/* Stock & Waste Station */}
          {showStock && (
            <div className="w-full flex flex-col items-center gap-2" data-tutorial="stock-waste" id="tutorial-stock-waste">
              {/* Stock Pile */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-slate-300 mb-0.5">
                  Stock ({stock.length})
                </span>
                <div
                  onClick={onStockClick}
                  className={`relative w-[50px] sm:w-[58px] aspect-[2.5/3.5] rounded-lg border ${
                    stock.length > 0
                      ? 'border-amber-400/60 cursor-pointer hover:scale-105 active:scale-95 shadow-md'
                      : 'border-white/15 bg-black/30 flex items-center justify-center cursor-pointer hover:border-amber-400/40'
                  }`}
                >
                  {stock.length > 0 ? (
                    <>
                      <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full pointer-events-none" />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded-full bg-slate-900/90 text-[9px] font-bold text-white border border-white/20">
                        {stock.length}
                      </span>
                    </>
                  ) : (
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Waste Pile */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium text-slate-300 mb-0.5">
                  Waste ({waste.length})
                </span>
                <div className="relative w-[50px] sm:w-[58px] aspect-[2.5/3.5] rounded-lg border border-white/20 bg-black/25 flex items-center justify-center shadow-inner">
                  {waste.length > 0 ? (
                    <CardView
                      card={waste[waste.length - 1]}
                      cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                      isSelected={state.selectedCardId === waste[waste.length - 1].id}
                      isHintSource={isCardHintSource(waste[waste.length - 1].id)}
                      onClick={() => onCardClick(waste[waste.length - 1], { type: 'waste' })}
                      onDoubleClick={() => onCardDoubleClick(waste[waste.length - 1])}
                      className="w-full h-full"
                    />
                  ) : (
                    <span className="text-white/25 text-[10px] font-mono">Waste</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FreeCells in Landscape (2x2 Grid) */}
          {showFreeCells && (
            <div className="w-full flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-cyan-300 font-medium">Free Cells ({freecells.length})</span>
              <div className="grid grid-cols-2 gap-1.5">
                {freecells.map((cell, idx) => renderFreeCell(idx, cell, 'w-[44px] sm:w-[50px]'))}
              </div>
            </div>
          )}

          {/* Canfield Reserve */}
          {showReserve && (
            <div className="flex flex-col items-center pt-1 border-t border-white/10 w-full">
              <span className="text-[10px] text-amber-300 font-medium mb-1">Demon Reserve ({reserve.length})</span>
              <div className="w-[50px] sm:w-[58px] aspect-[2.5/3.5] rounded-lg border border-amber-400/40 bg-black/25 flex items-center justify-center">
                {reserve.length > 0 && (
                  <CardView
                    card={reserve[reserve.length - 1]}
                    cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                    isSelected={state.selectedCardId === reserve[reserve.length - 1].id}
                    onClick={() => onCardClick(reserve[reserve.length - 1], { type: 'reserve' })}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          )}

          {/* If side-left layout, Foundations are also placed here in the left dock */}
          {!isSplit && (
            <div className="w-full flex flex-col items-center gap-1.5 pt-2 border-t border-white/10" data-tutorial="foundations" id="tutorial-foundations">
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">Foundations</span>
              <div className="grid grid-cols-2 gap-1.5">
                {foundations.slice(0, 8).map((_, idx) => renderFoundationPile(idx, 'w-[44px] sm:w-[50px]'))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER STAGE: Tableau Playing Columns (Full Vertical Headroom) */}
        <div className="flex-1 h-full flex flex-col justify-start overflow-hidden px-1">
          {/* Auto-Complete Quick Banner */}
          {canAutoComplete && (
            <div className="w-full mb-1.5 py-1 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-between shadow-md shrink-0">
              <div className="flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span>All cards cleared for auto-win!</span>
              </div>
              <button
                onClick={onAutoComplete}
                className="py-1 px-3 bg-white text-emerald-950 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-colors shadow"
              >
                Auto-Finish
              </button>
            </div>
          )}

          {/* Tableau Columns */}
          <div
            data-tutorial="tableau"
            id="tutorial-tableau"
            className={`w-full flex-1 flex justify-center gap-1.5 sm:gap-2 md:gap-3 overflow-y-auto ${
              columnCount >= 10 ? 'overflow-x-auto min-w-[360px]' : ''
            }`}
          >
            {tableau.map((col, colIdx) => (
              <div
                key={colIdx}
                data-tableau-col={colIdx}
                onDragOver={(e) => handleDragOverCol(e, colIdx)}
                onDragEnter={(e) => handleDragEnterCol(e, colIdx)}
                onDragLeave={(e) => handleDragLeaveCol(e, colIdx)}
                onDrop={(e) => handleDropOnCol(e, colIdx)}
                onClick={() => {
                  if (col.length === 0 && onEmptyColClick) {
                    onEmptyColClick(colIdx);
                  }
                }}
                style={{
                  minHeight: `${getColumnMinHeight(col, true)}px`,
                }}
                className={`flex-1 min-w-[38px] max-w-[78px] flex flex-col items-center relative transition-colors ${
                  isColHintTarget(colIdx) ? 'ring-2 ring-emerald-400/80 rounded-lg' : ''
                } ${
                  dragOverCol === colIdx
                    ? isValidDropHover
                      ? 'ring-2 ring-emerald-400 bg-emerald-500/15 rounded-lg shadow-lg'
                      : 'ring-2 ring-rose-400/70 bg-rose-500/15 rounded-lg'
                    : ''
                }`}
              >
                {col.length === 0 ? (
                  <div
                    className="w-full aspect-[2.5/3.5] rounded-lg border border-dashed border-white/20 bg-black/20 flex items-center justify-center cursor-pointer hover:border-amber-400/40"
                  >
                    <span className="text-white/20 text-xs font-mono font-bold">
                      {gameId === 'klondike' || gameId === 'klondike3' || gameId === 'yukon' || gameId === 'russian' || gameId === 'eightoff' || gameId === 'seahaven'
                        ? 'K'
                        : '-'}
                    </span>
                  </div>
                ) : (
                  col.map((card, cardIdx) => {
                    const isCardDragging = dragSource?.cardId === card.id || (
                      dragSource?.type === 'tableau' &&
                      dragSource.colIndex === colIdx &&
                      cardIdx >= (dragSource.cardIndex ?? 0)
                    );

                    return (
                      <div
                        key={card.id}
                        style={{
                          position: 'absolute',
                          top: `${getCardTop(col, cardIdx, true)}px`,
                          left: 0,
                          right: 0,
                          zIndex: cardIdx + 1,
                          transition: cardTransition,
                          willChange: isSnap ? 'auto' : 'top',
                        }}
                        className="w-full"
                        onTouchStart={(e) => handleTouchStart(e, { type: 'tableau', colIndex: colIdx, cardIndex: cardIdx }, card)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        <CardView
                          card={card}
                          cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                          isSelected={state.selectedCardId === card.id}
                          isHintSource={isCardHintSource(card.id)}
                          isDragging={isCardDragging}
                          draggable={card.faceUp}
                          onDragStart={(e) => handleDragStart(e, { type: 'tableau', colIndex: colIdx, cardIndex: cardIdx }, card)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onCardClick(card, { type: 'tableau', colIndex: colIdx, cardIndex: cardIdx })}
                          onDoubleClick={() => onCardDoubleClick(card)}
                          className="w-full shadow-md"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT DOCK: Foundations (in Split mode) */}
        {isSplit && (
          <div
            data-tutorial="foundations"
            id="tutorial-foundations"
            className="w-32 sm:w-36 md:w-40 flex flex-col items-center justify-start gap-2.5 p-2.5 bg-slate-950/65 rounded-2xl border border-white/10 shadow-xl backdrop-blur-md overflow-y-auto shrink-0"
          >
            <div className="w-full flex items-center justify-center gap-1 pb-1 border-b border-white/10">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                Foundations
              </span>
            </div>

            {isGrandfather ? (
              <div className="grid grid-cols-2 gap-1.5 w-full">
                {clockPositions?.slice(0, 6).map((pos, idx) => {
                  const top = pos.cards[pos.cards.length - 1];
                  return (
                    <div key={idx} className="w-full aspect-[2.5/3.5] rounded-lg border border-amber-400/30 bg-black/25">
                      {top && <CardView card={top} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={`grid gap-2 ${foundationCount > 4 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                {foundations.slice(0, 8).map((_, idx) => renderFoundationPile(idx, 'w-[50px] sm:w-[58px]'))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // PORTRAIT LAYOUT: Traditional Mobile Top-Bar + Tableau
  // -------------------------------------------------------------
  return (
    <div className="w-full h-full flex flex-col justify-between p-1.5 sm:p-2.5 overflow-y-auto select-none">
      {/* Top Bar: Stock, Waste, FreeCells/Reserves, and Foundations */}
      <div className="w-full flex items-start justify-between gap-1.5 sm:gap-2 pb-1.5 border-b border-white/10">
        
        {/* Left Side: Stock & Waste OR FreeCells */}
        <div className="flex items-center gap-1.5">
          {/* Stock & Waste */}
          {showStock && (
            <div
              data-tutorial="stock-waste"
              id="tutorial-stock-waste"
              className="flex items-center gap-1 sm:gap-1.5"
            >
              {/* Stock */}
              <div
                onClick={onStockClick}
                className={`relative w-[44px] xs:w-[50px] sm:w-[58px] aspect-[2.5/3.5] rounded-md border ${
                  stock.length > 0
                    ? 'border-amber-400/50 cursor-pointer hover:scale-105 active:scale-95 shadow'
                    : 'border-white/15 bg-black/30 flex items-center justify-center cursor-pointer hover:border-amber-400/40'
                }`}
              >
                {stock.length > 0 ? (
                  <>
                    <CardView card={stock[stock.length - 1]} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full pointer-events-none" />
                    <span className="absolute bottom-0.5 right-1 px-1 py-0.2 rounded-full bg-slate-900/90 text-[9px] font-bold text-white border border-white/20">
                      {stock.length}
                    </span>
                  </>
                ) : (
                  <RotateCcw className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {/* Waste */}
              <div className="relative w-[44px] xs:w-[50px] sm:w-[58px] aspect-[2.5/3.5] rounded-md border border-white/20 bg-black/20 flex items-center justify-center">
                {waste.length > 0 ? (
                  <CardView
                    card={waste[waste.length - 1]}
                    cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                    isSelected={state.selectedCardId === waste[waste.length - 1].id}
                    isHintSource={isCardHintSource(waste[waste.length - 1].id)}
                    isDragging={dragSource?.type === 'waste'}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, { type: 'waste' }, waste[waste.length - 1])}
                    onDragEnd={handleDragEnd}
                    onClick={() => onCardClick(waste[waste.length - 1], { type: 'waste' })}
                    onDoubleClick={() => onCardDoubleClick(waste[waste.length - 1])}
                    className="w-full h-full"
                  />
                ) : (
                  <span className="text-white/25 text-[9px]">Waste</span>
                )}
              </div>
            </div>
          )}

          {/* FreeCells (FreeCell, Baker's Game, Eight Off, Seahaven) */}
          {showFreeCells && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              {freecells.map((cell, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (cell) {
                      onCardClick(cell, { type: 'freecell', colIndex: idx });
                    } else if (onEmptyFreeCellClick) {
                      onEmptyFreeCellClick(idx);
                    }
                  }}
                  className={`w-[40px] xs:w-[46px] sm:w-[54px] aspect-[2.5/3.5] rounded-md border border-cyan-400/30 bg-cyan-950/20 flex items-center justify-center shadow-inner ${
                    isFreeCellHintTarget(idx) ? 'ring-2 ring-emerald-400 animate-pulse' : ''
                  }`}
                >
                  {cell ? (
                    <CardView
                      card={cell}
                      cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                      isSelected={state.selectedCardId === cell.id}
                      isHintSource={isCardHintSource(cell.id)}
                      isDragging={dragSource?.type === 'freecell' && dragSource.colIndex === idx}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, { type: 'freecell', colIndex: idx }, cell)}
                      onDragEnd={handleDragEnd}
                      onDoubleClick={() => onCardDoubleClick(cell)}
                      className="w-full h-full"
                    />
                  ) : (
                    <span className="text-cyan-300/40 text-[9px] font-mono font-bold">C{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Canfield Demon Reserve */}
          {showReserve && (
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-amber-300/80 mb-0.5">({reserve.length})</span>
              <div className="w-[44px] xs:w-[50px] aspect-[2.5/3.5] rounded-md border border-amber-400/40 bg-black/20 flex items-center justify-center">
                {reserve.length > 0 && (
                  <CardView
                    card={reserve[reserve.length - 1]}
                    cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                    isSelected={state.selectedCardId === reserve[reserve.length - 1].id}
                    onClick={() => onCardClick(reserve[reserve.length - 1], { type: 'reserve' })}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Foundations */}
        {isGrandfather ? (
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {clockPositions?.slice(0, 6).map((pos, idx) => {
              const top = pos.cards[pos.cards.length - 1];
              return (
                <div key={idx} className="w-[38px] aspect-[2.5/3.5] rounded-md border border-amber-400/30 bg-black/20">
                  {top && <CardView card={top} cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations} className="w-full h-full" />}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            data-tutorial="foundations"
            id="tutorial-foundations"
            className="flex items-center gap-1 sm:gap-1.5"
          >
            {foundations.slice(0, 4).map((pile, idx) => {
              const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
              return (
                <div
                  key={idx}
                  data-foundation-idx={idx}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDragEnter={(e) => { e.preventDefault(); setDragOverFoundation(idx); }}
                  onDragLeave={() => setDragOverFoundation(null)}
                  onDrop={(e) => handleDropOnFoundation(e, idx)}
                  onClick={() => onEmptyFoundationClick && onEmptyFoundationClick(idx)}
                  className={`w-[44px] xs:w-[50px] sm:w-[58px] aspect-[2.5/3.5] rounded-md border border-dashed border-amber-400/40 bg-black/20 flex items-center justify-center transition-all ${
                    isFoundationHintTarget(idx) ? 'ring-2 ring-emerald-400 animate-pulse' : ''
                  } ${dragOverFoundation === idx ? 'ring-2 ring-emerald-400 bg-emerald-500/20 shadow-lg' : ''}`}
                >
                  {topCard ? (
                    <CardView
                      card={topCard}
                      cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                      onClick={() => onCardClick(topCard, { type: 'tableau', colIndex: idx })}
                      className="w-full h-full"
                    />
                  ) : (
                    <span className="text-amber-400/40 text-base font-serif font-bold">
                      {gameId === 'canfield' && state.canfieldBaseRank
                        ? getRankSymbol(state.canfieldBaseRank)
                        : gameId === 'calculation'
                        ? idx + 1
                        : 'A'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-Complete Banner */}
      {canAutoComplete && (
        <div className="w-full my-1 p-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1.5 text-xs">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>All cards revealed!</span>
          </div>
          <button
            onClick={onAutoComplete}
            className="py-1 px-3 bg-white text-emerald-950 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-colors shadow"
          >
            Auto-Finish
          </button>
        </div>
      )}

      {/* Main Tableau Playing Columns (Mobile Responsive Width) */}
      <div
        data-tutorial="tableau"
        id="tutorial-tableau"
        className={`w-full flex-1 flex justify-center gap-1 sm:gap-1.5 md:gap-2 pt-2 ${
          columnCount >= 10 ? 'overflow-x-auto min-w-[340px]' : ''
        }`}
      >
        {tableau.map((col, colIdx) => (
          <div
            key={colIdx}
            data-tableau-col={colIdx}
            onDragOver={(e) => handleDragOverCol(e, colIdx)}
            onDragEnter={(e) => handleDragEnterCol(e, colIdx)}
            onDragLeave={(e) => handleDragLeaveCol(e, colIdx)}
            onDrop={(e) => handleDropOnCol(e, colIdx)}
            onClick={() => {
              if (col.length === 0 && onEmptyColClick) {
                onEmptyColClick(colIdx);
              }
            }}
            style={{
              minHeight: `${getColumnMinHeight(col, false)}px`,
            }}
            className={`flex-1 min-w-[34px] max-w-[68px] flex flex-col items-center relative transition-colors ${
              isColHintTarget(colIdx) ? 'ring-2 ring-emerald-400/70 rounded-md' : ''
            } ${
              dragOverCol === colIdx
                ? isValidDropHover
                  ? 'ring-2 ring-emerald-400 bg-emerald-500/15 rounded-md shadow-lg'
                  : 'ring-2 ring-rose-400/70 bg-rose-500/15 rounded-md'
                : ''
            }`}
          >
            {col.length === 0 ? (
              <div
                className="w-full aspect-[2.5/3.5] rounded-md border border-dashed border-white/20 bg-black/20 flex items-center justify-center cursor-pointer hover:border-amber-400/40"
              >
                <span className="text-white/20 text-[10px] font-mono font-bold">
                  {gameId === 'klondike' || gameId === 'klondike3' || gameId === 'yukon' || gameId === 'russian' || gameId === 'eightoff' || gameId === 'seahaven'
                    ? 'K'
                    : '-'}
                </span>
              </div>
            ) : (
              col.map((card, cardIdx) => {
                const isCardDragging = dragSource?.cardId === card.id || (
                  dragSource?.type === 'tableau' &&
                  dragSource.colIndex === colIdx &&
                  cardIdx >= (dragSource.cardIndex ?? 0)
                );

                return (
                  <div
                    key={card.id}
                    style={{
                      position: 'absolute',
                      top: `${getCardTop(col, cardIdx, false)}px`,
                      left: 0,
                      right: 0,
                      zIndex: cardIdx + 1,
                      transition: cardTransition,
                      willChange: isSnap ? 'auto' : 'top',
                    }}
                    className="w-full"
                    onTouchStart={(e) => handleTouchStart(e, { type: 'tableau', colIndex: colIdx, cardIndex: cardIdx }, card)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <CardView
                      card={card}
                      cardBack={settings.cardBack} cardFace={settings.cardFace} cardAnimation={settings.cardAnimation} fastAnimations={settings.fastAnimations}
                      isSelected={state.selectedCardId === card.id}
                      isHintSource={isCardHintSource(card.id)}
                      isDragging={isCardDragging}
                      draggable={card.faceUp}
                      onDragStart={(e) => handleDragStart(e, { type: 'tableau', colIndex: colIdx, cardIndex: cardIdx }, card)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onCardClick(card, { type: 'tableau', colIndex: colIdx, cardIndex: cardIdx })}
                      onDoubleClick={() => onCardDoubleClick(card)}
                      className="w-full"
                    />
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
  };

  return (
    <div
      ref={boardRef}
      onClick={() => {
        if (isDealingRef.current) {
          finishDealEarly();
        }
      }}
      className={`w-full h-full relative overflow-hidden flex flex-col items-center justify-center ${
        settings.fastAnimations ? '[&_[data-card-id]]:!duration-75' : ''
      } ${
        !isSnap && !isUndoing ? '[&_[data-card-id]]:!delay-[25ms]' : '[&_[data-card-id]]:!delay-0'
      } ${
        isShaking ? 'animate-shake' : ''
      }`}
      data-solitaire-board="true"
    >
      {renderBoardContent()}
    </div>
  );
};
