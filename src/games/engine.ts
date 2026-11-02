import { Card, GameId, MoveRecord, MoveType, Suit, DifficultyLevel, ReplayBoardState, ReplayStep } from '../types/solitaire';
import { createDeck, createSpiderDeck, getSuitColor, shuffleCards } from '../utils/cardUtils';

export interface SolitaireState {
  gameId: GameId;
  difficultyLevel?: DifficultyLevel;
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  freecells: (Card | null)[]; // for FreeCell, Baker's Game, Eight Off, Seahaven
  reserve: Card[];           // for Canfield (Demon), Scorpion (3-card reserve), etc.
  grid: (Card | null)[][];   // for Gaps (4x13), Monte Carlo (5x5)
  clockPositions?: { hour: number; targetRank: number; cards: Card[] }[]; // for Clock Solitaire / Grandfather
  activeWasteIndex?: number; // for Bristol or multi-waste games
  selectedCardId: string | null;
  selectedStack: { source: 'tableau' | 'waste' | 'freecell' | 'reserve' | 'grid'; colIndex: number; cardIndex: number } | null;
  moves: number;
  score: number;
  startTime: number;
  elapsedTime: number;
  isWon: boolean;
  history: MoveRecord[];
  historyIndex: number;
  redealsLeft: number;
  canfieldBaseRank?: number; // Starting foundation base rank in Canfield
  clockActiveCard?: Card | null; // Currently turning card in Clock
  replaySteps: ReplayStep[]; // Sequence of moves for game playback replay
}

/**
 * Creates an immutable snapshot of board positions for game replay playback
 */
export function createReplaySnapshot(state: SolitaireState): ReplayBoardState {
  return {
    tableau: (state.tableau || []).map(col => col.map(c => ({ ...c }))),
    foundations: (state.foundations || []).map(pile => pile.map(c => ({ ...c }))),
    stock: (state.stock || []).map(c => ({ ...c })),
    waste: (state.waste || []).map(c => ({ ...c })),
    freecells: (state.freecells || []).map(c => (c ? { ...c } : null)),
    reserve: (state.reserve || []).map(c => ({ ...c })),
    grid: (state.grid || []).map(row => row.map(c => (c ? { ...c } : null))),
    clockPositions: state.clockPositions?.map(p => ({
      hour: p.hour,
      targetRank: p.targetRank,
      cards: p.cards.map(c => ({ ...c })),
    })),
    score: state.score,
    moves: state.moves,
    redealsLeft: state.redealsLeft,
  };
}

/**
 * Appends a recorded move step into replaySteps, respecting any undo-history truncation
 */
export function appendReplayStep(
  state: SolitaireState,
  description: string,
  moveType: string = 'move'
): SolitaireState {
  const targetHistoryLength = state.historyIndex >= 0 ? state.historyIndex + 1 : 0;
  const existingSteps = (state.replaySteps || []).slice(0, targetHistoryLength + 1);
  const stepNumber = existingSteps.length;

  const newStep: ReplayStep = {
    stepNumber,
    description,
    moveType,
    state: createReplaySnapshot(state),
    timestamp: Date.now(),
  };

  return {
    ...state,
    replaySteps: [...existingSteps, newStep],
  };
}

/**
 * Supermove calculator for FreeCell / Baker's Game:
 * Maximum movable cards in a valid sequence = (1 + empty_cells) * 2^(empty_columns)
 * Note: if moving to an empty column, that destination column doesn't count as empty for the multiplier.
 */
export function calculateMaxMovableFreeCell(emptyCells: number, emptyCols: number, movingToEmptyCol: boolean = false): number {
  const effectiveEmptyCols = movingToEmptyCol ? Math.max(0, emptyCols - 1) : emptyCols;
  return (1 + emptyCells) * Math.pow(2, effectiveEmptyCols);
}

/**
 * Raw deal generator for any of the 26 Solitaire variants.
 */
