import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Trophy, BookmarkCheck, RotateCcw, X, Sparkles } from 'lucide-react';
import { Card, GameId, MoveRecord, PlayerSettings, Achievement, DailyStreakInfo, DifficultyLevel } from './types/solitaire';
import {
  SolitaireState,
  initializeGame,
  checkWinCondition,
  isValidMove,
  findAutoMoveDestination,
  findHint,
} from './games/engine';
import { shuffleCards, SOLITAIRE_GAMES } from './utils/cardUtils';
import { sound } from './utils/audio';
import { haptics } from './utils/haptics';
import { HeaderHUD } from './components/HeaderHUD';
import { GameBoard } from './components/GameBoard';
import { MobileBottomNav } from './components/MobileBottomNav';
import { HomeModal } from './components/HomeModal';
import { GameSelectorModal } from './components/GameSelectorModal';
import { SettingsModal } from './components/SettingsModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { VictoryModal } from './components/VictoryModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { StatsModal } from './components/StatsModal';
import { KlondikeTutorialOverlay } from './components/KlondikeTutorialOverlay';
import { GameReplayModal } from './components/GameReplayModal';
import { GameInfoOverlay } from './components/GameInfoOverlay';
import { GameRulesModal } from './components/GameRulesModal';
import { recordStateStep, describeMove, formatCardLabel } from './utils/replayUtils';
import {
  getDailyChallengeConfig,
  createDailyChallengeDeck,
  getTodayDateString,
  recordDailyChallengeWin,
  getDailyStreakInfo,
} from './utils/dailyChallenge';
import {
  recordGameStart,
  recordTimeElapsed,
  recordGameWin,
  resetUserStats,
} from './utils/stats';
import { checkAchievementsOnWin } from './utils/achievements';
import {
  saveCurrentGame,
  loadAutoSavedGame,
  clearAutoSavedGame,
  AutoSavedGame,
} from './utils/autoSave';
import { hasEligibleSortMoves, findNextSortStep } from './utils/autoSort';

const DEFAULT_SETTINGS: PlayerSettings = {
  difficultyLevel: 'easy',
  soundEnabled: true,
  audioPack: 'modern',
  landscapeLayout: 'auto',
  hapticsEnabled: true,
  hapticIntensity: 'medium',
  tableTheme: 'emerald',
  cardBack: 'classic-red',
  cardFace: 'classic',
  cardAnimation: 'slide',
  autoMoveOnTap: true,
  showHintsHighlight: true,
  showValidDropTargets: true,
  fastAnimations: false,
  relaxedRules: false,
  showGameInfoOverlay: true,
  soundVolume: 0.8,
};

