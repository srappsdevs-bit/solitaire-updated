import { Card, CardColor, GameDefinition, GameId, Suit } from '../types/solitaire';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export function getSuitColor(suit: Suit): CardColor {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function getRankSymbol(rank: number): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return rank.toString();
  }
}

export function getRankName(rank: number): string {
  switch (rank) {
    case 1:
      return 'Ace';
    case 11:
      return 'Jack';
    case 12:
      return 'Queen';
    case 13:
      return 'King';
    default:
      return rank.toString();
  }
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
    case 'spades':
      return '♠';
  }
}

/**
 * Creates one or more standard 52-card decks
 */
export function createDeck(deckCount: number = 1): Card[] {
  const cards: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    for (const suit of SUITS) {
      for (let rank = 1; rank <= 13; rank++) {
        cards.push({
          id: `${suit[0]}-${rank}-${d}`,
          suit,
          rank,
          faceUp: false,
          deckIndex: d,
        });
      }
    }
  }
  return cards;
}

/**
 * Creates a specialized Spider deck with 1 suit (Spades), 2 suits (Spades & Hearts), or 4 suits
 */
export function createSpiderDeck(suitCount: 1 | 2 | 4): Card[] {
  const cards: Card[] = [];
  let allowedSuits: Suit[] = ['spades'];
  if (suitCount === 2) allowedSuits = ['spades', 'hearts'];
  if (suitCount === 4) allowedSuits = ['spades', 'hearts', 'clubs', 'diamonds'];

  // A Spider deck always consists of 104 cards (8 full suits of 13 cards)
  const totalSuitsNeeded = 8;
  for (let i = 0; i < totalSuitsNeeded; i++) {
    const suit = allowedSuits[i % allowedSuits.length];
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({
        id: `spider-${suit[0]}-${rank}-${i}`,
        suit,
        rank,
        faceUp: false,
        deckIndex: Math.floor(i / 4),
      });
    }
  }
  return cards;
}

/**
 * Fisher-Yates robust shuffle algorithm
 */