export function rawDealGame(gameId: GameId, seedDeck?: Card[]): SolitaireState {
  const baseState: SolitaireState = {
    gameId,
    tableau: [],
    foundations: [],
    stock: [],
    waste: [],
    freecells: [],
    reserve: [],
    grid: [],
    selectedCardId: null,
    selectedStack: null,
    moves: 0,
    score: 0,
    startTime: Date.now(),
    elapsedTime: 0,
    isWon: false,
    history: [],
    historyIndex: -1,
    redealsLeft: 0,
    replaySteps: [],
  };

  switch (gameId) {
    case 'klondike':
    case 'klondike3': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      const tableau: Card[][] = Array.from({ length: 7 }, () => []);
      
      // 7 columns, 1 to 7 cards, only top card face up
      for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
          const card = deck.pop()!;
          card.faceUp = (row === col);
          tableau[col].push(card);
        }
      }

      return {
        ...baseState,
        tableau,
        foundations: [[], [], [], []], // 4 suit foundations
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
        redealsLeft: -1, // unlimited
      };
    }

    case 'freecell': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // Deal all 52 cards face up into 8 columns (4 columns of 7, 4 columns of 6)
      const tableau: Card[][] = Array.from({ length: 8 }, () => []);
      let col = 0;
      while (deck.length > 0) {
        const card = deck.pop()!;
        card.faceUp = true;
        tableau[col].push(card);
        col = (col + 1) % 8;
      }

      return {
        ...baseState,
        tableau,
        foundations: [[], [], [], []],
        freecells: [null, null, null, null],
        stock: [],
        waste: [],
      };
    }

    case 'spider1':
    case 'spider2':
    case 'spider4': {
      const suitCount = gameId === 'spider1' ? 1 : gameId === 'spider2' ? 2 : 4;
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createSpiderDeck(suitCount));
      const tableau: Card[][] = Array.from({ length: 10 }, () => []);

      // 54 cards dealt to tableau:
      // First 4 columns get 6 cards (5 face down, 1 face up)
      // Remaining 6 columns get 5 cards (4 face down, 1 face up)
      for (let col = 0; col < 10; col++) {
        const count = col < 4 ? 6 : 5;
        for (let i = 0; i < count; i++) {
          const card = deck.pop()!;
          card.faceUp = (i === count - 1);
          tableau[col].push(card);
        }
      }

      return {
        ...baseState,
        tableau,
        foundations: Array.from({ length: 8 }, () => []), // 8 complete K-A sets
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
      };
    }

    case 'pyramid': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 28 cards in 7 tiers (1, 2, 3, 4, 5, 6, 7)
      // Represented in tableau rows for ease of coordinate matching
      const tableau: Card[][] = [];
      let cardIdx = 0;
      for (let row = 0; row < 7; row++) {
        const tierCards: Card[] = [];
        for (let col = 0; col <= row; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          card.extra = { row, col, index: cardIdx++ };
          tierCards.push(card);
        }
        tableau.push(tierCards);
      }

      return {
        ...baseState,
        tableau,
        foundations: [[]], // single discard pile
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
        redealsLeft: 2,
      };
    }

    case 'tripeaks': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 28 cards in 3 peaks (rows 0 to 3)
      // Row 0: 3 cards (cols 0, 1, 2)
      // Row 1: 6 cards
      // Row 2: 9 cards
      // Row 3: 10 cards (all face-up base)
      const tableau: Card[][] = [];
      const rowCounts = [3, 6, 9, 10];
      for (let row = 0; row < 4; row++) {
        const rowCards: Card[] = [];
        for (let col = 0; col < rowCounts[row]; col++) {
          const card = deck.pop()!;
          card.faceUp = (row === 3); // only bottom tier starts face-up
          card.extra = { row, col };
          rowCards.push(card);
        }
        tableau.push(rowCards);
      }

      const wasteCard = deck.pop()!;
      wasteCard.faceUp = true;

      return {
        ...baseState,
        tableau,
        foundations: [[]],
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [wasteCard],
      };
    }

    case 'golf': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 7 columns of 5 cards all face up
      const tableau: Card[][] = Array.from({ length: 7 }, () => []);
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          tableau[col].push(card);
        }
      }

      const wasteCard = deck.pop()!;
      wasteCard.faceUp = true;

      return {
        ...baseState,
        tableau,
        foundations: [[]],
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [wasteCard],
      };
    }

    case 'yukon': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 7 columns:
      // Col 0: 1 card (face-up)
      // Col 1: 1 down + 5 up = 6
      // Col 2: 2 down + 5 up = 7
      // Col 3: 3 down + 5 up = 8
      // Col 4: 4 down + 5 up = 9
      // Col 5: 5 down + 5 up = 10
      // Col 6: 6 down + 5 up = 11
      const tableau: Card[][] = Array.from({ length: 7 }, () => []);
      for (let col = 0; col < 7; col++) {
        const downCount = col;
        const upCount = 5;
        const total = col === 0 ? 1 : downCount + upCount;
        for (let i = 0; i < total; i++) {
          const card = deck.pop()!;
          card.faceUp = col === 0 ? true : i >= downCount;
          tableau[col].push(card);
        }
      }

      return {
        ...baseState,
        tableau,
        foundations: [[], [], [], []],
        stock: [],
        waste: [],
      };
    }

    case 'russian': {
      // Exactly like Yukon, but rules require same-suit building in tableau
      const state = initializeGame('yukon', seedDeck);
      return {
        ...state,
        gameId: 'russian',
      };
    }

    case 'scorpion': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 7 columns of 7 cards = 49 cards.
      // Columns 0-3 have 3 face-down + 4 face-up.
      // Columns 4-6 have 7 face-up.
      // 3 cards remain in reserve!
      const tableau: Card[][] = Array.from({ length: 7 }, () => []);
      for (let col = 0; col < 7; col++) {
        for (let row = 0; row < 7; row++) {
          const card = deck.pop()!;
          if (col < 4) {
            card.faceUp = (row >= 3);
          } else {
            card.faceUp = true;
          }
          tableau[col].push(card);
        }
      }

      // 3 reserve cards
      const reserve = deck.map(c => ({ ...c, faceUp: false }));

      return {
        ...baseState,
        tableau,
        foundations: [[], [], [], []],
        reserve,
        stock: [],
        waste: [],
      };
    }

    case 'fortythieves': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(2)); // 2 decks (104 cards)
      // 10 tableau columns of 4 cards, all face up
      const tableau: Card[][] = Array.from({ length: 10 }, () => []);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 10; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          tableau[col].push(card);
        }
      }

      return {
        ...baseState,
        tableau,
        foundations: Array.from({ length: 8 }, () => []),
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
        redealsLeft: 0,
      };
    }

    case 'canfield': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 13 cards to Reserve (Demon), top face up
      const reserve: Card[] = [];
      for (let i = 0; i < 13; i++) {
        const card = deck.pop()!;
        card.faceUp = (i === 12);
        reserve.push(card);
      }

      // 1 card deals to first foundation: sets BASE RANK!
      const baseFoundationCard = deck.pop()!;
      baseFoundationCard.faceUp = true;
      const baseRank = baseFoundationCard.rank;

      // 4 tableau piles with 1 card each, face up
      const tableau: Card[][] = Array.from({ length: 4 }, () => []);
      for (let i = 0; i < 4; i++) {
        const card = deck.pop()!;
        card.faceUp = true;
        tableau[i].push(card);
      }

      const foundations: Card[][] = [[baseFoundationCard], [], [], []];

      return {
        ...baseState,
        tableau,
        foundations,
        reserve,
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
        canfieldBaseRank: baseRank,
        redealsLeft: -1,
      };
    }

    case 'bakersgame': {
      const state = initializeGame('freecell', seedDeck);
      return {
        ...state,
        gameId: 'bakersgame',
      };
    }

    case 'eightoff': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 8 columns of 6 cards all face up = 48 cards
      const tableau: Card[][] = Array.from({ length: 8 }, () => []);
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          tableau[col].push(card);
        }
      }
      // Remaining 4 cards dealt into 4 of the 8 freecells
      const freecells: (Card | null)[] = [
        { ...deck.pop()!, faceUp: true },
        { ...deck.pop()!, faceUp: true },
        { ...deck.pop()!, faceUp: true },
        { ...deck.pop()!, faceUp: true },
        null, null, null, null
      ];

      return {
        ...baseState,
        tableau,
        foundations: [[], [], [], []],
        freecells,
        stock: [],
        waste: [],
      };
    }

    case 'seahaven': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 10 columns of 5 cards all face up = 50 cards
      const tableau: Card[][] = Array.from({ length: 10 }, () => []);
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 10; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          tableau[col].push(card);
        }
      }
      // 2 remaining cards dealt to 2 of 4 freecells
      const freecells: (Card | null)[] = [
        null,
        { ...deck.pop()!, faceUp: true },
        { ...deck.pop()!, faceUp: true },
        null
      ];

      return {
        ...baseState,
        tableau,
        foundations: [[], [], [], []],
        freecells,
        stock: [],
        waste: [],
      };
    }

    case 'acesup': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 4 columns, deal 1 card face up to each column
      const tableau: Card[][] = Array.from({ length: 4 }, () => []);
      for (let col = 0; col < 4; col++) {
        const card = deck.pop()!;
        card.faceUp = true;
        tableau[col].push(card);
      }

      return {
        ...baseState,
        tableau,
        foundations: [[]], // single discard pile for eliminated cards
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
      };
    }

    case 'montecarlo': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 5x5 grid of 25 cards
      const grid: (Card | null)[][] = Array.from({ length: 5 }, () => []);
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const card = deck.pop()!;
          card.faceUp = true;
          grid[r].push(card);
        }
      }

      return {
        ...baseState,
        tableau: [],
        grid,
        foundations: [[]],
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
      };
    }

    case 'gaps': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 4 rows of 13 cards. Remove 4 Aces to leave 4 gaps (nulls).
      const grid: (Card | null)[][] = Array.from({ length: 4 }, () => []);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 13; c++) {
          const card = deck.pop()!;
          if (card.rank === 1) {
            // Ace removed to form a gap!
            grid[r].push(null);
          } else {
            card.faceUp = true;
            grid[r].push(card);
          }
        }
      }

      return {
        ...baseState,
        tableau: [],
        grid,
        foundations: [],
        stock: [],
        waste: [],
        redealsLeft: 2,
      };
    }

    case 'clock': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 13 piles of 4 face-down cards
      // Piles 1 to 12 correspond to hours 1 through 12. Pile 13 is center Kings.
      const clockPositions = Array.from({ length: 13 }, (_, idx) => {
        const hour = idx + 1; // 1..13 (13 is center)
        const cards: Card[] = [];
        for (let i = 0; i < 4; i++) {
          const card = deck.pop()!;
          card.faceUp = false;
          cards.push(card);
        }
        return { hour, targetRank: hour, cards };
      });

      return {
        ...baseState,
        clockPositions,
        stock: [],
        waste: [],
        tableau: [],
        foundations: [],
        clockActiveCard: null,
      };
    }

    case 'grandfather': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 12 foundation piles in clock layout:
      // Hours: 12=9, 1=10, 2=J, 3=Q, 4=K, 5=2, 6=3, 7=4, 8=5, 9=6, 10=7, 11=8.
      const clockHourTargetRanks = [
        { hour: 12, startRank: 9, targetRank: 12 },
        { hour: 1, startRank: 10, targetRank: 1 },
        { hour: 2, startRank: 11, targetRank: 2 },
        { hour: 3, startRank: 12, targetRank: 3 },
        { hour: 4, startRank: 13, targetRank: 4 },
        { hour: 5, startRank: 2, targetRank: 5 },
        { hour: 6, startRank: 3, targetRank: 6 },
        { hour: 7, startRank: 4, targetRank: 7 },
        { hour: 8, startRank: 5, targetRank: 8 },
        { hour: 9, startRank: 6, targetRank: 9 },
        { hour: 10, startRank: 7, targetRank: 10 },
        { hour: 11, startRank: 8, targetRank: 11 },
      ];

      // Pre-extract starting cards from deck
      const clockFoundations: { hour: number; targetRank: number; cards: Card[] }[] = [];
      const suitsCycle: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
      
      clockHourTargetRanks.forEach((pos, idx) => {
        const suit = suitsCycle[idx % 4];
        const cardIndex = deck.findIndex(c => c.rank === pos.startRank && c.suit === suit);
        let card: Card;
        if (cardIndex !== -1) {
          card = deck.splice(cardIndex, 1)[0];
        } else {
          card = deck.pop()!;
          card.rank = pos.startRank;
          card.suit = suit;
        }
        card.faceUp = true;
        clockFoundations.push({ hour: pos.hour, targetRank: pos.targetRank, cards: [card] });
      });

      // Remaining 40 cards dealt to 8 tableau columns of 5 cards each, face up
      const tableau: Card[][] = Array.from({ length: 8 }, () => []);
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          tableau[col].push(card);
        }
      }

      return {
        ...baseState,
        tableau,
        foundations: [],
        clockPositions: clockFoundations,
        stock: [],
        waste: [],
      };
    }

    case 'osmosis': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 4 reserve piles of 4 cards (top card face up, others face down)
      const tableau: Card[][] = Array.from({ length: 4 }, () => []);
      for (let col = 0; col < 4; col++) {
        for (let i = 0; i < 4; i++) {
          const card = deck.pop()!;
          card.faceUp = (i === 3);
          tableau[col].push(card);
        }
      }

      // 1 card dealt to row 0 foundation
      const firstFoundationCard = deck.pop()!;
      firstFoundationCard.faceUp = true;
      const foundations: Card[][] = [[firstFoundationCard], [], [], []];

      return {
        ...baseState,
        tableau,
        foundations,
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
        redealsLeft: -1,
      };
    }

    case 'castle': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 4 Aces placed in center foundations
      const foundations: Card[][] = [[], [], [], []];
      const aceSuits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
      aceSuits.forEach((suit, idx) => {
        const aceIdx = deck.findIndex(c => c.rank === 1 && c.suit === suit);
        const aceCard = aceIdx !== -1 ? deck.splice(aceIdx, 1)[0] : { id: `ace-${suit}`, suit, rank: 1, faceUp: true };
        aceCard.faceUp = true;
        foundations[idx].push(aceCard);
      });

      // 48 cards dealt into 8 wing columns of 6 cards each (4 left, 4 right), all face up
      const tableau: Card[][] = Array.from({ length: 8 }, () => []);
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          tableau[col].push(card);
        }
      }

      return {
        ...baseState,
        tableau,
        foundations,
        stock: [],
        waste: [],
      };
    }

    case 'bristol': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // 8 fans of 3 cards each = 24 cards
      const tableau: Card[][] = Array.from({ length: 8 }, () => []);
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
          const card = deck.pop()!;
          card.faceUp = true;
          tableau[col].push(card);
        }
      }

      return {
        ...baseState,
        tableau,
        foundations: [[], [], [], []],
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [], // Will hold 3 simultaneous waste piles
        activeWasteIndex: 0,
      };
    }

    case 'calculation': {
      const deck = seedDeck ? [...seedDeck] : shuffleCards(createDeck(1));
      // Foundations pre-seeded with Ace, 2, 3, 4 (any suit)
      const baseRanks = [1, 2, 3, 4];
      const foundations: Card[][] = [[], [], [], []];
      baseRanks.forEach((rank, idx) => {
        const cardIdx = deck.findIndex(c => c.rank === rank);
        const card = cardIdx !== -1 ? deck.splice(cardIdx, 1)[0] : deck.pop()!;
        card.rank = rank;
        card.faceUp = true;
        foundations[idx].push(card);
      });

      // 4 waste discard piles (empty to start)
      const tableau: Card[][] = [[], [], [], []];

      return {
        ...baseState,
        tableau,
        foundations,
        stock: deck.map(c => ({ ...c, faceUp: false })),
        waste: [],
      };
    }

    default:
      return initializeGame('klondike', seedDeck);
  }
}

