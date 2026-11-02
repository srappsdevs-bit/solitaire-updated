import { SolitaireState, isValidMove } from '../games/engine';
import { Card } from '../types/solitaire';

export interface GameMetrics {
  winProbability: number; // 0 to 100
  winProbabilityLabel: string;
  winProbabilityColor: string;
  winProbabilityBg: string;
  moveEfficiency: number; // 0 to 100
  efficiencyGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  efficiencyLabel: string;
  efficiencyColor: string;
  clearedCards: number;
  totalTargetCards: number;
  clearedPercentage: number;
  faceDownCount: number;
  faceUpCount: number;
  emptyColumnsCount: number;
  legalMovesCount: number;
  isStalemate: boolean;
  statusSummary: string;
}

/**
 * Counts total target cards to win the given solitaire variant
 */
function getTargetTotalCards(state: SolitaireState): number {
  switch (state.gameId) {
    case 'spider1':
    case 'spider2':
    case 'spider4':
    case 'fortythieves':
      return 104;
    case 'pyramid':
    case 'tripeaks':
      return 28;
    case 'golf':
      return 35;
    case 'acesup':
      return 48;
    case 'montecarlo':
      return 25;
    case 'gaps':
      return 48;
    case 'clock':
      return 52;
    default:
      return 52;
  }
}

/**
 * Counts currently cleared or foundation-placed cards
 */
function getClearedCardsCount(state: SolitaireState, totalTarget: number): number {
  if (state.isWon) return totalTarget;

  switch (state.gameId) {
    case 'pyramid':
    case 'tripeaks': {
      let cardsInPyramid = 0;
      state.tableau.forEach(row => { cardsInPyramid += row.length; });
      return Math.max(0, totalTarget - cardsInPyramid);
    }
    case 'golf': {
      let cardsInTableau = 0;
      state.tableau.forEach(col => { cardsInTableau += col.length; });
      return Math.max(0, totalTarget - cardsInTableau);
    }
    case 'acesup': {
      return state.foundations[0]?.length || 0;
    }
    case 'spider1':
    case 'spider2':
    case 'spider4': {
      let cleared = 0;
      state.foundations.forEach(f => {
        if (f.length === 13) cleared += 13;
      });
      return cleared;
    }
    case 'gaps': {
      let inOrder = 0;
      if (state.grid) {
        state.grid.forEach(row => {
          let expected = 2;
          for (let c = 0; c < row.length; c++) {
            const card = row[c];
            if (card && card.rank === expected) {
              inOrder++;
              expected++;
            } else {
              break;
            }
          }
        });
      }
      return inOrder;
    }
    case 'montecarlo': {
      return (state.score / 50) * 2;
    }
    default: {
      let count = 0;
      state.foundations.forEach(f => { count += f.length; });
      return count;
    }
  }
}

/**
 * Scans available legal moves currently executable on the board
 */
function countLegalMoves(state: SolitaireState): number {
  if (state.isWon) return 0;
  let moves = 0;

  // 1. Tableau cards to foundations or other tableau columns
  for (let c = 0; c < state.tableau.length; c++) {
    const col = state.tableau[c];
    if (col.length === 0) continue;

    // Check bottom exposed card to foundations
    const topCard = col[col.length - 1];
    if (topCard.faceUp) {
      for (let f = 0; f < state.foundations.length; f++) {
        if (isValidMove(state, [topCard], { type: 'foundation', index: f })) {
          moves++;
          break;
        }
      }
    }

    // Check movable sequences to other tableau columns
    for (let r = 0; r < col.length; r++) {
      const card = col[r];
      if (card.faceUp) {
        const stack = col.slice(r);
        for (let targetCol = 0; targetCol < state.tableau.length; targetCol++) {
          if (targetCol === c) continue;
          if (isValidMove(state, stack, { type: 'tableau', index: targetCol })) {
            moves++;
            break;
          }
        }
      }
    }
  }

  // 2. Waste card to tableau or foundation
  if (state.waste && state.waste.length > 0) {
    const wasteCard = state.waste[state.waste.length - 1];
    for (let f = 0; f < state.foundations.length; f++) {
      if (isValidMove(state, [wasteCard], { type: 'foundation', index: f })) {
        moves++;
        break;
      }
    }
    for (let c = 0; c < state.tableau.length; c++) {
      if (isValidMove(state, [wasteCard], { type: 'tableau', index: c })) {
        moves++;
        break;
      }
    }
  }

  // 3. Freecells to tableau or foundation
  if (state.freecells) {
    state.freecells.forEach(cell => {
      if (cell) {
        for (let f = 0; f < state.foundations.length; f++) {
          if (isValidMove(state, [cell], { type: 'foundation', index: f })) {
            moves++;
            break;
          }
        }
        for (let c = 0; c < state.tableau.length; c++) {
          if (isValidMove(state, [cell], { type: 'tableau', index: c })) {
            moves++;
            break;
          }
        }
      }
    });
  }

  return moves;
}

/**
 * Calculates real-time win probability and move efficiency metrics
 */