export default function App() {
  // Check for auto-saved in-progress game on initial load
  const [savedGameOnMount] = useState<AutoSavedGame | null>(() => loadAutoSavedGame());

  // Game state (restored from auto-save if present, else fresh Klondike deal)
  const [currentGameId, setCurrentGameId] = useState<GameId>(() => {
    return savedGameOnMount ? savedGameOnMount.gameId : 'klondike';
  });
  const [state, setState] = useState<SolitaireState>(() => {
    return savedGameOnMount ? savedGameOnMount.state : initializeGame('klondike');
  });

  // Daily Challenge State
  const [isDailyChallengeActive, setIsDailyChallengeActive] = useState<boolean>(() => {
    return savedGameOnMount ? savedGameOnMount.isDailyChallengeActive : false;
  });
  const [dailyChallengeDate, setDailyChallengeDate] = useState<string>(() => {
    return savedGameOnMount?.dailyChallengeDate || getTodayDateString();
  });
  const [dailyRank, setDailyRank] = useState<number | null>(null);
  const [dailyStreakInfo, setDailyStreakInfo] = useState<DailyStreakInfo>(() => getDailyStreakInfo());

  // Achievements & Skill Tracking
  const [undoUsedInGame, setUndoUsedInGame] = useState<boolean>(() => {
    return savedGameOnMount ? savedGameOnMount.undoUsedInGame : false;
  });
  const [hintUsedInGame, setHintUsedInGame] = useState<boolean>(() => {
    return savedGameOnMount ? savedGameOnMount.hintUsedInGame : false;
  });
  const [undoTrigger, setUndoTrigger] = useState<number>(0);
  const [dealTrigger, setDealTrigger] = useState<number>(() => {
    return savedGameOnMount && savedGameOnMount.state.moves > 0 ? 0 : 1;
  });
  const [unlockedInGame, setUnlockedInGame] = useState<Achievement[]>([]);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);

  // Discreet Resumption Toast indicator
  const [resumedGameToast, setResumedGameToast] = useState<{
    gameName: string;
    moves: number;
    timeSeconds: number;
    difficulty?: DifficultyLevel;
  } | null>(() => {
    if (savedGameOnMount && (savedGameOnMount.state.moves > 0 || savedGameOnMount.state.elapsedTime > 5)) {
      const name = SOLITAIRE_GAMES[savedGameOnMount.gameId]?.name || savedGameOnMount.gameId;
      return {
        gameName: name,
        moves: savedGameOnMount.state.moves,
        timeSeconds: savedGameOnMount.state.elapsedTime,
        difficulty: savedGameOnMount.difficultyLevel || savedGameOnMount.state.difficultyLevel,
      };
    }
    return null;
  });

  // Modals & Tabs
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const [isGameSelectorOpen, setIsGameSelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);
  const [isMobileDeviceFrame, setIsMobileDeviceFrame] = useState(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [statsInitialTab, setStatsInitialTab] = useState<'stats' | 'achievements'>('stats');
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Auto-dismiss resume toast after 7 seconds
  useEffect(() => {
    if (resumedGameToast) {
      const timer = setTimeout(() => {
        setResumedGameToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [resumedGameToast]);

  // Auto-launch tutorial for Klondike on initial visit if not completed/dismissed
  useEffect(() => {
    try {
      const completed = localStorage.getItem('solitaire_klondike_tutorial_completed');
      const neverShow = localStorage.getItem('solitaire_klondike_tutorial_never_show');
      if (!completed && !neverShow && (currentGameId === 'klondike' || currentGameId === 'klondike3')) {
        const timer = setTimeout(() => {
          setIsTutorialOpen(true);
        }, 750);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [currentGameId]);

  // Player Preferences
  const [settings, setSettings] = useState<PlayerSettings>(() => {
    try {
      const saved = localStorage.getItem('solitaire_settings_v2');
      const loaded: PlayerSettings = saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
      if (savedGameOnMount) {
        const resumedDifficulty = savedGameOnMount.difficultyLevel || savedGameOnMount.state.difficultyLevel;
        if (resumedDifficulty) {
          loaded.difficultyLevel = resumedDifficulty;
        }
      }
      return loaded;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Current Hint
  const [currentHint, setCurrentHint] = useState<{
    from: { type: string; index: number; cardId: string };
    to: { type: string; index: number };
    description: string;
  } | null>(null);

  // Gesture toast notification
  const [gestureToast, setGestureToast] = useState<string | null>(null);

  // Touch gesture tracking ref
  const touchStartRef = useRef<{ x: number; y: number; time: number; onInteractive: boolean } | null>(null);

  // Game timer
  const timerRef = useRef<number | null>(null);

  // Update audio & haptics engine settings
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
    if (settings.soundVolume !== undefined) {
      sound.setVolume(settings.soundVolume);
    }
    if (settings.audioPack) {
      sound.setAudioPack(settings.audioPack);
    }
    haptics.configure(settings.hapticsEnabled, settings.hapticIntensity || 'medium');
  }, [settings.soundEnabled, settings.soundVolume, settings.audioPack, settings.hapticsEnabled, settings.hapticIntensity]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('solitaire_settings_v2', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Record initial game on mount ONLY if starting fresh (not resumed from auto-save)
  useEffect(() => {
    if (!savedGameOnMount) {
      recordGameStart('klondike');
    }
  }, [savedGameOnMount]);

  // Latest game reference for reliable beforeunload / visibilitychange flush
  const latestGameRef = useRef({
    gameId: currentGameId,
    difficultyLevel: state.difficultyLevel || settings.difficultyLevel,
    state,
    isDailyChallengeActive,
    dailyChallengeDate,
    undoUsedInGame,
    hintUsedInGame,
  });

  useEffect(() => {
    latestGameRef.current = {
      gameId: currentGameId,
      difficultyLevel: state.difficultyLevel || settings.difficultyLevel,
      state,
      isDailyChallengeActive,
      dailyChallengeDate,
      undoUsedInGame,
      hintUsedInGame,
    };
  }, [currentGameId, settings.difficultyLevel, state, isDailyChallengeActive, dailyChallengeDate, undoUsedInGame, hintUsedInGame]);

  // Auto-save game state to localStorage on state changes
  useEffect(() => {
    if (state.isWon) {
      clearAutoSavedGame();
      return;
    }

    saveCurrentGame({
      gameId: currentGameId,
      difficultyLevel: state.difficultyLevel || settings.difficultyLevel,
      state,
      isDailyChallengeActive,
      dailyChallengeDate,
      undoUsedInGame,
      hintUsedInGame,
    });
  }, [state, currentGameId, settings.difficultyLevel, isDailyChallengeActive, dailyChallengeDate, undoUsedInGame, hintUsedInGame]);

  // Flush auto-save on page unload or when user switches tabs/minimizes browser
  useEffect(() => {
    const handleFlushSave = () => {
      const current = latestGameRef.current;
      if (current && !current.state.isWon) {
        saveCurrentGame(current);
      }
    };

    window.addEventListener('beforeunload', handleFlushSave);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFlushSave();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleFlushSave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Invalid move negative feedback: audio, haptics, and subtle CSS shake animation
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimerRef = useRef<number | null>(null);

  const triggerInvalidMove = useCallback(() => {
    sound.playInvalid();
    haptics.invalid();
    setIsShaking(true);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    const duration = settings.fastAnimations ? 200 : 380;
    shakeTimerRef.current = window.setTimeout(() => {
      setIsShaking(false);
      shakeTimerRef.current = null;
    }, duration);
  }, [settings.fastAnimations]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) {
        clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = null;
      }
    };
  }, []);

  // Timer runner
  useEffect(() => {
    if (state.isWon) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setState(prev => {
        if (prev.isWon) return prev;
        return {
          ...prev,
          elapsedTime: prev.elapsedTime + 1,
        };
      });
      recordTimeElapsed(1, currentGameId);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isWon, currentGameId]);

  // Save game state snapshot into history for undo
  const saveSnapshot = useCallback((currentState: SolitaireState, type: any, scoreDelta: number = 0): SolitaireState => {
    const snapshot = JSON.stringify({
      tableau: currentState.tableau,
      foundations: currentState.foundations,
      stock: currentState.stock,
      waste: currentState.waste,
      freecells: currentState.freecells,
      reserve: currentState.reserve,
      grid: currentState.grid,
      clockPositions: currentState.clockPositions,
      redealsLeft: currentState.redealsLeft,
      score: currentState.score,
      moves: currentState.moves,
    });

    const newHistory = currentState.history.slice(0, currentState.historyIndex + 1);
    const newRecord: MoveRecord = {
      type,
      timestamp: Date.now(),
      cardsCount: 1,
      scoreChange: scoreDelta,
      previousStateSnapshot: snapshot,
    };

    return {
      ...currentState,
      history: [...newHistory, newRecord],
      historyIndex: newHistory.length,
      moves: currentState.moves + 1,
      score: Math.max(0, currentState.score + scoreDelta),
    };
  }, []);

  // Handle Game Switch
  const startNewGame = useCallback((gameId: GameId, difficultyOverride?: DifficultyLevel) => {
    sound.playShuffle();
    setDealTrigger(prev => prev + 1);
    const diff = difficultyOverride || settings.difficultyLevel || 'easy';
    if (difficultyOverride && difficultyOverride !== settings.difficultyLevel) {
      setSettings(prev => ({ ...prev, difficultyLevel: difficultyOverride }));
    }
    const newState = initializeGame(gameId, undefined, diff);
    setState(newState);
    setCurrentGameId(gameId);
    setIsDailyChallengeActive(false);
    setDailyRank(null);
    setCurrentHint(null);
    setUndoUsedInGame(false);
    setHintUsedInGame(false);
    setUnlockedInGame([]);
    setIsVictoryModalOpen(false);
    setIsReplayModalOpen(false);
    setResumedGameToast(null);
    recordGameStart(gameId);
  }, [settings.difficultyLevel]);

  // Handle Daily Challenge Start with Seeded Deck
  const handleStartDailyChallenge = useCallback((dateStr: string) => {
    sound.playShuffle();
    setDealTrigger(prev => prev + 1);
    const config = getDailyChallengeConfig(dateStr);
    const seededDeck = createDailyChallengeDeck(config.gameId, config.seed);
    const newState = initializeGame(config.gameId, seededDeck);

    setState(newState);
    setCurrentGameId(config.gameId);
    setIsDailyChallengeActive(true);
    setDailyChallengeDate(dateStr);
    setDailyRank(null);
    setCurrentHint(null);
    setUndoUsedInGame(false);
    setHintUsedInGame(false);
    setUnlockedInGame([]);
    setIsVictoryModalOpen(false);
    setIsReplayModalOpen(false);
    setResumedGameToast(null);
    recordGameStart(config.gameId);
  }, []);

  // Undo Move
  const handleUndo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < 0 || prev.history.length === 0) return prev;
      const record = prev.history[prev.historyIndex];
      if (!record || !record.previousStateSnapshot) return prev;

      const previous = JSON.parse(record.previousStateSnapshot);
      sound.playCardFlip();
      setUndoUsedInGame(true);
      setUndoTrigger(t => t + 1);

      // Capture the current board state as nextStateSnapshot on the move being undone
      const currentBoardSnapshot = JSON.stringify({
        tableau: prev.tableau,
        foundations: prev.foundations,
        stock: prev.stock,
        waste: prev.waste,
        freecells: prev.freecells,
        reserve: prev.reserve,
        grid: prev.grid,
        clockPositions: prev.clockPositions,
        redealsLeft: prev.redealsLeft,
        score: prev.score,
        moves: prev.moves,
      });

      const updatedHistory = [...prev.history];
      if (updatedHistory[prev.historyIndex]) {
        updatedHistory[prev.historyIndex] = {
          ...updatedHistory[prev.historyIndex],
          nextStateSnapshot: currentBoardSnapshot,
        };
      }

      const targetLength = Math.max(1, prev.historyIndex);
      return {
        ...prev,
        ...previous,
        history: updatedHistory,
        historyIndex: prev.historyIndex - 1,
        selectedCardId: null,
        selectedStack: null,
        replaySteps: (prev.replaySteps || []).slice(0, targetLength),
      };
    });
    setCurrentHint(null);
  }, []);

  // Redo Move (replays the last undone move)
  const handleRedo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const nextIdx = prev.historyIndex + 1;
      const nextRecord = prev.history[nextIdx];
      if (!nextRecord || !nextRecord.nextStateSnapshot) return prev;

      const nextState = JSON.parse(nextRecord.nextStateSnapshot);
      sound.playCardFlip();
      haptics.cardPlace();
      setUndoTrigger(t => t + 1);

      return {
        ...prev,
        ...nextState,
        historyIndex: nextIdx,
        selectedCardId: null,
        selectedStack: null,
      };
    });
    setCurrentHint(null);
  }, []);

  // Open Home Hub with state auto-save and sound
  const handleOpenHome = useCallback(() => {
    // 1. If game has moves and is not won, auto-save state
    if (state.moves > 0 && !state.isWon) {
      saveCurrentGame({
        gameId: currentGameId,
        difficultyLevel: state.difficultyLevel || settings.difficultyLevel,
        state,
        isDailyChallengeActive,
        dailyChallengeDate,
        undoUsedInGame,
        hintUsedInGame,
      });
    }
    // 2. Play tactile audio feedback
    sound.playCardPlace();
    // 3. Close other modals to avoid stacked popups
    setIsGameSelectorOpen(false);
    setIsSettingsOpen(false);
    setIsDiagnosticsOpen(false);
    setIsVictoryModalOpen(false);
    setIsReplayModalOpen(false);
    setIsDailyChallengeOpen(false);
    setIsStatsOpen(false);
    setIsRulesOpen(false);
    setIsTutorialOpen(false);
    // 4. Open Home modal
    setIsHomeOpen(true);
  }, [state, currentGameId, isDailyChallengeActive, dailyChallengeDate, undoUsedInGame, hintUsedInGame]);



  // Hint Generator
  const handleHint = useCallback(() => {
    setHintUsedInGame(true);
    const hint = findHint(state);
    if (hint) {
      sound.playSuccess();
      setCurrentHint(hint);
      setTimeout(() => {
        setCurrentHint(null);
      }, 4000);
    } else {
      triggerInvalidMove();
    }
  }, [state, triggerInvalidMove]);

  // Sort Tableau columns face-up cards by Rank (Descending: K to A)
  const handleSortTableauByRank = useCallback(() => {
    const hasFaceUp = state.tableau.some(col => col.some(c => c.faceUp));
    if (!hasFaceUp) return;

    sound.playCardFlip();
    haptics.cardPlace();
    setState(prev => {
      const stateWithHistory = saveSnapshot(prev, 'move', 0);
      const newTableau = stateWithHistory.tableau.map(col => {
        const faceDown = col.filter(c => !c.faceUp);
        const faceUp = col.filter(c => c.faceUp);
        const sortedFaceUp = [...faceUp].sort((a, b) => b.rank - a.rank);
        return [...faceDown, ...sortedFaceUp];
      });

      return {
        ...stateWithHistory,
        tableau: newTableau,
        moves: stateWithHistory.moves + 1,
      };
    });

    setGestureToast('Tableau Sorted by Rank');
    setTimeout(() => setGestureToast(null), 2500);
  }, [state.tableau]);

  // Sort Tableau columns face-up cards by Suit (♠ ♥ ♣ ♦) then rank
  const handleSortTableauBySuit = useCallback(() => {
    const hasFaceUp = state.tableau.some(col => col.some(c => c.faceUp));
    if (!hasFaceUp) return;

    const suitOrder: Record<string, number> = { spades: 0, hearts: 1, clubs: 2, diamonds: 3 };

    sound.playCardFlip();
    haptics.cardPlace();
    setState(prev => {
      const stateWithHistory = saveSnapshot(prev, 'move', 0);
      const newTableau = stateWithHistory.tableau.map(col => {
        const faceDown = col.filter(c => !c.faceUp);
        const faceUp = col.filter(c => c.faceUp);
        const sortedFaceUp = [...faceUp].sort((a, b) => {
          const suitA = suitOrder[a.suit] ?? 0;
          const suitB = suitOrder[b.suit] ?? 0;
          if (suitA !== suitB) return suitA - suitB;
          return b.rank - a.rank;
        });
        return [...faceDown, ...sortedFaceUp];
      });

      return {
        ...stateWithHistory,
        tableau: newTableau,
        moves: stateWithHistory.moves + 1,
      };
    });

    setGestureToast('Tableau Sorted by Suit');
    setTimeout(() => setGestureToast(null), 2500);
  }, [state.tableau]);

  // Check Win and Auto-Complete
  useEffect(() => {
    if (!state.isWon && checkWinCondition(state)) {
      clearAutoSavedGame();
      setResumedGameToast(null);
      sound.playWinFanfare();
      setState(prev => {
        const lastStep = prev.replaySteps?.[prev.replaySteps.length - 1];
        if (!lastStep || lastStep.moveType !== 'victory') {
          return recordStateStep({ ...prev, isWon: true }, 'Victory Achieved! All cards cleared into foundations.', 'victory');
        }
        return { ...prev, isWon: true };
      });

      // Record victory in user game stats
      recordGameWin(currentGameId, state.elapsedTime, state.moves, state.score);

      // Record daily challenge win if playing a daily challenge
      if (isDailyChallengeActive) {
        const { rank, streakInfo } = recordDailyChallengeWin(
          dailyChallengeDate,
          state.score,
          state.elapsedTime,
          state.moves
        );
        setDailyRank(rank);
        if (streakInfo) {
          setDailyStreakInfo(streakInfo);
        }
      }

      // Check and award achievements
      const { newlyUnlocked } = checkAchievementsOnWin({
        gameId: currentGameId,
        timeSeconds: state.elapsedTime,
        moves: state.moves,
        score: state.score,
        usedUndo: undoUsedInGame,
        usedHint: hintUsedInGame,
        isDailyChallenge: isDailyChallengeActive,
      });

      if (newlyUnlocked.length > 0) {
        sound.playAchievementUnlock();
        setUnlockedInGame(newlyUnlocked);
        setAchievementToast(newlyUnlocked[0]);
        setTimeout(() => setAchievementToast(null), 5000);
      } else {
        setUnlockedInGame([]);
      }

      setIsVictoryModalOpen(true);
    }
  }, [state, isDailyChallengeActive, dailyChallengeDate, currentGameId, undoUsedInGame, hintUsedInGame]);

  // -------------------------------------------------------------
  // STOCK DEALING HANDLER
  // -------------------------------------------------------------
  const handleStockClick = useCallback(() => {
    setCurrentHint(null);

    // Monte Carlo / Gaps redeal
    if (state.gameId === 'gaps') {
      if (state.redealsLeft <= 0) {
        sound.playInvalid();
        return;
      }
      sound.playShuffle();
      // Reshuffle all cards that are NOT in sequence from column 0 (which must be 2)
      setState(prev => {
        const stateWithHistory = saveSnapshot(prev, 'undo', 0);
        const grid = prev.grid.map(row => [...row]);
        const unsequencedCards: Card[] = [];

        for (let r = 0; r < 4; r++) {
          let inSeq = true;
          if (!grid[r][0] || grid[r][0]!.rank !== 2) {
            inSeq = false;
          }
          const rowSuit = inSeq ? grid[r][0]!.suit : null;

          for (let c = 0; c < 13; c++) {
            const card = grid[r][c];
            if (inSeq && c < 12) {
              const expectedRank = c + 2;
              if (card && card.suit === rowSuit && card.rank === expectedRank) {
                // Stays in place!
                continue;
              } else {
                inSeq = false;
              }
            }
            if (card) {
              unsequencedCards.push(card);
              grid[r][c] = null;
            }
          }
        }

        const shuffled = shuffleCards(unsequencedCards);
        // Fill remaining spaces in order
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 13; c++) {
            if (grid[r][c] === null && shuffled.length > 0) {
              grid[r][c] = shuffled.pop()!;
            }
          }
        }

        return recordStateStep({
          ...stateWithHistory,
          grid,
          redealsLeft: prev.redealsLeft - 1,
        }, 'Reshuffled unsequenced cards', 'redeal');
      });
      return;
    }

    // Spider deal 1 card to every column
    if (state.gameId === 'spider1' || state.gameId === 'spider2' || state.gameId === 'spider4') {
      if (state.stock.length < 10) {
        triggerInvalidMove();
        return;
      }
      sound.playCardFlip();
      setState(prev => {
        const stateWithHistory = saveSnapshot(prev, 'stock_to_tableau', 0);
        const newStock = [...prev.stock];
        const newTableau = prev.tableau.map(col => [...col]);

        for (let i = 0; i < 10; i++) {
          const card = newStock.pop()!;
          card.faceUp = true;
          newTableau[i].push(card);
        }

        return recordStateStep({
          ...stateWithHistory,
          stock: newStock,
          tableau: newTableau,
        }, describeMove('stock_to_tableau', { cardsCount: 10 }), 'stock_to_tableau');
      });
      return;
    }

    // Aces Up deal 1 card to all 4 columns
    if (state.gameId === 'acesup') {
      if (state.stock.length === 0) {
        triggerInvalidMove();
        return;
      }
      sound.playCardFlip();
      setState(prev => {
        const stateWithHistory = saveSnapshot(prev, 'stock_to_tableau', 0);
        const newStock = [...prev.stock];
        const newTableau = prev.tableau.map(col => [...col]);

        for (let i = 0; i < 4; i++) {
          if (newStock.length > 0) {
            const card = newStock.pop()!;
            card.faceUp = true;
            newTableau[i].push(card);
          }
        }

        return recordStateStep({
          ...stateWithHistory,
          stock: newStock,
          tableau: newTableau,
        }, describeMove('stock_to_tableau', { cardsCount: 4 }), 'stock_to_tableau');
      });
      return;
    }

    // Bristol deal 1 card to each of 3 waste piles
    if (state.gameId === 'bristol') {
      if (state.stock.length === 0) return;
      sound.playCardFlip();
      setState(prev => {
        const stateWithHistory = saveSnapshot(prev, 'stock_to_waste', 0);
        const newStock = [...prev.stock];
        const newWaste = [...prev.waste];
        for (let i = 0; i < 3; i++) {
          if (newStock.length > 0) {
            const card = newStock.pop()!;
            card.faceUp = true;
            newWaste.push(card);
          }
        }
        return recordStateStep({
          ...stateWithHistory,
          stock: newStock,
          waste: newWaste,
        }, describeMove('stock_to_waste', { cardsCount: 3 }), 'stock_to_waste');
      });
      return;
    }

    // Standard Klondike / Klondike 3 / Pyramid / Golf / Canfield stock handling
    if (state.stock.length === 0) {
      // Recycle waste back to stock
      if (state.waste.length === 0) return;
      if (state.redealsLeft === 0) {
        triggerInvalidMove();
        return;
      }

      sound.playShuffle();
      setState(prev => {
        const stateWithHistory = saveSnapshot(prev, 'undo', 0);
        const newStock = [...prev.waste].reverse().map(c => ({ ...c, faceUp: false }));
        return recordStateStep({
          ...stateWithHistory,
          stock: newStock,
          waste: [],
          redealsLeft: prev.redealsLeft > 0 ? prev.redealsLeft - 1 : prev.redealsLeft,
        }, describeMove('recycle_stock'), 'recycle_stock');
      });
    } else {
      // Deal 1 or 3 cards to waste
      sound.playCardFlip();
      const drawCount = state.gameId === 'klondike3' || state.gameId === 'osmosis' ? 3 : 1;

      setState(prev => {
        const stateWithHistory = saveSnapshot(prev, 'stock_to_waste', 0);
        const newStock = [...prev.stock];
        const newWaste = [...prev.waste];

        for (let i = 0; i < drawCount && newStock.length > 0; i++) {
          const card = newStock.pop()!;
          card.faceUp = true;
          newWaste.push(card);
        }

        const topCard = newWaste.length > 0 ? newWaste[newWaste.length - 1] : undefined;
        return recordStateStep({
          ...stateWithHistory,
          stock: newStock,
          waste: newWaste,
        }, describeMove('stock_to_waste', { card: topCard, cardsCount: drawCount }), 'stock_to_waste');
      });
    }
  }, [state, saveSnapshot, triggerInvalidMove]);

  // -------------------------------------------------------------
  // CONSOLIDATE GRID (Monte Carlo)
  // -------------------------------------------------------------
  const handleConsolidateGrid = useCallback(() => {
    if (state.gameId !== 'montecarlo') return;
    sound.playCardSlide();

    setState(prev => {
      const stateWithHistory = saveSnapshot(prev, 'grid_consolidate', 0);
      const remainingCards: Card[] = [];

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const card = prev.grid[r][c];
          if (card) remainingCards.push(card);
        }
      }

      const newStock = [...prev.stock];
      const newGrid: (Card | null)[][] = Array.from({ length: 5 }, () => []);

      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (remainingCards.length > 0) {
            newGrid[r].push(remainingCards.shift()!);
          } else if (newStock.length > 0) {
            const card = newStock.pop()!;
            card.faceUp = true;
            newGrid[r].push(card);
          } else {
            newGrid[r].push(null);
          }
        }
      }

      return recordStateStep({
        ...stateWithHistory,
        grid: newGrid,
        stock: newStock,
      }, describeMove('grid_consolidate'), 'grid_consolidate');
    });
  }, [state.gameId, saveSnapshot]);

  // -------------------------------------------------------------
  // CLOCK TURN NEXT CARD
  // -------------------------------------------------------------
  const handleClockTurnNext = useCallback(() => {
    if (state.gameId !== 'clock' || !state.clockPositions) return;

    sound.playCardFlip();
    setState(prev => {
      if (!prev.clockPositions) return prev;
      const positions = prev.clockPositions.map(pos => ({
        ...pos,
        cards: pos.cards.map(c => ({ ...c })),
      }));

      // If no active card, start by flipping top card of center pile (index 12 / hour 13)
      let active = prev.clockActiveCard;
      if (!active) {
        const centerPile = positions[12];
        const topCard = centerPile.cards.find(c => !c.faceUp);
        if (topCard) {
          topCard.faceUp = true;
          active = topCard;
        }
      }

      if (active) {
        // Place under target hour matching its rank
        const targetHour = active.rank; // 1..13
        const targetPos = positions.find(p => p.hour === targetHour);
        if (targetPos) {
          // Flip next face-down card in that pile
          const nextCard = targetPos.cards.find(c => !c.faceUp);
          if (nextCard) {
            nextCard.faceUp = true;
            return recordStateStep({
              ...prev,
              clockPositions: positions,
              clockActiveCard: nextCard,
              moves: prev.moves + 1,
            }, describeMove('clock_place', { card: nextCard }), 'clock_place');
          }
        }
      }

      return recordStateStep({
        ...prev,
        clockPositions: positions,
        moves: prev.moves + 1,
      }, 'Turned clock card', 'clock_place');
    });
  }, [state.gameId]);

  // -------------------------------------------------------------
  // CARD CLICK & TAP-TO-MOVE HANDLER
  // -------------------------------------------------------------
  const handleCardClick = useCallback((card: Card, location: { type: string; colIndex?: number; cardIndex?: number }) => {
    setCurrentHint(null);
    haptics.tap();

    // 1. Pyramid pairing (sum to 13)
    if (state.gameId === 'pyramid') {
      if (card.rank === 13) {
        // King is removed instantly!
        sound.playSuccess();
        setState(prev => {
          const stateWithHistory = saveSnapshot(prev, 'pair_removal', 50);
          const newTableau = prev.tableau.map(row => row.filter(c => c.id !== card.id));
          const newWaste = prev.waste.filter(c => c.id !== card.id);
          return recordStateStep({
            ...stateWithHistory,
            tableau: newTableau,
            waste: newWaste,
          }, describeMove('pair_removal', { card, extraNote: 'Cleared King (13)' }), 'pair_removal');
        });
        return;
      }

      if (state.selectedCardId) {
        // Find previously selected card
        let firstCard: Card | null = null;
        for (const row of state.tableau) {
          const found = row.find(c => c.id === state.selectedCardId);
          if (found) { firstCard = found; break; }
        }
        if (!firstCard) {
          firstCard = state.waste.find(c => c.id === state.selectedCardId) || null;
        }

        if (firstCard && firstCard.id !== card.id && firstCard.rank + card.rank === 13) {
          // Valid 13 Pair!
          sound.playSuccess();
          setState(prev => {
            const stateWithHistory = saveSnapshot(prev, 'pair_removal', 100);
            const newTableau = prev.tableau.map(row => row.filter(c => c.id !== card.id && c.id !== firstCard!.id));
            const newWaste = prev.waste.filter(c => c.id !== card.id && c.id !== firstCard!.id);
            return recordStateStep({
              ...stateWithHistory,
              tableau: newTableau,
              waste: newWaste,
              selectedCardId: null,
            }, describeMove('pair_removal', { card, extraNote: `Cleared pair: ${formatCardLabel(firstCard)} + ${formatCardLabel(card)} (13)` }), 'pair_removal');
          });
          return;
        } else {
          // Deselect or switch selection
          setState(prev => ({ ...prev, selectedCardId: card.id }));
          return;
        }
      } else {
        setState(prev => ({ ...prev, selectedCardId: card.id }));
        return;
      }
    }

    // 2. TriPeaks (card must be ±1 of current waste card)
    if (state.gameId === 'tripeaks') {
      if (state.waste.length === 0) return;
      const topWaste = state.waste[state.waste.length - 1];
      const isRankAdjacent =
        Math.abs(card.rank - topWaste.rank) === 1 ||
        (card.rank === 1 && topWaste.rank === 13) ||
        (card.rank === 13 && topWaste.rank === 1);

      if (isRankAdjacent) {
        sound.playSuccess();
        setState(prev => {
          const stateWithHistory = saveSnapshot(prev, 'tableau_to_waste', 50);
          const newTableau = prev.tableau.map(row => row.filter(c => c.id !== card.id));
          const newWaste = [...prev.waste, { ...card, faceUp: true }];

          // Flip open newly uncovered cards in TriPeaks
          // Check tiers 0, 1, 2
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < newTableau[r].length; c++) {
              const peakCard = newTableau[r][c];
              if (!peakCard.faceUp) {
                // If neither child in the row below exists, flip it!
                peakCard.faceUp = true;
              }
            }
          }

          return recordStateStep({
            ...stateWithHistory,
            tableau: newTableau,
            waste: newWaste,
          }, describeMove('tableau_to_waste', { card }), 'tableau_to_waste');
        });
        return;
      } else {
        triggerInvalidMove();
        return;
      }
    }

    // 3. Golf (card must be ±1 of waste card)
    if (state.gameId === 'golf') {
      if (state.waste.length === 0) return;
      const topWaste = state.waste[state.waste.length - 1];
      const isAdjacent = Math.abs(card.rank - topWaste.rank) === 1 || (card.rank === 1 && topWaste.rank === 13) || (card.rank === 13 && topWaste.rank === 1);

      if (isAdjacent && location.colIndex !== undefined) {
        const col = state.tableau[location.colIndex];
        // Only top card of column can be played
        if (col.length > 0 && col[col.length - 1].id === card.id) {
          sound.playSuccess();
          setState(prev => {
            const stateWithHistory = saveSnapshot(prev, 'tableau_to_waste', 50);
            const newTableau = prev.tableau.map((cList, idx) =>
              idx === location.colIndex ? cList.slice(0, -1) : cList
            );
            return recordStateStep({
              ...stateWithHistory,
              tableau: newTableau,
              waste: [...prev.waste, card],
            }, describeMove('tableau_to_waste', { card }), 'tableau_to_waste');
          });
          return;
        }
      }
      triggerInvalidMove();
      return;
    }

    // 4. Aces Up (eliminate lower rank of same suit)
    if (state.gameId === 'acesup') {
      // Check if there is another column with top card of the same suit and higher rank
      // Note: Ace is rank 14 in Aces Up!
      const effectiveRank = (r: number) => (r === 1 ? 14 : r);
      let canDiscard = false;

      for (const col of state.tableau) {
        if (col.length > 0) {
          const top = col[col.length - 1];
          if (top.suit === card.suit && effectiveRank(top.rank) > effectiveRank(card.rank)) {
            canDiscard = true;
            break;
          }
        }
      }

      if (canDiscard && location.colIndex !== undefined) {
        sound.playCardPlace();
        setState(prev => {
          const stateWithHistory = saveSnapshot(prev, 'tableau_to_foundation', 10);
          const newTableau = prev.tableau.map((cList, idx) =>
            idx === location.colIndex ? cList.slice(0, -1) : cList
          );
          return recordStateStep({
            ...stateWithHistory,
            tableau: newTableau,
            foundations: [[...prev.foundations[0], card]],
          }, describeMove('tableau_to_foundation', { card }), 'tableau_to_foundation');
        });
        return;
      }
    }

    // 5. Monte Carlo (Pair adjacent same-rank cards)
    if (state.gameId === 'montecarlo' && location.colIndex !== undefined && location.cardIndex !== undefined) {
      const r = location.colIndex;
      const c = location.cardIndex;

      if (state.selectedCardId) {
        // Find previously selected card in grid
        let selPos: { r: number; c: number; card: Card } | null = null;
        for (let gr = 0; gr < 5; gr++) {
          for (let gc = 0; gc < 5; gc++) {
            if (state.grid[gr][gc]?.id === state.selectedCardId) {
              selPos = { r: gr, c: gc, card: state.grid[gr][gc]! };
              break;
            }
          }
        }

        if (selPos && (selPos.r !== r || selPos.c !== c)) {
          // Check adjacency (horizontal, vertical, diagonal)
          const isAdjacent = Math.abs(selPos.r - r) <= 1 && Math.abs(selPos.c - c) <= 1;
          const isSameRank = selPos.card.rank === card.rank;

          if (isAdjacent && isSameRank) {
            sound.playSuccess();
            setState(prev => {
              const stateWithHistory = saveSnapshot(prev, 'pair_removal', 50);
              const newGrid = prev.grid.map(row => [...row]);
              newGrid[selPos!.r][selPos!.c] = null;
              newGrid[r][c] = null;
              return recordStateStep({
                ...stateWithHistory,
                grid: newGrid,
                selectedCardId: null,
              }, describeMove('pair_removal', { card, extraNote: `Matched pair: ${formatCardLabel(selPos!.card)} & ${formatCardLabel(card)}` }), 'pair_removal');
            });
            return;
          }
        }
        setState(prev => ({ ...prev, selectedCardId: card.id }));
      } else {
        setState(prev => ({ ...prev, selectedCardId: card.id }));
      }
      return;
    }

    // 6. Gaps (Montana): Tap card to move it into a valid matching gap
    if (state.gameId === 'gaps' && location.colIndex !== undefined && location.cardIndex !== undefined) {
      // Find valid gap position for this card:
      // Must be placed in a gap directly to the right of a card of the SAME SUIT and RANK - 1
      // If card is rank 2, it can be placed in any column 0 gap
      let targetGap: { r: number; c: number } | null = null;

      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 13; c++) {
          if (state.grid[r][c] === null) {
            if (c === 0 && card.rank === 2) {
              targetGap = { r, c };
              break;
            } else if (c > 0) {
              const leftCard = state.grid[r][c - 1];
              if (leftCard && leftCard.suit === card.suit && leftCard.rank === card.rank - 1) {
                targetGap = { r, c };
                break;
              }
            }
          }
        }
        if (targetGap) break;
      }

      if (targetGap) {
        sound.playCardPlace();
        setState(prev => {
          const stateWithHistory = saveSnapshot(prev, 'gap_fill', 20);
          const newGrid = prev.grid.map(row => [...row]);
          newGrid[location.colIndex!][location.cardIndex!] = null; // old spot becomes gap
          newGrid[targetGap!.r][targetGap!.c] = card; // fill gap
          return recordStateStep({
            ...stateWithHistory,
            grid: newGrid,
          }, describeMove('gap_fill', { card }), 'gap_fill');
        });
        return;
      } else {
        triggerInvalidMove();
        return;
      }
    }

    // 7. General Solitaire Tap-to-Move (Klondike, FreeCell, Spider, Yukon, Canfield, Forty Thieves, etc.)
    if (settings.autoMoveOnTap) {
      // If card is already face-up, try smart auto-move!
      if (card.faceUp) {
        const dest = findAutoMoveDestination(state, card, location.colIndex ?? -1);
        if (dest) {
          executeMove(card, location, dest);
          return;
        }
      }
    }

    // If a card is already selected and player clicks another tableau card, check if it's a valid move onto that column
    if (state.selectedStack && location.type === 'tableau' && location.colIndex !== undefined) {
      const { source, colIndex: srcCol, cardIndex: srcCard } = state.selectedStack;
      if (source === 'tableau' && srcCol === location.colIndex) {
        setState(prev => ({ ...prev, selectedCardId: null, selectedStack: null }));
        return;
      }

      const targetCol = state.tableau[location.colIndex];
      const isTargetTop = targetCol.length > 0 && targetCol[targetCol.length - 1].id === card.id;

      if (isTargetTop) {
        let movingCards: Card[] = [];
        if (source === 'tableau') movingCards = state.tableau[srcCol].slice(srcCard);
        else if (source === 'waste') movingCards = [state.waste[state.waste.length - 1]];
        else if (source === 'freecell') movingCards = [state.freecells[srcCol]!];
        else if (source === 'reserve') movingCards = [state.reserve[state.reserve.length - 1]];

        if (movingCards.length > 0 && isValidMove(state, movingCards, { type: 'tableau', index: location.colIndex })) {
          executeMove(movingCards[0], { type: source, colIndex: srcCol, cardIndex: srcCard }, { type: 'tableau', index: location.colIndex });
          return;
        } else {
          triggerInvalidMove();
          return;
        }
      }
    }

    // Selection toggle for multi-step moving
    if (state.selectedCardId === card.id) {
      setState(prev => ({ ...prev, selectedCardId: null, selectedStack: null }));
    } else {
      setState(prev => ({
        ...prev,
        selectedCardId: card.id,
        selectedStack: {
          source: location.type as any,
          colIndex: location.colIndex ?? 0,
          cardIndex: location.cardIndex ?? 0,
        },
      }));
    }
  }, [state, settings.autoMoveOnTap, saveSnapshot, triggerInvalidMove]);

  // Execute a move from source to destination
  const executeMove = useCallback((
    card: Card,
    source: { type: string; colIndex?: number; cardIndex?: number },
    target: { type: 'foundation' | 'tableau' | 'freecell'; index: number }
  ) => {
    sound.playCardPlace();

    setState(prev => {
      const stateWithHistory = saveSnapshot(prev, `${source.type}_to_${target.type}` as any, 10);
      const newTableau = prev.tableau.map(col => col.map(c => ({ ...c })));
      const newFoundations = prev.foundations.map(pile => pile.map(c => ({ ...c })));
      const newWaste = prev.waste.map(c => ({ ...c }));
      const newFreeCells = prev.freecells.map(c => c ? { ...c } : null);
      const newReserve = prev.reserve.map(c => ({ ...c }));

      // Extract moving stack
      let movingStack: Card[] = [];

      if (source.type === 'tableau' && source.colIndex !== undefined && source.cardIndex !== undefined) {
        const srcCol = newTableau[source.colIndex];
        movingStack = srcCol.splice(source.cardIndex);
        // Flip newly exposed top card of column
        if (srcCol.length > 0 && !srcCol[srcCol.length - 1].faceUp) {
          srcCol[srcCol.length - 1].faceUp = true;
        }
      } else if (source.type === 'waste') {
        movingStack = [newWaste.pop()!];
      } else if (source.type === 'freecell' && source.colIndex !== undefined) {
        movingStack = [newFreeCells[source.colIndex]!];
        newFreeCells[source.colIndex] = null;
      } else if (source.type === 'reserve') {
        movingStack = [newReserve.pop()!];
        if (newReserve.length > 0) newReserve[newReserve.length - 1].faceUp = true;
      }

      // Place onto target
      if (target.type === 'foundation') {
        newFoundations[target.index].push(...movingStack);
        sound.playSuccess();
      } else if (target.type === 'tableau') {
        newTableau[target.index].push(...movingStack);
      } else if (target.type === 'freecell') {
        newFreeCells[target.index] = movingStack[0];
      }

      // Canfield auto-refill empty tableau from reserve
      if (prev.gameId === 'canfield' && newReserve.length > 0) {
        for (let c = 0; c < 4; c++) {
          if (newTableau[c].length === 0 && newReserve.length > 0) {
            const refillCard = newReserve.pop()!;
            refillCard.faceUp = true;
            newTableau[c].push(refillCard);
            if (newReserve.length > 0) newReserve[newReserve.length - 1].faceUp = true;
          }
        }
      }

      // Spider check for full completed K-to-A same-suit runs
      if (prev.gameId === 'spider1' || prev.gameId === 'spider2' || prev.gameId === 'spider4') {
        for (let colIdx = 0; colIdx < newTableau.length; colIdx++) {
          const col = newTableau[colIdx];
          if (col.length >= 13) {
            const top13 = col.slice(-13);
            if (top13[0].rank === 13 && top13[12].rank === 1) {
              let sameSuit = true;
              for (let i = 0; i < 12; i++) {
                if (top13[i].suit !== top13[i + 1].suit || top13[i].rank !== top13[i + 1].rank + 1) {
                  sameSuit = false;
                  break;
                }
              }
              if (sameSuit) {
                // Remove complete set to foundation!
                col.splice(-13);
                const emptyFoundIdx = newFoundations.findIndex(f => f.length === 0);
                if (emptyFoundIdx !== -1) {
                  newFoundations[emptyFoundIdx] = top13;
                }
                if (col.length > 0 && !col[col.length - 1].faceUp) {
                  col[col.length - 1].faceUp = true;
                }
                sound.playSuccess();
              }
            }
          }
        }
      }

      return recordStateStep({
        ...stateWithHistory,
        tableau: newTableau,
        foundations: newFoundations,
        waste: newWaste,
        freecells: newFreeCells,
        reserve: newReserve,
        selectedCardId: null,
        selectedStack: null,
      }, describeMove(`${source.type}_to_${target.type}`, {
        card,
        cardsCount: movingStack.length,
        sourceType: source.type,
        sourceIndex: source.colIndex,
        targetType: target.type,
        targetIndex: target.index,
      }), `${source.type}_to_${target.type}`);
    });
  }, [saveSnapshot]);

  // Click on empty column to move selected card/stack
  const handleEmptyColClick = useCallback((colIndex: number) => {
    if (!state.selectedStack) return;
    const { source, colIndex: srcCol, cardIndex: srcCard } = state.selectedStack;

    let movingCards: Card[] = [];
    if (source === 'tableau') {
      movingCards = state.tableau[srcCol].slice(srcCard);
    } else if (source === 'waste') {
      movingCards = [state.waste[state.waste.length - 1]];
    } else if (source === 'freecell') {
      movingCards = [state.freecells[srcCol]!];
    } else if (source === 'reserve') {
      movingCards = [state.reserve[state.reserve.length - 1]];
    }

    if (isValidMove(state, movingCards, { type: 'tableau', index: colIndex })) {
      executeMove(movingCards[0], { type: source, colIndex: srcCol, cardIndex: srcCard }, { type: 'tableau', index: colIndex });
    } else {
      triggerInvalidMove();
    }
  }, [state, executeMove, triggerInvalidMove]);

  // Click on empty freecell
  const handleEmptyFreeCellClick = useCallback((cellIndex: number) => {
    if (!state.selectedStack) return;
    const { source, colIndex: srcCol, cardIndex: srcCard } = state.selectedStack;

    let card: Card;
    if (source === 'tableau') {
      const col = state.tableau[srcCol];
      if (srcCard !== col.length - 1) {
        triggerInvalidMove();
        return;
      }
      card = col[col.length - 1];
    } else if (source === 'waste') {
      card = state.waste[state.waste.length - 1];
    } else {
      return;
    }

    if (state.freecells[cellIndex] === null) {
      executeMove(card, { type: source, colIndex: srcCol, cardIndex: srcCard }, { type: 'freecell', index: cellIndex });
    }
  }, [state, executeMove, triggerInvalidMove]);

  // Handle Drag-and-Drop moves between tableau columns, into foundations, or from freecells/waste
  const handleDropCards = useCallback((
    source: { type: string; colIndex?: number; cardIndex?: number },
    target: { type: 'tableau' | 'foundation' | 'freecell'; index: number }
  ) => {
    let movingCards: Card[] = [];

    if (source.type === 'tableau' && source.colIndex !== undefined && source.cardIndex !== undefined) {
      if (target.type === 'tableau' && source.colIndex === target.index) {
        // Dropped on the same column
        return;
      }
      movingCards = state.tableau[source.colIndex]?.slice(source.cardIndex) || [];
    } else if (source.type === 'waste') {
      if (state.waste.length === 0) return;
      movingCards = [state.waste[state.waste.length - 1]];
    } else if (source.type === 'freecell' && source.colIndex !== undefined) {
      const cell = state.freecells[source.colIndex];
      if (!cell) return;
      movingCards = [cell];
    }

    if (movingCards.length === 0) return;

    if (isValidMove(state, movingCards, target)) {
      executeMove(movingCards[0], source, target);
    } else {
      triggerInvalidMove();
    }
  }, [state, executeMove, triggerInvalidMove]);

  // Auto-Complete Animation Runner
  const handleAutoComplete = useCallback(() => {
    // Step by step move eligible cards to foundations (50% faster in Fast Mode)
    const speed = settings.fastAnimations ? 60 : 120;
    const interval = setInterval(() => {
      setState(prev => {
        // Find next eligible card
        for (let colIdx = 0; colIdx < prev.tableau.length; colIdx++) {
          const col = prev.tableau[colIdx];
          if (col.length > 0) {
            const card = col[col.length - 1];
            for (let fIdx = 0; fIdx < prev.foundations.length; fIdx++) {
              if (isValidMove(prev, [card], { type: 'foundation', index: fIdx })) {
                sound.playSuccess();
                const newTableau = prev.tableau.map((c, i) => i === colIdx ? c.slice(0, -1) : c);
                const newFoundations = prev.foundations.map((f, i) => i === fIdx ? [...f, card] : f);
                return recordStateStep({
                  ...prev,
                  tableau: newTableau,
                  foundations: newFoundations,
                  moves: prev.moves + 1,
                  score: prev.score + 15,
                }, describeMove('auto_complete', { card }), 'auto_complete');
              }
            }
          }
        }
        clearInterval(interval);
        return prev;
      });
    }, speed);
  }, [settings.fastAnimations]);

  // Determine if Auto-Complete is available
  const canAutoComplete = (
    (state.gameId === 'klondike' || state.gameId === 'klondike3' || state.gameId === 'freecell') &&
    state.stock.length === 0 &&
    state.waste.length === 0 &&
    state.tableau.every(col => col.every(c => c.faceUp))
  );

  // Determine if Redo is available (there is a valid undone snapshot ahead in history)
  const canRedo = (
    state.historyIndex < state.history.length - 1 &&
    Boolean(state.history[state.historyIndex + 1]?.nextStateSnapshot)
  );

  // Auto-Sort Feature (Sequential moves to foundation and Spider sequence consolidation)
  const [isSorting, setIsSorting] = useState(false);
  const sortTimerRef = useRef<number | null>(null);

  const canAutoSort = useMemo(() => {
    return hasEligibleSortMoves(state);
  }, [state]);

  const handleAutoSort = useCallback(() => {
    if (isSorting) {
      if (sortTimerRef.current) {
        clearInterval(sortTimerRef.current);
        sortTimerRef.current = null;
      }
      setIsSorting(false);
      return;
    }

    if (!hasEligibleSortMoves(state)) {
      triggerInvalidMove();
      return;
    }

    setIsSorting(true);

    // 50% faster interval in Fast Mode (75ms vs 150ms)
    const stepIntervalMs = settings.fastAnimations ? 75 : 150;
    const stepInterval = window.setInterval(() => {
      setState(prev => {
        const nextStep = findNextSortStep(prev);
        if (!nextStep) {
          clearInterval(stepInterval);
          sortTimerRef.current = null;
          setIsSorting(false);
          return prev;
        }

        sound.playSuccess();
        haptics.success();

        const stateWithHistory = saveSnapshot(prev, 'auto_sort', 15);
        const newTableau = prev.tableau.map(col => [...col]);
        const newFoundations = prev.foundations.map(f => [...f]);
        const newWaste = [...prev.waste];
        const newFreeCells = [...prev.freecells];
        const newReserve = [...prev.reserve];

        const { source, target, cards, description } = nextStep;

        if (source.type === 'tableau') {
          newTableau[source.colIndex].splice(source.cardIndex, cards.length);
          const col = newTableau[source.colIndex];
          if (col.length > 0 && !col[col.length - 1].faceUp) {
            col[col.length - 1].faceUp = true;
          }
        } else if (source.type === 'waste') {
          newWaste.pop();
        } else if (source.type === 'freecell') {
          newFreeCells[source.colIndex] = null;
        } else if (source.type === 'reserve') {
          newReserve.pop();
          if (newReserve.length > 0) newReserve[newReserve.length - 1].faceUp = true;
        }

        if (target.type === 'foundation') {
          newFoundations[target.index].push(...cards);
        } else if (target.type === 'tableau') {
          newTableau[target.index].push(...cards);
        }

        return recordStateStep({
          ...stateWithHistory,
          tableau: newTableau,
          foundations: newFoundations,
          waste: newWaste,
          freecells: newFreeCells,
          reserve: newReserve,
          selectedCardId: null,
          selectedStack: null,
        }, description, 'auto_sort');
      });
    }, stepIntervalMs);

    sortTimerRef.current = stepInterval;
  }, [isSorting, state, saveSnapshot, triggerInvalidMove, settings.fastAnimations]);

  // Clean up sort timer on unmount or game change
  useEffect(() => {
    return () => {
      if (sortTimerRef.current) {
        clearInterval(sortTimerRef.current);
        sortTimerRef.current = null;
      }
      setIsSorting(false);
    };
  }, [currentGameId]);

  // Global Keyboard Shortcuts
  // 's': toggle auto-sorting
  // 'n': start new game
  // 'a': toggle/trigger auto-complete when available
  // 'u' / Ctrl+Z / Cmd+Z: Undo
  // 'r' / Ctrl+Y / Cmd+Shift+Z: Redo
  // 'h': open Home hub
  // Escape: close active dialogs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      const hasModifier = e.ctrlKey || e.metaKey || e.altKey;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))) {
        e.preventDefault();
        handleRedo();
      } else if (!hasModifier && (e.key === 'r' || e.key === 'R')) {
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
      } else if (!hasModifier && (e.key === 'u' || e.key === 'U')) {
        handleUndo();
      } else if (!hasModifier && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleAutoSort();
      } else if (!hasModifier && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        if (isDailyChallengeActive) {
          handleStartDailyChallenge(dailyChallengeDate);
        } else {
          startNewGame(currentGameId);
        }
      } else if (!hasModifier && (e.key === 'a' || e.key === 'A')) {
        if (canAutoComplete) {
          e.preventDefault();
          handleAutoComplete();
        }
      } else if (!hasModifier && (e.key === 'h' || e.key === 'H')) {
        handleOpenHome();
      } else if (e.key === 'Escape') {
        if (isHomeOpen) setIsHomeOpen(false);
        if (isGameSelectorOpen) setIsGameSelectorOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isDailyChallengeOpen) setIsDailyChallengeOpen(false);
        if (isStatsOpen) setIsStatsOpen(false);
        if (isRulesOpen) setIsRulesOpen(false);
        if (isTutorialOpen) setIsTutorialOpen(false);
        if (isVictoryModalOpen) setIsVictoryModalOpen(false);
        if (isReplayModalOpen) setIsReplayModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleAutoSort,
    handleAutoComplete,
    canAutoComplete,
    startNewGame,
    handleStartDailyChallenge,
    isDailyChallengeActive,
    dailyChallengeDate,
    currentGameId,
    handleOpenHome,
    isHomeOpen,
    isGameSelectorOpen,
    isSettingsOpen,
    isDailyChallengeOpen,
    isStatsOpen,
    isRulesOpen,
    isTutorialOpen,
    isVictoryModalOpen,
    isReplayModalOpen,
  ]);

  // Background Felt Table Theme Class
  const getTableThemeClass = () => {
    switch (settings.tableTheme) {
      case 'burgundy':
        return 'bg-gradient-to-b from-rose-950 via-red-950 to-stone-950';
      case 'sapphire':
        return 'bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950';
      case 'obsidian':
        return 'bg-gradient-to-b from-zinc-900 via-neutral-950 to-black';
      case 'emerald':
      default:
        return 'bg-gradient-to-b from-emerald-950 via-green-950 to-stone-950';
    }
  };

  return (
    <div className={`w-screen h-screen flex items-center justify-center overflow-hidden bg-slate-950 select-none ${isMobileDeviceFrame ? 'p-2 sm:p-4' : ''}`}>
      {/* Container: If phone frame mode is on, constrain to mobile viewport with phone bezel */}
      <div
        className={`w-full h-full flex flex-col overflow-hidden relative ${getTableThemeClass()} ${
          isMobileDeviceFrame
            ? 'max-w-[430px] max-h-[880px] rounded-[36px] border-4 border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.8)]'
            : ''
        }`}
      >
        {/* Fake phone speaker & camera punch-hole when in device mockup mode */}
        {isMobileDeviceFrame && (
          <div className="w-full flex justify-center items-center pt-2 pb-1 bg-slate-950 z-40">
            <div className="w-16 h-1 rounded-full bg-slate-800"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-2 border border-slate-700"></div>
          </div>
        )}

        {/* Top Header & Android App Bar */}
        <HeaderHUD
          gameId={currentGameId}
          moves={state.moves}
          timeSeconds={state.elapsedTime}
          score={state.score}
          settings={settings}
          isMobileDeviceFrame={isMobileDeviceFrame}
          isDailyChallenge={isDailyChallengeActive}
          dailyDate={dailyChallengeDate}
          dailyStreak={dailyStreakInfo.currentStreak}
          isDailyCompletedToday={dailyStreakInfo.isCompletedToday}
          onOpenHome={handleOpenHome}
          onToggleDeviceFrame={() => setIsMobileDeviceFrame(prev => !prev)}
          onOpenGameSelector={() => setIsGameSelectorOpen(true)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenDailyChallenge={() => setIsDailyChallengeOpen(true)}
          onOpenAchievements={() => {
            setStatsInitialTab('achievements');
            setIsStatsOpen(true);
          }}
          onCycleLandscapeLayout={() => {
            setSettings(prev => {
              const modes: Array<'auto' | 'split' | 'side-left' | 'top'> = ['auto', 'split', 'side-left', 'top'];
              const currentIdx = modes.indexOf(prev.landscapeLayout || 'auto');
              const nextMode = modes[(currentIdx + 1) % modes.length];
              return { ...prev, landscapeLayout: nextMode };
            });
          }}
          onToggleSound={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onCycleDifficulty={() => {
            setSettings(prev => {
              const diffs: DifficultyLevel[] = ['easy', 'medium', 'hard'];
              const nextDiff = diffs[(diffs.indexOf(prev.difficultyLevel || 'easy') + 1) % diffs.length];
              setState(s => ({ ...s, difficultyLevel: nextDiff }));
              return { ...prev, difficultyLevel: nextDiff };
            });
          }}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenRules={() => setIsRulesOpen(true)}
        />

        {/* Floating Achievement Unlock Banner Toast */}
        {achievementToast && (
          <div
            onClick={() => {
              setStatsInitialTab('achievements');
              setIsStatsOpen(true);
              setAchievementToast(null);
            }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl border-2 border-white/80 flex items-center gap-3 cursor-pointer animate-bounce select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-950 flex items-center justify-center text-amber-300 shadow">
              <Trophy className="w-4 h-4 fill-current" />
            </div>
            <div className="text-left">
              <div className="text-[10px] uppercase font-black tracking-wider text-slate-950/80 leading-none">
                Achievement Unlocked!
              </div>
              <div className="text-xs font-bold text-slate-950 flex items-center gap-1.5 mt-0.5">
                <span>{achievementToast.title}</span>
                <span className="font-mono bg-slate-950/20 px-1.5 py-0.2 rounded text-[10px] font-black">
                  +{achievementToast.rewardPoints} pts
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Solitaire Playing Table Surface */}
        <main
          className="flex-1 relative overflow-hidden flex flex-col select-none"
          onTouchStart={(e) => {
            if (e.touches.length === 1) {
              const target = e.target as HTMLElement;
              const onInteractive = !!(
                target.closest('button') ||
                target.closest('[data-card-id]') ||
                target.closest('[data-card-draggable="true"]') ||
                target.closest('[role="button"]') ||
                target.closest('input')
              );
              touchStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now(),
                onInteractive,
              };
            }
          }}
          onTouchEnd={(e) => {
            if (!touchStartRef.current) return;
            const wasInteractive = touchStartRef.current.onInteractive;
            const startX = touchStartRef.current.x;
            const startY = touchStartRef.current.y;
            const startTime = touchStartRef.current.time;
            touchStartRef.current = null;

            if (wasInteractive) return;

            const touch = e.changedTouches[0];
            if (!touch) return;
            const deltaX = touch.clientX - startX;
            const deltaY = touch.clientY - startY;
            const deltaTime = Date.now() - startTime;

            // Vertical swipe recognition: quick flick (<550ms), distance > 55px, predominantly vertical
            if (deltaTime < 550 && Math.abs(deltaY) > 55 && Math.abs(deltaY) > Math.abs(deltaX) * 1.4) {
              if (deltaY > 55) {
                // Swipe Down: Undo
                if (state.historyIndex >= 0) {
                  handleUndo();
                  setGestureToast('Swipe Down: Undo');
                  setTimeout(() => setGestureToast(null), 1800);
                } else {
                  sound.playInvalid();
                  setGestureToast('No moves to undo');
                  setTimeout(() => setGestureToast(null), 1500);
                }
              } else if (deltaY < -55) {
                // Swipe Up: Hint
                handleHint();
                setGestureToast('Swipe Up: Hint');
                setTimeout(() => setGestureToast(null), 1800);
              }
            }
          }}
        >
          {/* Felt Texture subtle background pattern */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_0.75px,transparent_0.75px)] [background-size:16px_16px]"></div>

          {/* Gesture Notification Pill */}
          {gestureToast && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fadeIn">
              <div className="bg-slate-900/95 text-amber-300 border border-amber-500/50 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{gestureToast}</span>
              </div>
            </div>
          )}

          {/* Live Game Info HUD (Win Probability & Move Efficiency) */}
          <GameInfoOverlay
            state={state}
            isVisible={settings.showGameInfoOverlay ?? true}
            onClose={() => setSettings(prev => ({ ...prev, showGameInfoOverlay: false }))}
            className="top-2 sm:top-3 right-2 sm:right-4"
          />

          <GameBoard
            state={state}
            settings={settings}
            hint={currentHint}
            onCardClick={handleCardClick}
            onCardDoubleClick={(card) => {
              for (let f = 0; f < state.foundations.length; f++) {
                if (isValidMove(state, [card], { type: 'foundation', index: f })) {
                  executeMove(card, { type: 'tableau' }, { type: 'foundation', index: f });
                  break;
                }
              }
            }}
            onStockClick={handleStockClick}
            onEmptyColClick={handleEmptyColClick}
            onEmptyFreeCellClick={handleEmptyFreeCellClick}
            onEmptyFoundationClick={(fIdx) => {
              if (state.selectedStack) {
                const { source, colIndex, cardIndex } = state.selectedStack;
                let card: Card | null = null;
                if (source === 'tableau') card = state.tableau[colIndex][cardIndex];
                else if (source === 'waste') card = state.waste[state.waste.length - 1];
                else if (source === 'freecell') card = state.freecells[colIndex];

                if (card && isValidMove(state, [card], { type: 'foundation', index: fIdx })) {
                  executeMove(card, { type: source, colIndex, cardIndex }, { type: 'foundation', index: fIdx });
                }
              }
            }}
            onConsolidateGrid={handleConsolidateGrid}
            onClockTurnNext={handleClockTurnNext}
            onAutoComplete={handleAutoComplete}
            canAutoComplete={canAutoComplete}
            undoTrigger={undoTrigger}
            dealTrigger={dealTrigger}
            isShaking={isShaking}
            onDropCards={handleDropCards}
          />
        </main>

        {/* Floating Resumed In-Progress Game Notification Banner */}
        {resumedGameToast && (
          <div
            className="absolute bottom-16 sm:bottom-18 left-1/2 -translate-x-1/2 z-40 max-w-sm sm:max-w-md w-[calc(100%-2rem)] bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 text-slate-100 animate-fadeIn"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5 truncate">
                  <span>Game Resumed</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    • {resumedGameToast.gameName}
                  </span>
                  {resumedGameToast.difficulty && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 text-amber-300">
                      {resumedGameToast.difficulty}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {resumedGameToast.moves} {resumedGameToast.moves === 1 ? 'move' : 'moves'} • {Math.floor(resumedGameToast.timeSeconds / 60)}:{(resumedGameToast.timeSeconds % 60).toString().padStart(2, '0')} elapsed
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (isDailyChallengeActive) {
                    handleStartDailyChallenge(dailyChallengeDate);
                  } else {
                    startNewGame(currentGameId);
                  }
                  setResumedGameToast(null);
                }}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/70 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="Restart with a fresh deal"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>New Deal</span>
              </button>
              <button
                onClick={() => setResumedGameToast(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss"
                aria-label="Dismiss banner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Bottom Thumb Navigation Bar */}
        <MobileBottomNav
          canUndo={state.historyIndex >= 0}
          canRedo={canRedo}
          canAutoComplete={canAutoComplete}
          canAutoSort={canAutoSort}
          isSorting={isSorting}
          isDailyChallenge={isDailyChallengeActive}
          onOpenHome={handleOpenHome}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onHint={handleHint}
          onOpenGames={() => setIsGameSelectorOpen(true)}
          onOpenDaily={() => setIsDailyChallengeOpen(true)}
          onAutoComplete={handleAutoComplete}
          onAutoSort={handleAutoSort}
          onRestart={() => isDailyChallengeActive ? handleStartDailyChallenge(dailyChallengeDate) : startNewGame(currentGameId)}
          onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Modals */}
      <HomeModal
        isOpen={isHomeOpen}
        onClose={() => setIsHomeOpen(false)}
        currentGameId={currentGameId}
        currentDifficulty={state.difficultyLevel || settings.difficultyLevel}
        currentMoves={state.moves}
        currentTimeSeconds={state.elapsedTime}
        currentScore={state.score}
        isDailyChallengeActive={isDailyChallengeActive}
        dailyStreakInfo={dailyStreakInfo}
        todayDateStr={getTodayDateString()}
        onSelectGame={(id) => {
          setIsHomeOpen(false);
          startNewGame(id);
        }}
        onRestartCurrentGame={() => {
          setIsHomeOpen(false);
          if (isDailyChallengeActive) {
            handleStartDailyChallenge(dailyChallengeDate);
          } else {
            startNewGame(currentGameId);
          }
        }}
        onOpenDailyChallenge={() => {
          setIsHomeOpen(false);
          setIsDailyChallengeOpen(true);
        }}
        onOpenGameSelector={() => {
          setIsHomeOpen(false);
          setIsGameSelectorOpen(true);
        }}
        onOpenStats={() => {
          setIsHomeOpen(false);
          setIsStatsOpen(true);
        }}
        onOpenRules={() => {
          setIsHomeOpen(false);
          setIsRulesOpen(true);
        }}
        onOpenSettings={() => {
          setIsHomeOpen(false);
          setIsSettingsOpen(true);
        }}
        onOpenTutorial={() => {
          setIsHomeOpen(false);
          if (currentGameId !== 'klondike' && currentGameId !== 'klondike3') {
            startNewGame('klondike');
          }
          setIsTutorialOpen(true);
        }}
      />

      <GameSelectorModal
        isOpen={isGameSelectorOpen}
        onClose={() => setIsGameSelectorOpen(false)}
        currentGameId={currentGameId}
        onSelectGame={startNewGame}
        onOpenDailyChallenge={() => setIsDailyChallengeOpen(true)}
      />

      <DailyChallengeModal
        isOpen={isDailyChallengeOpen}
        onClose={() => {
          setIsDailyChallengeOpen(false);
          setDailyStreakInfo(getDailyStreakInfo());
        }}
        onStartDailyChallenge={handleStartDailyChallenge}
        currentDailyDate={dailyChallengeDate}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) => {
          setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            if (newSettings.difficultyLevel) {
              setState(s => ({ ...s, difficultyLevel: newSettings.difficultyLevel }));
            }
            return updated;
          });
        }}
        onStartNewDeal={(difficulty) => {
          setIsSettingsOpen(false);
          setSettings(prev => ({ ...prev, difficultyLevel: difficulty }));
          startNewGame(currentGameId, difficulty);
        }}
        onOpenStats={(tab) => {
          setStatsInitialTab(tab || 'stats');
          setIsSettingsOpen(false);
          setIsStatsOpen(true);
        }}
        onResetStats={() => {
          resetUserStats();
          sound.playSuccess();
        }}
        onOpenTutorial={() => {
          if (currentGameId !== 'klondike' && currentGameId !== 'klondike3') {
            startNewGame('klondike');
          }
          setIsTutorialOpen(true);
        }}
        onSortTableauByRank={handleSortTableauByRank}
        onSortTableauBySuit={handleSortTableauBySuit}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => {
          setIsStatsOpen(false);
          setDailyStreakInfo(getDailyStreakInfo());
        }}
        currentGameId={currentGameId}
        initialTab={statsInitialTab}
        onOpenDailyChallenge={() => setIsDailyChallengeOpen(true)}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        currentGameId={currentGameId}
        onSelectGame={startNewGame}
        onOpenTutorial={() => {
          if (currentGameId !== 'klondike' && currentGameId !== 'klondike3') {
            startNewGame('klondike');
          }
          setIsTutorialOpen(true);
        }}
      />

      {isVictoryModalOpen && (
        <VictoryModal
          gameId={currentGameId}
          moves={state.moves}
          timeSeconds={state.elapsedTime}
          score={state.score}
          isDailyChallenge={isDailyChallengeActive}
          dailyDate={dailyChallengeDate}
          dailyRank={dailyRank}
          unlockedAchievements={unlockedInGame}
          onWatchReplay={() => {
            setIsVictoryModalOpen(false);
            setIsReplayModalOpen(true);
          }}
          onPlayAgain={() => isDailyChallengeActive ? handleStartDailyChallenge(dailyChallengeDate) : startNewGame(currentGameId)}
          onSelectAnotherGame={() => {
            setIsVictoryModalOpen(false);
            setIsGameSelectorOpen(true);
          }}
          onViewLeaderboard={() => {
            setIsVictoryModalOpen(false);
            setIsDailyChallengeOpen(true);
          }}
          onViewAchievements={() => {
            setIsVictoryModalOpen(false);
            setStatsInitialTab('achievements');
            setIsStatsOpen(true);
          }}
        />
      )}

      {/* Interactive Game Playback Replay Modal */}
      <GameReplayModal
        isOpen={isReplayModalOpen}
        onClose={() => {
          setIsReplayModalOpen(false);
          setIsVictoryModalOpen(true);
        }}
        gameId={currentGameId}
        replaySteps={state.replaySteps || []}
        settings={settings}
        finalScore={state.score}
        finalTimeSeconds={state.elapsedTime}
        onPlayAgain={() => {
          setIsReplayModalOpen(false);
          setIsVictoryModalOpen(false);
          if (isDailyChallengeActive) {
            handleStartDailyChallenge(dailyChallengeDate);
          } else {
            startNewGame(currentGameId);
          }
        }}
      />

      {/* Interactive Context-Aware Game Rules Modal */}
      <GameRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        gameId={currentGameId}
        onSelectGame={(newGameId) => {
          setIsRulesOpen(false);
          startNewGame(newGameId);
        }}
        onOpenTutorial={
          currentGameId === 'klondike' || currentGameId === 'klondike3'
            ? () => {
                setIsRulesOpen(false);
                setIsTutorialOpen(true);
              }
            : undefined
        }
      />

      {/* Interactive Klondike Move & Rules Overlay Tutorial */}
      <KlondikeTutorialOverlay
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        onRestartGame={() => startNewGame('klondike')}
      />
    </div>
  );
}