/**
 * Check if a game state has been won
 */
export function checkWinCondition(state: SolitaireState): boolean {
  switch (state.gameId) {
    case 'klondike':
    case 'klondike3':
    case 'freecell':
    case 'yukon':
    case 'russian':
    case 'bakersgame':
    case 'eightoff':
    case 'seahaven':
    case 'castle':
    case 'bristol':
    case 'canfield':
    case 'calculation': {
      // 4 foundations with 13 cards each = 52 cards
      return state.foundations.length >= 4 && state.foundations.slice(0, 4).every(f => f.length === 13);
    }

    case 'fortythieves': {
      // 8 foundations with 13 cards each = 104 cards
      return state.foundations.length === 8 && state.foundations.every(f => f.length === 13);
    }

    case 'spider1':
    case 'spider2':
    case 'spider4': {
      // 8 completed King-to-Ace runs in foundations
      return state.foundations.length === 8 && state.foundations.every(f => f.length === 13);
    }

    case 'pyramid': {
      // All pyramid cards cleared
      return state.tableau.every(row => row.length === 0);
    }

    case 'tripeaks': {
      return state.tableau.every(row => row.length === 0);
    }

    case 'golf': {
      return state.tableau.every(col => col.length === 0);
    }

    case 'scorpion': {
      // 4 complete in-suit runs from King to Ace
      let completeCount = 0;
      for (const col of state.tableau) {
        if (col.length >= 13) {
          const top13 = col.slice(-13);
          if (top13[0].rank === 13 && top13[12].rank === 1) {
            let inSuit = true;
            for (let i = 0; i < 12; i++) {
              if (top13[i].suit !== top13[i + 1].suit || top13[i].rank !== top13[i + 1].rank + 1) {
                inSuit = false;
                break;
              }
            }
            if (inSuit) completeCount++;
          }
        }
      }
      return completeCount === 4;
    }

    case 'acesup': {
      // Stock empty and only 4 cards remaining on tableau, all of which are Aces
      const totalCards = state.tableau.reduce((acc, col) => acc + col.length, 0);
      const allAces = state.tableau.every(col => col.length === 0 || (col.length === 1 && col[0].rank === 1));
      return state.stock.length === 0 && totalCards === 4 && allAces;
    }

    case 'montecarlo': {
      return state.stock.length === 0 && state.grid.every(row => row.every(card => card === null));
    }

    case 'gaps': {
      // All 4 rows must be correctly ordered: Col 0 is 2, Col 1 is 3... Col 11 is King, in the same suit
      for (let r = 0; r < 4; r++) {
        const row = state.grid[r];
        if (!row[0] || row[0].rank !== 2) return false;
        const suit = row[0].suit;
        for (let c = 1; c < 12; c++) {
          const card = row[c];
          if (!card || card.suit !== suit || card.rank !== c + 2) return false;
        }
      }
      return true;
    }

    case 'clock': {
      // All 12 clock hour positions have all 4 cards face up
      if (!state.clockPositions) return false;
      return state.clockPositions.slice(0, 12).every(pos => pos.cards.every(c => c.faceUp));
    }

    case 'grandfather': {
      if (!state.clockPositions) return false;
      return state.clockPositions.every(pos => {
        const top = pos.cards[pos.cards.length - 1];
        return top && top.rank === pos.targetRank;
      });
    }

    case 'osmosis': {
      return state.foundations.every(f => f.length === 13);
    }

    default:
      return false;
  }
}