export function calculateGameMetrics(state: SolitaireState): GameMetrics {
  const totalTargetCards = getTargetTotalCards(state);
  const clearedCards = Math.min(totalTargetCards, getClearedCardsCount(state, totalTargetCards));
  const clearedPercentage = Math.round((clearedCards / totalTargetCards) * 100);

  // Count face-down and face-up cards
  let faceDownCount = 0;
  let faceUpCount = 0;
  let emptyColumnsCount = 0;

  state.tableau.forEach(col => {
    if (col.length === 0) {
      emptyColumnsCount++;
    } else {
      col.forEach(card => {
        if (card.faceUp) faceUpCount++;
        else faceDownCount++;
      });
    }
  });

  const legalMovesCount = countLegalMoves(state);
  const hasStockOrRedeals = state.stock.length > 0 || state.redealsLeft > 0 || state.redealsLeft === -1;
  const isStalemate = !state.isWon && legalMovesCount === 0 && !hasStockOrRedeals;

  // 1. Calculate Win Probability Estimate
  let winProbability = 0;
  let winProbabilityLabel = 'Balanced';
  let winProbabilityColor = 'text-amber-400';
  let winProbabilityBg = 'bg-amber-400';

  if (state.isWon) {
    winProbability = 100;
    winProbabilityLabel = 'Victory!';
    winProbabilityColor = 'text-emerald-400';
    winProbabilityBg = 'bg-emerald-400';
  } else if (isStalemate) {
    winProbability = 0;
    winProbabilityLabel = 'Stalemate';
    winProbabilityColor = 'text-rose-400';
    winProbabilityBg = 'bg-rose-500';
  } else {
    // Base probability by game type & state
    let base = 50;

    // Foundation progress (up to +45%)
    const progressBonus = (clearedCards / totalTargetCards) * 45;

    // Face-down reduction bonus: fewer hidden cards = clear paths
    const totalTableauCards = faceDownCount + faceUpCount;
    const revealRatio = totalTableauCards > 0 ? (faceUpCount / totalTableauCards) : 1;
    const revealBonus = revealRatio * 15;

    // Open column mobility (each open column gives high flexibility)
    const emptyColBonus = Math.min(15, emptyColumnsCount * 4);

    // Legal move density
    let mobilityFactor = 0;
    if (legalMovesCount >= 6) mobilityFactor = 10;
    else if (legalMovesCount >= 4) mobilityFactor = 6;
    else if (legalMovesCount >= 2) mobilityFactor = 2;
    else if (legalMovesCount === 1) mobilityFactor = -6;
    else if (legalMovesCount === 0 && hasStockOrRedeals) mobilityFactor = -12;

    // Stock reserves safety buffer
    const stockBuffer = state.stock.length > 5 ? 5 : (state.stock.length > 0 ? 2 : 0);

    const raw = base + progressBonus + revealBonus + emptyColBonus + mobilityFactor + stockBuffer;
    winProbability = Math.max(5, Math.min(98, Math.round(raw)));

    if (winProbability >= 80) {
      winProbabilityLabel = 'Very High';
      winProbabilityColor = 'text-emerald-400';
      winProbabilityBg = 'bg-emerald-400';
    } else if (winProbability >= 65) {
      winProbabilityLabel = 'Favorable';
      winProbabilityColor = 'text-teal-400';
      winProbabilityBg = 'bg-teal-400';
    } else if (winProbability >= 48) {
      winProbabilityLabel = 'Balanced';
      winProbabilityColor = 'text-amber-400';
      winProbabilityBg = 'bg-amber-400';
    } else if (winProbability >= 30) {
      winProbabilityLabel = 'Challenging';
      winProbabilityColor = 'text-orange-400';
      winProbabilityBg = 'bg-orange-400';
    } else {
      winProbabilityLabel = 'Low Odds';
      winProbabilityColor = 'text-rose-400';
      winProbabilityBg = 'bg-rose-500';
    }
  }

  // 2. Calculate Move Efficiency
  // Efficiency balances foundation progress and score against moves made
  let moveEfficiency = 100;
  let efficiencyGrade: 'S' | 'A' | 'B' | 'C' | 'D' = 'S';
  let efficiencyLabel = 'Flawless Pace';
  let efficiencyColor = 'text-emerald-400';

  if (state.moves > 0) {
    const productivePoints = clearedCards * 3.5 + faceUpCount * 1.2 + (state.score * 0.05);
    const benchmarkMoves = Math.max(1, state.moves * 0.65);
    const rawEfficiency = Math.round((productivePoints / benchmarkMoves) * 100);
    moveEfficiency = Math.max(15, Math.min(100, rawEfficiency));

    if (moveEfficiency >= 90) {
      efficiencyGrade = 'S';
      efficiencyLabel = 'Masterful';
      efficiencyColor = 'text-emerald-400';
    } else if (moveEfficiency >= 80) {
      efficiencyGrade = 'A';
      efficiencyLabel = 'Excellent';
      efficiencyColor = 'text-teal-400';
    } else if (moveEfficiency >= 68) {
      efficiencyGrade = 'B';
      efficiencyLabel = 'Solid Pace';
      efficiencyColor = 'text-amber-400';
    } else if (moveEfficiency >= 50) {
      efficiencyGrade = 'C';
      efficiencyLabel = 'Moderate';
      efficiencyColor = 'text-orange-400';
    } else {
      efficiencyGrade = 'D';
      efficiencyLabel = 'Low Ratio';
      efficiencyColor = 'text-rose-400';
    }
  }

  // Status summary string for quick scannability
  let statusSummary = `${clearedCards}/${totalTargetCards} Cleared • ${legalMovesCount} Moves Avail`;
  if (state.isWon) statusSummary = 'Game Cleared in ' + state.moves + ' moves';
  else if (isStalemate) statusSummary = 'No moves left • Deal locked';

  return {
    winProbability,
    winProbabilityLabel,
    winProbabilityColor,
    winProbabilityBg,
    moveEfficiency,
    efficiencyGrade,
    efficiencyLabel,
    efficiencyColor,
    clearedCards,
    totalTargetCards,
    clearedPercentage,
    faceDownCount,
    faceUpCount,
    emptyColumnsCount,
    legalMovesCount,
    isStalemate,
    statusSummary,
  };
}
