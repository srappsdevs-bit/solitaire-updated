import { Card, ReplayBoardState, ReplayStep } from '../types/solitaire';
import { SolitaireState, createReplaySnapshot } from '../games/engine';
import { getRankSymbol, getSuitSymbol } from './cardUtils';

/**
 * Returns a concise readable label for a card, e.g. "K♠", "10♥", "A♦"
 */
export function formatCardLabel(card: Card | null | undefined): string {
  if (!card) return 'Card';
  return `${getRankSymbol(card.rank)}${getSuitSymbol(card.suit)}`;
}

/**
 * Generates descriptive move text for replay narration
 */
export function describeMove(
  moveType: string,
  details?: {
    card?: Card | null;
    cardsCount?: number;
    sourceType?: string;
    sourceIndex?: number;
    targetType?: string;
    targetIndex?: number;
    extraNote?: string;
  }
): string {
  const cardLabel = details?.card ? formatCardLabel(details.card) : '';
  const count = details?.cardsCount || 1;

  switch (moveType) {
    case 'stock_to_waste':
      return count > 1 ? `Drew ${count} cards from Stock to Waste` : `Turned Stock to Waste (${cardLabel || 'Card'})`;
    case 'stock_to_tableau':
      return `Dealt cards across Tableau columns from Stock`;
    case 'waste_to_tableau':
      return `Played ${cardLabel} from Waste to Tableau Column ${(details?.targetIndex ?? 0) + 1}`;
    case 'waste_to_foundation':
      return `Moved ${cardLabel} from Waste to Foundation Pile ${(details?.targetIndex ?? 0) + 1}`;
    case 'tableau_to_tableau':
      return count > 1
        ? `Transferred sequence of ${count} cards onto Column ${(details?.targetIndex ?? 0) + 1}`
        : `Moved ${cardLabel} to Tableau Column ${(details?.targetIndex ?? 0) + 1}`;
    case 'tableau_to_foundation':
      return `Sent ${cardLabel} to Foundation Pile ${(details?.targetIndex ?? 0) + 1}`;
    case 'freecell_to_tableau':
      return `Moved ${cardLabel} from FreeCell to Tableau Column ${(details?.targetIndex ?? 0) + 1}`;
    case 'freecell_to_foundation':
      return `Sent ${cardLabel} from FreeCell to Foundation ${(details?.targetIndex ?? 0) + 1}`;
    case 'tableau_to_freecell':
      return `Parked ${cardLabel} into FreeCell ${(details?.targetIndex ?? 0) + 1}`;
    case 'pair_removal':
      return details?.extraNote || `Cleared pair: ${cardLabel}`;
    case 'grid_consolidate':
      return `Consolidated 5x5 grid and replenished empty positions`;
    case 'gap_fill':
      return `Placed ${cardLabel} into matching sequence gap`;
    case 'clock_place':
      return `Placed ${cardLabel} into clock hour position`;
    case 'auto_complete':
      return `Auto-Finished ${cardLabel} to Foundations`;
    case 'recycle_stock':
      return `Recycled Waste cards back into Stock pile`;
    case 'deal':
      return 'Initial board deal generated';
    default:
      if (details?.targetType) {
        return `Moved ${cardLabel || 'card'} to ${details.targetType}`;
      }
      return `Move: ${moveType.replace(/_/g, ' ')}`;
  }
}

/**
 * Appends a verified replay step to the game state history
 */
export function recordStateStep(
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