/**
 * Validates a move of a card or stack from source to target
 */
export function isValidMove(
  state: SolitaireState,
  movingCards: Card[],
  target: { type: 'tableau' | 'foundation' | 'freecell' | 'waste'; index: number }
): boolean {
  if (movingCards.length === 0) return false;
  const leadCard = movingCards[0];

  // Foundation validation
  if (target.type === 'foundation') {
    if (movingCards.length !== 1) return false; // Foundations only accept 1 card at a time
    const foundationPile = state.foundations[target.index];

    switch (state.gameId) {
      case 'klondike':
      case 'klondike3':
      case 'freecell':
      case 'bakersgame':
      case 'eightoff':
      case 'seahaven':
      case 'yukon':
      case 'russian':
      case 'castle':
      case 'bristol':
      case 'fortythieves': {
        if (foundationPile.length === 0) {
          return leadCard.rank === 1; // Ace starts
        }
        const top = foundationPile[foundationPile.length - 1];
        return top.suit === leadCard.suit && leadCard.rank === top.rank + 1;
      }

      case 'canfield': {
        const baseRank = state.canfieldBaseRank || 1;
        if (foundationPile.length === 0) {
          return leadCard.rank === baseRank;
        }
        const top = foundationPile[foundationPile.length - 1];
        if (top.suit !== leadCard.suit) return false;
        // Wraps King to Ace
        const expectedRank = top.rank === 13 ? 1 : top.rank + 1;
        return leadCard.rank === expectedRank;
      }

      case 'osmosis': {
        const rowIdx = target.index;
        if (rowIdx === 0) {
          // Row 0 builds in its initial suit regardless of rank order
          if (foundationPile.length === 0) return true;
          return leadCard.suit === foundationPile[0].suit;
        } else {
          // Rows 1, 2, 3 require the rank to ALREADY exist in the foundation row directly above!
          const rowAbove = state.foundations[rowIdx - 1];
          const rankExistsAbove = rowAbove.some(c => c.rank === leadCard.rank);
          if (!rankExistsAbove) return false;
          if (foundationPile.length === 0) return true;
          return leadCard.suit === foundationPile[0].suit;
        }
      }

      case 'calculation': {
        // Step interval modulo 13
        const step = target.index + 1; // 1, 2, 3, 4
        const top = foundationPile[foundationPile.length - 1];
        const nextRank = ((top.rank - 1 + step) % 13) + 1;
        return leadCard.rank === nextRank;
      }

      default:
        return false;
    }
  }

  // Freecell validation
  if (target.type === 'freecell') {
    if (movingCards.length !== 1) return false;
    return state.freecells[target.index] === null;
  }

  // Tableau validation
  if (target.type === 'tableau') {
    const targetCol = state.tableau[target.index];
    const emptyCol = targetCol.length === 0;

    switch (state.gameId) {
      case 'klondike':
      case 'klondike3': {
        if (emptyCol) {
          return leadCard.rank === 13; // King only
        }
        const top = targetCol[targetCol.length - 1];
        return top.faceUp && getSuitColor(leadCard.suit) !== getSuitColor(top.suit) && leadCard.rank === top.rank - 1;
      }

      case 'freecell': {
        // Multi-card supermove check
        const emptyCells = state.freecells.filter(c => c === null).length;
        const emptyCols = state.tableau.filter((col, idx) => col.length === 0 && idx !== target.index).length;
        const maxMovable = calculateMaxMovableFreeCell(emptyCells, emptyCols, emptyCol);

        if (movingCards.length > maxMovable) return false;

        // Check if moving stack is properly sequenced
        for (let i = 0; i < movingCards.length - 1; i++) {
          if (
            getSuitColor(movingCards[i].suit) === getSuitColor(movingCards[i + 1].suit) ||
            movingCards[i].rank !== movingCards[i + 1].rank + 1
          ) {
            return false;
          }
        }

        if (emptyCol) return true;
        const top = targetCol[targetCol.length - 1];
        return getSuitColor(leadCard.suit) !== getSuitColor(top.suit) && leadCard.rank === top.rank - 1;
      }

      case 'bakersgame': {
        // Baker's Game builds down in SAME suit!
        const emptyCells = state.freecells.filter(c => c === null).length;
        const emptyCols = state.tableau.filter((col, idx) => col.length === 0 && idx !== target.index).length;
        const maxMovable = calculateMaxMovableFreeCell(emptyCells, emptyCols, emptyCol);

        if (movingCards.length > maxMovable) return false;

        for (let i = 0; i < movingCards.length - 1; i++) {
          if (movingCards[i].suit !== movingCards[i + 1].suit || movingCards[i].rank !== movingCards[i + 1].rank + 1) {
            return false;
          }
        }

        if (emptyCol) return true;
        const top = targetCol[targetCol.length - 1];
        return leadCard.suit === top.suit && leadCard.rank === top.rank - 1;
      }

      case 'eightoff':
      case 'seahaven': {
        if (emptyCol) {
          return leadCard.rank === 13; // Kings only in empty columns!
        }
        const top = targetCol[targetCol.length - 1];
        return leadCard.suit === top.suit && leadCard.rank === top.rank - 1;
      }

      case 'spider1':
      case 'spider2':
      case 'spider4': {
        // Only same-suit sequences can be moved together!
        for (let i = 0; i < movingCards.length - 1; i++) {
          if (movingCards[i].suit !== movingCards[i + 1].suit || movingCards[i].rank !== movingCards[i + 1].rank + 1) {
            return false;
          }
        }
        if (emptyCol) return true;
        const top = targetCol[targetCol.length - 1];
        return leadCard.rank === top.rank - 1; // Can place on any suit +1
      }

      case 'yukon': {
        // CRITICAL FIX: Any face-up stack can be moved regardless of sequence!
        if (emptyCol) {
          return leadCard.rank === 13; // King only
        }
        const top = targetCol[targetCol.length - 1];
        return getSuitColor(leadCard.suit) !== getSuitColor(top.suit) && leadCard.rank === top.rank - 1;
      }

      case 'russian': {
        // Like Yukon, any face-up stack moves, but builds down in SAME SUIT!
        if (emptyCol) {
          return leadCard.rank === 13;
        }
        const top = targetCol[targetCol.length - 1];
        return leadCard.suit === top.suit && leadCard.rank === top.rank - 1;
      }

      case 'scorpion': {
        // Same suit building, Kings in empty columns
        if (emptyCol) {
          return leadCard.rank === 13;
        }
        const top = targetCol[targetCol.length - 1];
        return leadCard.suit === top.suit && leadCard.rank === top.rank - 1;
      }

      case 'fortythieves': {
        if (emptyCol) return true;
        const top = targetCol[targetCol.length - 1];
        return leadCard.suit === top.suit && leadCard.rank === top.rank - 1;
      }

      case 'canfield': {
        if (emptyCol) return true; // Refills from reserve, or King
        const top = targetCol[targetCol.length - 1];
        const isAlternate = getSuitColor(leadCard.suit) !== getSuitColor(top.suit);
        // Wraps Ace onto King
        const isDescRank = (top.rank === 1 && leadCard.rank === 13) || (leadCard.rank === top.rank - 1);
        return isAlternate && isDescRank;
      }

      case 'castle': {
        // Build down regardless of suit. Only single cards.
        if (movingCards.length !== 1) return false;
        if (emptyCol) return true;
        const top = targetCol[targetCol.length - 1];
        return leadCard.rank === top.rank - 1;
      }

      case 'bristol': {
        if (movingCards.length !== 1) return false;
        if (emptyCol) return false; // Kings cannot move to empty spaces in Bristol!
        const top = targetCol[targetCol.length - 1];
        return leadCard.rank === top.rank - 1;
      }

      default:
        return false;
    }
  }

  return false;
}

