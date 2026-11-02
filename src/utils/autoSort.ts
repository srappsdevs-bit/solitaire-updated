import { SolitaireState, isValidMove } from '../games/engine';
import { Card } from '../types/solitaire';

export interface AutoSortStep {
  type: 'foundation_single' | 'spider_foundation' | 'spider_sequence_connect';
  source: {
    type: 'tableau' | 'waste' | 'freecell' | 'reserve';
    colIndex: number;
    cardIndex: number;
  };
  target: {
    type: 'foundation' | 'tableau';
    index: number;
  };
  cards: Card[];
  description: string;
}

/**
 * Checks if there is any eligible card or sequence that can currently be auto-sorted into foundations
 */
export function hasEligibleSortMoves(state: SolitaireState): boolean {
  return findNextSortStep(state) !== null;
}

/**
 * Finds the single best next auto-sort move for the current state.
 * Prioritizes lowest rank cards first so foundations build evenly and sequentially.
 */
export function findNextSortStep(state: SolitaireState): AutoSortStep | null {
  const { gameId, tableau, foundations, waste, freecells, reserve } = state;

  // 1. SPIDER (spider1, spider2, spider4)
  if (gameId === 'spider1' || gameId === 'spider2' || gameId === 'spider4') {
    // Check for completed 13-card King-to-Ace sequence in the same suit
    for (let c = 0; c < tableau.length; c++) {
      const col = tableau[c];
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
            const emptyFoundIdx = foundations.findIndex(f => f.length === 0);
            return {
              type: 'spider_foundation',
              source: { type: 'tableau', colIndex: c, cardIndex: col.length - 13 },
              target: { type: 'foundation', index: emptyFoundIdx !== -1 ? emptyFoundIdx : 0 },
              cards: top13,
              description: `Auto-sorted completed ${top13[0].suit} King-to-Ace sequence into foundation`,
            };
          }
        }
      }
    }

    // Check for in-suit sequence connection that extends or completes a sequence
    for (let srcColIdx = 0; srcColIdx < tableau.length; srcColIdx++) {
      const srcCol = tableau[srcColIdx];
      if (srcCol.length === 0) continue;

      // Find longest face-up same-suit sequence at the bottom of srcCol
      let seqStart = srcCol.length - 1;
      while (
        seqStart > 0 &&
        srcCol[seqStart - 1].faceUp &&
        srcCol[seqStart - 1].suit === srcCol[seqStart].suit &&
        srcCol[seqStart - 1].rank === srcCol[seqStart].rank + 1
      ) {
        seqStart--;
      }

      const movingSeq = srcCol.slice(seqStart);
      const leadCard = movingSeq[0];

      // Check if another column has leadCard.rank + 1 of the EXACT same suit
      for (let tgtColIdx = 0; tgtColIdx < tableau.length; tgtColIdx++) {
        if (tgtColIdx === srcColIdx) continue;
        const tgtCol = tableau[tgtColIdx];
        if (tgtCol.length === 0) continue;

        const targetCard = tgtCol[tgtCol.length - 1];
        if (targetCard.faceUp && targetCard.suit === leadCard.suit && targetCard.rank === leadCard.rank + 1) {
          const isOffSuitBase = seqStart > 0 && srcCol[seqStart - 1].faceUp && srcCol[seqStart - 1].suit !== leadCard.suit;
          const uncoversFaceDown = seqStart > 0 && !srcCol[seqStart - 1].faceUp;
          if (uncoversFaceDown || isOffSuitBase || movingSeq.length + tgtCol.length >= 13) {
            return {
              type: 'spider_sequence_connect',
              source: { type: 'tableau', colIndex: srcColIdx, cardIndex: seqStart },
              target: { type: 'tableau', index: tgtColIdx },
              cards: movingSeq,
              description: `Organized ${leadCard.suit} sequence onto ${targetCard.suit} ${targetCard.rank}`,
            };
          }
        }
      }
    }

    return null;
  }

  // 2. KLONDIKE & OTHER FOUNDATION-BUILDING GAMES
  // Find all possible moves from tableau, waste, freecell, and reserve to foundations
  const candidates: {
    card: Card;
    source: { type: 'tableau' | 'waste' | 'freecell' | 'reserve'; colIndex: number; cardIndex: number };
    foundationIdx: number;
    score: number;
  }[] = [];

  // A. Check tableau columns (exposed bottom cards)
  for (let c = 0; c < tableau.length; c++) {
    const col = tableau[c];
    if (col.length > 0) {
      const card = col[col.length - 1];
      for (let f = 0; f < foundations.length; f++) {
        if (isValidMove(state, [card], { type: 'foundation', index: f })) {
          candidates.push({
            card,
            source: { type: 'tableau', colIndex: c, cardIndex: col.length - 1 },
            foundationIdx: f,
            score: card.rank, // Lower ranks first (Aces, 2s, 3s...)
          });
          break;
        }
      }
    }
  }

  // B. Check waste top card
  if (waste && waste.length > 0) {
    const card = waste[waste.length - 1];
    for (let f = 0; f < foundations.length; f++) {
      if (isValidMove(state, [card], { type: 'foundation', index: f })) {
        candidates.push({
          card,
          source: { type: 'waste', colIndex: 0, cardIndex: waste.length - 1 },
          foundationIdx: f,
          score: card.rank,
        });
        break;
      }
    }
  }

  // C. Check freecells
  if (freecells && freecells.length > 0) {
    for (let i = 0; i < freecells.length; i++) {
      const card = freecells[i];
      if (card) {
        for (let f = 0; f < foundations.length; f++) {
          if (isValidMove(state, [card], { type: 'foundation', index: f })) {
            candidates.push({
              card,
              source: { type: 'freecell', colIndex: i, cardIndex: 0 },
              foundationIdx: f,
              score: card.rank,
            });
            break;
          }
        }
      }
    }
  }

  // D. Check reserve top card
  if (reserve && reserve.length > 0) {
    const card = reserve[reserve.length - 1];
    for (let f = 0; f < foundations.length; f++) {
      if (isValidMove(state, [card], { type: 'foundation', index: f })) {
        candidates.push({
          card,
          source: { type: 'reserve', colIndex: 0, cardIndex: reserve.length - 1 },
          foundationIdx: f,
          score: card.rank,
        });
        break;
      }
    }
  }

  if (candidates.length === 0) return null;

  // Sort candidates by rank ascending so Aces and low ranks move first (guaranteeing sequence order)
  candidates.sort((a, b) => a.score - b.score);

  const best = candidates[0];
  return {
    type: 'foundation_single',
    source: best.source,
    target: { type: 'foundation', index: best.foundationIdx },
    cards: [best.card],
    description: `Auto-sorted ${best.card.suit} ${best.card.rank} into foundation ${best.foundationIdx + 1}`,
  };
}