export function shuffleCards<T>(cards: T[]): T[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Complete Catalogue of the 26 Solitaire Games with full rules and fix notes
 */
export const SOLITAIRE_GAMES: Record<GameId, GameDefinition> = {
  klondike: {
    id: 'klondike',
    name: 'Klondike (Deal 1)',
    category: 'classic',
    difficulty: 'Easy',
    decks: 1,
    redealLimit: -1,
    icon: '♠',
    description: 'The world\'s most famous classic Solitaire. Build 4 foundation piles from Ace to King by suit.',
    objective: 'Move all 52 cards to the 4 foundations in suit from Ace to King.',
    rules: [
      'Tableau builds down in alternating colors (e.g. Red 6 on Black 7).',
      'Move single cards or any ordered descending sequence.',
      'Only Kings (or sequences starting with a King) can be placed in empty tableau columns.',
      'Stock deals 1 card to waste. Unlimited passes through the stock.'
    ],
    fixedIssues: [
      'Smooth auto-flip for newly exposed face-down cards.',
      'Fixed drag detection for partial tableau stacks.',
      'Instant double-tap / single-tap auto-move to foundations.'
    ]
  },
  klondike3: {
    id: 'klondike3',
    name: 'Klondike (Deal 3)',
    category: 'classic',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: -1,
    icon: '♥',
    description: 'The traditional Vegas tournament rules where 3 cards are drawn at a time.',
    objective: 'Move all cards to the foundations dealing 3 cards from stock at a time.',
    rules: [
      'Tableau builds down in alternating colors.',
      'Stock deals 3 cards at once to the waste pile. Only the top waste card is accessible.',
      'Kings fill empty tableau spaces.',
      'Foundations build up by suit from Ace to King.'
    ],
    fixedIssues: [
      'Correct 3-card fanning on waste pile so players can see the next cards.',
      'Proper waste pile depletion and redeal recycling.'
    ]
  },
  freecell: {
    id: 'freecell',
    name: 'FreeCell',
    category: 'classic',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 0,
    icon: '♦',
    description: 'A 100% skill-based game where virtually every deal is solvable using 4 free reserve cells.',
    objective: 'Move all 52 cards to the 4 foundations from Ace to King by suit.',
    rules: [
      'All 52 cards are dealt face-up into 8 columns.',
      '4 FreeCells can hold 1 card each as temporary storage.',
      'Tableau builds down in alternating colors.',
      'Any card can be placed in an empty tableau column.',
      'Supermove formula: maximum cards you can move at once equals (1 + empty cells) * 2^(empty columns).'
    ],
    fixedIssues: [
      'CRITICAL FIX: Supermove formula implemented properly! Previously moving multi-card sequences failed when freecells were open.',
      'Empty column multiplier accurately computed for smooth multi-card dragging.'
    ]
  },
  spider1: {
    id: 'spider1',
    name: 'Spider (1 Suit)',
    category: 'spider',
    difficulty: 'Easy',
    decks: 2,
    redealLimit: 0,
    icon: '♠',
    description: 'Relaxing 1-suit Spider Solitaire using all Spades across 10 tableau columns.',
    objective: 'Assemble 8 full sets of cards from King down to Ace to clear them from the board.',
    rules: [
      '104 cards (all Spades) in 10 tableau columns.',
      'Build down in rank (e.g. 7 on 8).',
      'Completed sequences from King down to Ace are automatically removed to foundations.',
      'Stock deals 1 card to every tableau column simultaneously.'
    ],
    fixedIssues: [
      'Fixed automatic detection and removal of completed K-A sequences.',
      'Option to deal from stock even with empty spaces enabled.'
    ]
  },
  spider2: {
    id: 'spider2',
    name: 'Spider (2 Suits)',
    category: 'spider',
    difficulty: 'Medium',
    decks: 2,
    redealLimit: 0,
    icon: '♠♥',
    description: 'Classic Spider played with Spades and Hearts. Only same-suit sequences can be moved together.',
    objective: 'Assemble 8 in-suit sets of King down to Ace.',
    rules: [
      'Tableau builds down regardless of suit (e.g. Heart 5 on Spade 6).',
      'CRITICAL: Only cards in the same suit sequence can be moved together!',
      'Only complete K-A runs of the SAME suit are cleared.'
    ],
    fixedIssues: [
      'Fixed mixed-suit dragging bug: previously games allowed dragging mixed suits together, violating Spider rules.'
    ]
  },
  spider4: {
    id: 'spider4',
    name: 'Spider (4 Suits)',
    category: 'spider',
    difficulty: 'Expert',
    decks: 2,
    redealLimit: 0,
    icon: '♠♥♣♦',
    description: 'The pinnacle of Solitaire strategy with 4 full suits across 104 cards.',
    objective: 'Assemble 8 full in-suit sets from King to Ace across all 4 suits.',
    rules: [
      'Full 2-deck 4-suit challenge.',
      'Cards can be placed on any rank +1 regardless of suit.',
      'Only same-suit runs can be packed and moved together.'
    ],
    fixedIssues: [
      'Robust validation for same-suit sequences.',
      'Auto-flip face-down cards underneath completed runs.'
    ]
  },
  pyramid: {
    id: 'pyramid',
    name: 'Pyramid',
    category: 'pairing',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 2,
    icon: '▲',
    description: 'Pair exposed cards whose ranks sum to 13 to dismantle the ancient Egyptian pyramid.',
    objective: 'Remove all 28 cards in the pyramid.',
    rules: [
      'Cards are only active if NOT covered by the two cards in the tier below.',
      'Kings equal 13 and are removed with a single tap.',
      'Queen (12) + Ace (1) = 13, Jack (11) + 2 = 13, 10 + 3 = 13, 9 + 4 = 13, 8 + 5 = 13, 7 + 6 = 13.',
      'Stock deals 1 card to waste. Up to 2 redeals.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Overlapping card coverage math corrected. Previously cards were falsely blocked even after both children were removed.',
      'Single-tap pairing and King removal without confusing drag states.'
    ]
  },
  tripeaks: {
    id: 'tripeaks',
    name: 'TriPeaks',
    category: 'pairing',
    difficulty: 'Easy',
    decks: 1,
    redealLimit: 0,
    icon: '🏔',
    description: 'Fast and addictive card puzzle. Clear three peaks by matching cards ±1 rank of the waste card.',
    objective: 'Clear all cards from the three peaks.',
    rules: [
      'Tap any uncovered card that is exactly 1 rank higher or lower than the waste card.',
      'Ace wraps around to King and 2.',
      'Build long streaks for bonus scores!'
    ],
    fixedIssues: [
      'Correct multi-peak overlap geometry for bottom and top tiers.',
      'Continuous King-to-Ace wrapping support.'
    ]
  },
  golf: {
    id: 'golf',
    name: 'Golf',
    category: 'pairing',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 0,
    icon: '⛳',
    description: '7 columns of 5 cards. Clear as many cards as possible onto the waste by building ±1 rank.',
    objective: 'Clear all 35 cards in the 7 columns to achieve a "Hole in One".',
    rules: [
      'Only the top card of each column is available.',
      'Play cards ±1 rank onto the waste pile.',
      'Stock deals 1 card to the waste when no moves remain.'
    ],
    fixedIssues: [
      'Proper rule setting for wrapping King to Ace.',
      'Accurate golf scoring (negative score = under par!).'
    ]
  },
  yukon: {
    id: 'yukon',
    name: 'Yukon',
    category: 'builders',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 0,
    icon: '🌲',
    description: 'Exciting open-building game where any face-up stack can be moved regardless of order!',
    objective: 'Move all 52 cards to the foundations in suit from Ace to King.',
    rules: [
      'Tableau builds down in alternating colors.',
      'CRITICAL RULE: Any face-up card in a column—and ALL cards resting on it—can be moved together, regardless of sequence!',
      'Only Kings can be placed in empty spaces.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Most Solitaire engines break Yukon by forcing dragged stacks to be sequentially ordered. Here, any face-up group moves freely!'
    ]
  },
  russian: {
    id: 'russian',
    name: 'Russian Solitaire',
    category: 'builders',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: 0,
    icon: '❄',
    description: 'A punishingly strategic Yukon variant where building must be in the SAME suit!',
    objective: 'Move all cards to foundations by building down in same suit on the tableau.',
    rules: [
      'Tableau builds down in the SAME SUIT (e.g. Spade 6 on Spade 7).',
      'Like Yukon, any face-up card and all cards on top of it can be moved together.',
      'Kings fill empty tableau spaces.'
    ],
    fixedIssues: [
      'Fixed suit comparison logic to require identical suit for builds.',
      'Unsequenced stack moving fully enabled.'
    ]
  },
  scorpion: {
    id: 'scorpion',
    name: 'Scorpion',
    category: 'builders',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: 0,
    icon: '🦂',
    description: 'Build complete same-suit sequences from King down to Ace directly in the tableau.',
    objective: 'Form 4 completed same-suit runs from King to Ace in the tableau.',
    rules: [
      'Tableau builds down in the SAME SUIT.',
      'Any face-up card and all cards on top of it move together.',
      'Kings fill empty tableau spaces.',
      'A reserve of 3 cards can be dealt onto the first 3 columns at any time.'
    ],
    fixedIssues: [
      '3-card reserve deal logic correctly distributes onto columns 1, 2, 3.',
      'In-tableau K-A run completion automatically flips the next card.'
    ]
  },
  fortythieves: {
    id: 'fortythieves',
    name: 'Forty Thieves',
    category: 'builders',
    difficulty: 'Expert',
    decks: 2,
    redealLimit: 0,
    icon: '⚔',
    description: 'Also known as Napoleon at Saint Helena. 2 decks, 10 columns, single-card moves, strict in-suit building.',
    objective: 'Move all 104 cards to 8 foundations from Ace to King by suit.',
    rules: [
      '10 tableau columns of 4 face-up cards.',
      'Tableau builds down in the SAME SUIT.',
      'Strict rule: Only 1 card may be moved at a time (or sequences allowed by empty tableau spots).',
      'Empty spaces can be filled by any card.',
      'Stock deals 1 card at a time to waste with NO redeals.'
    ],
    fixedIssues: [
      'Multi-deck ID collision fixed (supports full 104 distinct cards).',
      'Single card strictness and empty-space sequence mover calculator.'
    ]
  },
  canfield: {
    id: 'canfield',
    name: 'Canfield',
    category: 'builders',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: -1,
    icon: '🎰',
    description: 'Casino favorite with a 13-card Demon reserve and floating starting foundation rank with King-Ace wrap.',
    objective: 'Build all 4 foundations up in suit, wrapping King to Ace, starting from the dealt base rank.',
    rules: [
      '13 cards dealt to Reserve (Demon). Top card is available.',
      '1 card dealt to foundation establishes the BASE RANK for all 4 foundations.',
      'Foundations build UP in suit, wrapping King to Ace (e.g. if base is 7: 7, 8... K, A, 2... 6).',
      'Tableau builds DOWN in alternating colors, also wrapping Ace on King.',
      'Empty tableau columns are automatically refilled from the Reserve!'
    ],
    fixedIssues: [
      'CRITICAL FIX: Variable foundation base rank and rank modulo wrap-around (K -> A -> 2) fully implemented.',
      'Automatic instant refill from Demon reserve to empty tableau columns.'
    ]
  },
  bakersgame: {
    id: 'bakersgame',
    name: 'Baker\'s Game',
    category: 'builders',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: 0,
    icon: '🥖',
    description: 'The historic predecessor to FreeCell created by C.L. Baker. Builds down in the SAME suit.',
    objective: 'Move all cards to the 4 foundations using 4 freecells, building down in same suit.',
    rules: [
      'Identical layout to FreeCell with 4 freecells.',
      'Tableau builds down in the SAME SUIT (much tougher than FreeCell!).',
      'Supermove formula applies.'
    ],
    fixedIssues: [
      'Correct same-suit validation for Baker\'s Game tableau rules.'
    ]
  },
  eightoff: {
    id: 'eightoff',
    name: 'Eight Off',
    category: 'builders',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: 0,
    icon: '8️⃣',
    description: '8 reserve cells (4 pre-dealt), build down in same suit, only Kings may fill empty tableau spaces.',
    objective: 'Move all cards to foundations from Ace to King by suit.',
    rules: [
      '8 reserve cells. 4 cards dealt to cells at start.',
      'Tableau builds down in the SAME SUIT.',
      'Empty tableau columns can ONLY be filled by Kings.'
    ],
    fixedIssues: [
      'Pre-seeded freecells and King-only empty column restriction enforced.'
    ]
  },
  seahaven: {
    id: 'seahaven',
    name: 'Seahaven Towers',
    category: 'builders',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 0,
    icon: '🏰',
    description: '10 columns of 5 cards with 4 reserve cells. Build down in suit, only Kings fill empty columns.',
    objective: 'Clear all cards to foundations.',
    rules: [
      '10 tableau columns of 5 cards each. 2 cards dealt to reserve cells.',
      'Build down in the SAME SUIT.',
      'Only Kings can move to empty tableau columns.'
    ],
    fixedIssues: [
      'Initial 2-cell seeding and 10-column layout responsiveness.'
    ]
  },
  acesup: {
    id: 'acesup',
    name: 'Aces Up (Idiot\'s Delight)',
    category: 'specialty',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: 0,
    icon: '🅰',
    description: 'Deal 4 cards at a time. If two top cards share a suit, discard the lower one. End with only Aces!',
    objective: 'Discard 48 cards, leaving only the 4 Aces at the top of the columns.',
    rules: [
      'Deal 4 cards from stock onto the 4 columns.',
      'If two or more columns have top cards of the SAME suit, the lower rank cards can be discarded (Ace is HIGH!).',
      'Any top card can be moved to an empty column.',
      'Repeat until all cards are dealt.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Cross-column suit comparison logic and Ace-high rank evaluation.',
      'Empty column slot relocation for strategic maneuvering.'
    ]
  },
  montecarlo: {
    id: 'montecarlo',
    name: 'Monte Carlo',
    category: 'pairing',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 0,
    icon: '🎲',
    description: '5x5 grid of 25 cards. Pair matching ranks that touch horizontally, vertically, or diagonally!',
    objective: 'Clear the entire deck by eliminating adjacent matching pairs.',
    rules: [
      'Tap two cards of the same rank that are adjacent (horizontally, vertically, or diagonally).',
      'When all pairs are cleared, tap "Consolidate" to slide remaining cards left & up and refill from stock.',
      'Repeat until no cards remain.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Complete 8-directional neighbor detection and grid consolidation shifting algorithm.'
    ]
  },
  gaps: {
    id: 'gaps',
    name: 'Gaps (Montana)',
    category: 'puzzles',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 2,
    icon: '🕳',
    description: '4x13 grid with 4 gaps left by removed Aces. Fill gaps with the next higher card of the same suit!',
    objective: 'Arrange all cards into 4 rows in suit from 2 to King.',
    rules: [
      'Deal all 52 cards into 4 rows of 13. Remove the 4 Aces to create 4 gaps.',
      'A gap can be filled by the card that is of the SAME SUIT and ONE RANK HIGHER than the card to its left.',
      'Column 1 gaps (left edge) can be filled by any 2.',
      'A gap after a King CANNOT be filled (dead end).',
      '2 redeals: preserves in-sequence cards from 2, reshuffles the rest.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Gap position coordinate indexing, dead-end King detection, and in-sequence preservation redeal.'
    ]
  },
  clock: {
    id: 'clock',
    name: 'Clock Solitaire',
    category: 'puzzles',
    difficulty: 'Easy',
    decks: 1,
    redealLimit: 0,
    icon: '⏰',
    description: '12 clock piles + center 13th pile. Reveal cards and tuck them under their matching clock hour pile!',
    objective: 'Reveal all 52 cards before the 4th King is uncovered in the center pile.',
    rules: [
      '12 piles around a clock face (Ace=1, 2=2... Queen=12), plus 13th pile (Kings) in the center.',
      'Start by turning the top card of the center pile.',
      'Place it face-up under the clock pile corresponding to its rank.',
      'Turn the top face-down card of that pile and repeat!',
      'Features both manual tap-to-place and Auto-Play modes.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Circular clock face layout coordinates and smooth step-by-step automatic clock traversal.'
    ]
  },
  grandfather: {
    id: 'grandfather',
    name: 'Grandfather\'s Clock',
    category: 'puzzles',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 0,
    icon: '🕰',
    description: '12 clock foundations pre-set with specific cards. Build each pile up in suit to its clock hour!',
    objective: 'Build each foundation up in suit until its top card matches its clock hour rank.',
    rules: [
      '12 foundations arranged like a clock face, pre-dealt with target ranks:',
      '12=9, 1=10, 2=J, 3=Q, 4=K, 5=2, 6=3, 7=4, 8=5, 9=6, 10=7, 11=8.',
      'Foundations build UP in suit, wrapping King to Ace, until the top card matches the hour number (e.g. 12 o\'clock finishes on Queen=12).',
      '8 tableau columns build down in alternating colors.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Precise starting clock card seeds and wrap-around hour termination checks.'
    ]
  },
  osmosis: {
    id: 'osmosis',
    name: 'Osmosis (Treasure Trove)',
    category: 'puzzles',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: -1,
    icon: '🌊',
    description: 'Fascinating foundation hierarchy. Subsequent rows can only accept cards if that rank was played in the row above!',
    objective: 'Move all 52 cards onto the 4 foundation rows.',
    rules: [
      '4 foundation rows of different suits.',
      'Row 1 can accept any card of its suit in any rank order.',
      'CRITICAL RULE: Rows 2, 3, and 4 can ONLY accept a card of their suit IF that card\'s rank has ALREADY been played in the foundation row directly above it!',
      'Tableau consists of 4 reserve piles of 4 cards.',
      'Stock deals 3 cards to waste with unlimited passes.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Inter-row rank dependency logic! Generic solitaire engines completely fail this rule.'
    ]
  },
  castle: {
    id: 'castle',
    name: 'Beleaguered Castle',
    category: 'specialty',
    difficulty: 'Hard',
    decks: 1,
    redealLimit: 0,
    icon: '🏰',
    description: 'Aces start in center foundations. 8 wings of 6 cards each build down regardless of suit.',
    objective: 'Build all 4 center foundations up in suit from Ace to King.',
    rules: [
      '4 Aces start in the center foundations.',
      '8 wing tableau columns (4 left, 4 right) with 6 cards each.',
      'Tableau builds down REGARDLESS of suit.',
      'Only the top card of each column can be moved.',
      'Empty tableau spaces can be filled by any card.'
    ],
    fixedIssues: [
      'True split-wing dual column layout and any-suit build validation.'
    ]
  },
  bristol: {
    id: 'bristol',
    name: 'Bristol',
    category: 'specialty',
    difficulty: 'Medium',
    decks: 1,
    redealLimit: 0,
    icon: '⛵',
    description: '8 fans of 3 cards building down any suit. Stock deals 1 card to 3 reserve waste piles together.',
    objective: 'Move all cards to the 4 foundations regardless of suit in tableau.',
    rules: [
      '8 tableau fans of 3 cards each. Build down regardless of suit.',
      'Kings CANNOT be moved to empty tableau spaces.',
      'Stock deals 1 card to each of the 3 waste piles simultaneously.'
    ],
    fixedIssues: [
      'Simultaneous 3-waste deal and King space restriction.'
    ]
  },
  calculation: {
    id: 'calculation',
    name: 'Calculation',
    category: 'specialty',
    difficulty: 'Expert',
    decks: 1,
    redealLimit: 0,
    icon: '🧮',
    description: 'Mathematical foundations building by step intervals: +1, +2, +3, +4 modulo 13. Suits do not matter!',
    objective: 'Build all 4 foundations to Kings using mathematical arithmetic progressions.',
    rules: [
      'Foundations start with A, 2, 3, 4. Suits are ignored!',
      'Pile 1 builds by +1: A, 2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K.',
      'Pile 2 builds by +2: 2, 4, 6, 8, 10, Q, A, 3, 5, 7, 9, K.',
      'Pile 3 builds by +3: 3, 6, 9, Q, 2, 5, 8, J, A, 4, 7, 10, K.',
      'Pile 4 builds by +4: 4, 8, Q, 3, 7, J, 2, 6, 10, A, 5, 9, K.',
      'Stock cards can be placed onto any of the 4 waste piles. Only top waste card is playable.'
    ],
    fixedIssues: [
      'CRITICAL FIX: Mathematical step-progression foundation validation table.'
    ]
  }
};