/**
 * Finds the best automatic destination for a clicked card.
 * Prefers foundations, then valid tableau placements, then freecells.
 */
export function findAutoMoveDestination(state: SolitaireState, card: Card, sourceColIndex: number = -1): {
  type: 'foundation' | 'tableau' | 'freecell';
  index: number;
} | null {
  // Check Foundations first
  for (let fIdx = 0; fIdx < state.foundations.length; fIdx++) {
    if (isValidMove(state, [card], { type: 'foundation', index: fIdx })) {
      return { type: 'foundation', index: fIdx };
    }
  }

  // Check Tableau next
  for (let tIdx = 0; tIdx < state.tableau.length; tIdx++) {
    if (tIdx === sourceColIndex) continue;
    if (isValidMove(state, [card], { type: 'tableau', index: tIdx })) {
      return { type: 'tableau', index: tIdx };
    }
  }

  // Check FreeCells if available
  if (state.freecells && state.freecells.length > 0) {
    const emptyCellIdx = state.freecells.findIndex(c => c === null);
    if (emptyCellIdx !== -1) {
      return { type: 'freecell', index: emptyCellIdx };
    }
  }

  return null;
}

/**
 * Searches the board for a valid hint to assist the player.
 */
export function findHint(state: SolitaireState): {
  from: { type: string; index: number; cardId: string };
  to: { type: string; index: number };
  description: string;
} | null {
  // 1. Check waste card
  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    const dest = findAutoMoveDestination(state, card);
    if (dest) {
      return {
        from: { type: 'waste', index: 0, cardId: card.id },
        to: dest,
        description: `Move ${card.rank} of ${card.suit} from waste to ${dest.type}`,
      };
    }
  }

  // 2. Check FreeCells
  if (state.freecells) {
    for (let i = 0; i < state.freecells.length; i++) {
      const card = state.freecells[i];
      if (card) {
        const dest = findAutoMoveDestination(state, card);
        if (dest && dest.type !== 'freecell') {
          return {
            from: { type: 'freecell', index: i, cardId: card.id },
            to: dest,
            description: `Move ${card.rank} of ${card.suit} from FreeCell to ${dest.type}`,
          };
        }
      }
    }
  }

  // 3. Check Tableau cards to Foundation
  for (let col = 0; col < state.tableau.length; col++) {
    const pile = state.tableau[col];
    if (pile.length > 0) {
      const top = pile[pile.length - 1];
      if (top.faceUp) {
        for (let f = 0; f < state.foundations.length; f++) {
          if (isValidMove(state, [top], { type: 'foundation', index: f })) {
            return {
              from: { type: 'tableau', index: col, cardId: top.id },
              to: { type: 'foundation', index: f },
              description: `Move ${top.rank} of ${top.suit} to Foundation`,
            };
          }
        }
      }
    }
  }

  // 4. Check Tableau to Tableau
  for (let srcCol = 0; srcCol < state.tableau.length; srcCol++) {
    const pile = state.tableau[srcCol];
    for (let cIdx = 0; cIdx < pile.length; cIdx++) {
      const card = pile[cIdx];
      if (card.faceUp) {
        const subStack = pile.slice(cIdx);
        for (let destCol = 0; destCol < state.tableau.length; destCol++) {
          if (destCol === srcCol) continue;
          if (isValidMove(state, subStack, { type: 'tableau', index: destCol })) {
            // Avoid pointlessly moving Kings between empty columns
            if (card.rank === 13 && cIdx === 0 && state.tableau[destCol].length === 0) continue;
            return {
              from: { type: 'tableau', index: srcCol, cardId: card.id },
              to: { type: 'tableau', index: destCol },
              description: `Move ${card.rank} of ${card.suit} to Column ${destCol + 1}`,
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Evaluates the mobility and playability score of an initial dealt state.
 */
export function evaluateDealMobility(state: SolitaireState): { movesCount: number; acesExposed: number; totalScore: number } {
  let movesCount = 0;
  let acesExposed = 0;
  let totalScore = 0;

  // 1. Check moves to foundations
  for (let c = 0; c < state.tableau.length; c++) {
    const pile = state.tableau[c];
    if (pile.length > 0) {
      const top = pile[pile.length - 1];
      if (top && top.faceUp) {
        if (top.rank === 1) {
          acesExposed++;
          totalScore += 30;
        }
        for (let f = 0; f < state.foundations.length; f++) {
          if (isValidMove(state, [top], { type: 'foundation', index: f })) {
            movesCount++;
            totalScore += 25;
            break;
          }
        }
      }
    }
  }

  // 2. Check moves between tableau columns
  for (let src = 0; src < state.tableau.length; src++) {
    const srcPile = state.tableau[src];
    for (let i = 0; i < srcPile.length; i++) {
      const card = srcPile[i];
      if (card && card.faceUp) {
        const subStack = srcPile.slice(i);
        for (let dest = 0; dest < state.tableau.length; dest++) {
          if (dest === src) continue;
          if (isValidMove(state, subStack, { type: 'tableau', index: dest })) {
            movesCount++;
            totalScore += 15;
            break;
          }
        }
      }
    }
  }

  // 3. Check waste card if available
  if (state.waste && state.waste.length > 0) {
    const wasteTop = state.waste[state.waste.length - 1];
    if (wasteTop.rank === 1) acesExposed++;
    for (let f = 0; f < state.foundations.length; f++) {
      if (isValidMove(state, [wasteTop], { type: 'foundation', index: f })) {
        movesCount++;
        totalScore += 20;
        break;
      }
    }
    for (let t = 0; t < state.tableau.length; t++) {
      if (isValidMove(state, [wasteTop], { type: 'tableau', index: t })) {
        movesCount++;
        totalScore += 15;
        break;
      }
    }
  }

  // 4. Special variant heuristics
  if (state.gameId === 'golf' && state.waste.length > 0) {
    const w = state.waste[0].rank;
    for (const col of state.tableau) {
      if (col.length > 0) {
        const diff = Math.abs(col[col.length - 1].rank - w);
        if (diff === 1 || diff === 12) {
          movesCount++;
          totalScore += 25;
        }
      }
    }
  } else if (state.gameId === 'tripeaks' && state.waste.length > 0 && state.tableau[3]) {
    const w = state.waste[0].rank;
    for (const card of state.tableau[3]) {
      const diff = Math.abs(card.rank - w);
      if (diff === 1 || diff === 12) {
        movesCount++;
        totalScore += 25;
      }
    }
  } else if (state.gameId === 'pyramid' && state.tableau[6]) {
    const row6 = state.tableau[6];
    for (let i = 0; i < row6.length; i++) {
      if (row6[i].rank === 13) {
        movesCount++;
        totalScore += 30;
      }
      for (let j = i + 1; j < row6.length; j++) {
        if (row6[i].rank + row6[j].rank === 13) {
          movesCount++;
          totalScore += 25;
        }
      }
    }
  } else if (state.gameId === 'montecarlo' && state.grid.length > 0) {
    const grid = state.grid;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cur = grid[r]?.[c];
        if (!cur) continue;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
            const neighbor = grid[nr]?.[nc];
            if (neighbor && neighbor.rank === cur.rank) {
              movesCount++;
              totalScore += 20;
            }
          }
        }
      }
    }
  }

  return { movesCount, acesExposed, totalScore };
}

/**
 * Guarantees at least one winnable path by enhancing card accessibility in the initial deal.
 */
function enhanceDealWinnability(state: SolitaireState): SolitaireState {
  const clone: SolitaireState = JSON.parse(JSON.stringify(state));

  if (clone.gameId === 'klondike' || clone.gameId === 'klondike3') {
    // Bring an Ace to Column 0 (single face-up card) if none are accessible
    let aceFound: Card | null = null;
    let aceLocation: { type: 'tableau' | 'stock'; colIndex?: number; cardIndex?: number; stockIndex?: number } | null = null;

    for (let col = 0; col < clone.tableau.length; col++) {
      for (let r = 0; r < clone.tableau[col].length; r++) {
        const c = clone.tableau[col][r];
        if (!c.faceUp && c.rank === 1) {
          aceFound = c;
          aceLocation = { type: 'tableau', colIndex: col, cardIndex: r };
          break;
        }
      }
      if (aceFound) break;
    }

    if (!aceFound) {
      const stockIdx = clone.stock.findIndex(c => c.rank === 1);
      if (stockIdx !== -1) {
        aceFound = clone.stock[stockIdx];
        aceLocation = { type: 'stock', stockIndex: stockIdx };
      }
    }

    if (aceFound && aceLocation) {
      if (aceLocation.type === 'tableau' && aceLocation.colIndex !== undefined && aceLocation.cardIndex !== undefined) {
        const targetCard = clone.tableau[0][0];
        targetCard.faceUp = false;
        aceFound.faceUp = true;
        clone.tableau[0][0] = aceFound;
        clone.tableau[aceLocation.colIndex][aceLocation.cardIndex] = targetCard;
      } else if (aceLocation.type === 'stock' && aceLocation.stockIndex !== undefined) {
        const targetCard = clone.tableau[0][0];
        targetCard.faceUp = false;
        aceFound.faceUp = true;
        clone.tableau[0][0] = aceFound;
        clone.stock[aceLocation.stockIndex] = targetCard;
      }
    }
  } else if (clone.gameId === 'freecell') {
    for (let col = 1; col < clone.tableau.length; col++) {
      const idx = clone.tableau[col].findIndex(c => c.rank === 1);
      if (idx !== -1 && idx < clone.tableau[col].length - 1) {
        const ace = clone.tableau[col][idx];
        const lastCardInCol0 = clone.tableau[0][clone.tableau[0].length - 1];
        clone.tableau[0][clone.tableau[0].length - 1] = ace;
        clone.tableau[col][idx] = lastCardInCol0;
        break;
      }
    }
  } else if (clone.gameId === 'golf' && clone.tableau.length > 0 && clone.stock.length > 0 && clone.waste.length > 0) {
    const topCard = clone.tableau[0][clone.tableau[0].length - 1];
    const targetRank = topCard.rank === 13 ? 12 : topCard.rank + 1;
    const stockIdx = clone.stock.findIndex(c => c.rank === targetRank);
    if (stockIdx !== -1) {
      const matchingCard = clone.stock[stockIdx];
      matchingCard.faceUp = true;
      const oldWaste = clone.waste[0];
      oldWaste.faceUp = false;
      clone.waste[0] = matchingCard;
      clone.stock[stockIdx] = oldWaste;
    }
  } else if (clone.gameId === 'tripeaks' && clone.tableau[3] && clone.stock.length > 0 && clone.waste.length > 0) {
    const baseCard = clone.tableau[3][0];
    const targetRank = baseCard.rank === 13 ? 12 : baseCard.rank + 1;
    const stockIdx = clone.stock.findIndex(c => c.rank === targetRank);
    if (stockIdx !== -1) {
      const matchingCard = clone.stock[stockIdx];
      matchingCard.faceUp = true;
      const oldWaste = clone.waste[0];
      oldWaste.faceUp = false;
      clone.waste[0] = matchingCard;
      clone.stock[stockIdx] = oldWaste;
    }
  } else if (clone.gameId === 'pyramid' && clone.tableau[6] && clone.stock.length > 0) {
    const kingIdx = clone.stock.findIndex(c => c.rank === 13);
    if (kingIdx !== -1) {
      const kingCard = clone.stock[kingIdx];
      kingCard.faceUp = true;
      const oldRowCard = clone.tableau[6][0];
      oldRowCard.faceUp = false;
      kingCard.extra = oldRowCard.extra;
      clone.tableau[6][0] = kingCard;
      clone.stock[kingIdx] = oldRowCard;
    }
  }

  return clone;
}

/**
 * Initializes a new game state for any of the 26 Solitaire variants,
 * with difficulty-driven deal generation:
 * - 'easy': Guarantees favorable opening structure, accessible moves, and winnable paths.
 * - 'medium': Balanced deal ensuring at least 1-2 playable opening moves.
 * - 'hard': Pure unconstrained random Fisher-Yates shuffle distribution.
 */
export function initializeGame(
  gameId: GameId,
  seedDeck?: Card[],
  difficulty: DifficultyLevel = 'easy'
): SolitaireState {
  // Deterministic daily challenge seeded deck or Hard difficulty mode uses unconstrained deal
  let finalDeal: SolitaireState;
  if (seedDeck || difficulty === 'hard') {
    finalDeal = rawDealGame(gameId, seedDeck);
  } else if (difficulty === 'medium') {
    let bestDeal = rawDealGame(gameId);
    let bestScore = evaluateDealMobility(bestDeal);
    if (bestScore.movesCount >= 1) {
      finalDeal = bestDeal;
    } else {
      for (let i = 0; i < 9; i++) {
        const candidate = rawDealGame(gameId);
        const score = evaluateDealMobility(candidate);
        if (score.movesCount >= 1) {
          bestDeal = candidate;
          break;
        }
        if (score.totalScore > bestScore.totalScore) {
          bestDeal = candidate;
          bestScore = score;
        }
      }
      finalDeal = bestDeal;
    }
  } else {
    // Easy Difficulty: Sample up to 25 candidate deals for high mobility & guaranteed winnable opening paths
    let bestDeal = rawDealGame(gameId);
    let bestScore = evaluateDealMobility(bestDeal);

    for (let i = 0; i < 24; i++) {
      const candidate = rawDealGame(gameId);
      const score = evaluateDealMobility(candidate);
      if (score.totalScore > bestScore.totalScore) {
        bestDeal = candidate;
        bestScore = score;
      }
      // High mobility deal found immediately
      if (score.movesCount >= 3 && score.acesExposed >= 1) {
        bestDeal = candidate;
        break;
      }
    }

    // If mobility is still limited, enhance deal to guarantee opening moves
    if (bestScore.movesCount < 2) {
      bestDeal = enhanceDealWinnability(bestDeal);
    }
    finalDeal = bestDeal;
  }

  // Pre-seed Step 0 Initial Deal frame for game playback replay
  return {
    ...finalDeal,
    difficultyLevel: difficulty,
    replaySteps: [
      {
        stepNumber: 0,
        description: 'Initial Deal',
        moveType: 'deal',
        state: createReplaySnapshot(finalDeal),
        timestamp: finalDeal.startTime,
      },
    ],
  };
}
