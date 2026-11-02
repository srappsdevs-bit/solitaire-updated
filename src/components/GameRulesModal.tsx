import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Target,
  Layers,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { GameId, GameCategory } from '../types/solitaire';
import { SOLITAIRE_GAMES } from '../utils/cardUtils';
import { sound } from '../utils/audio';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: GameId;
  onSelectGame?: (id: GameId) => void;
  onOpenTutorial?: () => void;
}

interface GameMechanicInfo {
  building: string;
  moving: string;
  emptySpaces: string;
  foundations: string;
  stockDeal: string;
  difficultyRating: string;
  winRateEstimate: string;
  proTips: string[];
}

const GAME_MECHANICS: Record<GameId, GameMechanicInfo> = {
  klondike: {
    building: 'Alternating colors (Red on Black, Black on Red) in descending rank',
    moving: 'Single cards or any ordered descending sequence in alternating colors',
    emptySpaces: 'Kings only (or sequences starting with a King)',
    foundations: 'Build up in suit from Ace to King (♥ ♦ ♣ ♠)',
    stockDeal: '1 card from stock to waste pile with unlimited passes',
    difficultyRating: 'Casual / Moderate',
    winRateEstimate: '30% - 40%',
    proTips: [
      'Uncover face-down cards before moving cards from the waste pile whenever possible.',
      'Do not rush cards to the foundations if you might need them to hold cards in the tableau.',
      'Prioritize opening an empty column so you can place a King and free up buried columns.'
    ]
  },
  klondike3: {
    building: 'Alternating colors in descending rank',
    moving: 'Single cards or ordered descending sequences in alternating colors',
    emptySpaces: 'Kings only',
    foundations: 'Build up in suit from Ace to King',
    stockDeal: '3 cards at a time to waste pile; only the top waste card is playable',
    difficultyRating: 'Challenging',
    winRateEstimate: '15% - 20%',
    proTips: [
      'Track the pattern of cards in the stock—every pass through the deck reveals different accessible cards.',
      'Playing a card from the waste pile shifts the position of all subsequent cards behind it in the stock.',
      'Create empty spaces early to store Kings and expose unrevealed cards.'
    ]
  },
  freecell: {
    building: 'Alternating colors in descending rank',
    moving: 'Supermove capacity = (1 + Empty FreeCells) × 2^(Empty Tableau Columns)',
    emptySpaces: 'Any card or valid descending sequence can fill empty columns',
    foundations: 'Build up in suit from Ace to King',
    stockDeal: 'None — all 52 cards are dealt face-up into 8 columns at the start',
    difficultyRating: '100% Skill (Solvable)',
    winRateEstimate: '99%+',
    proTips: [
      'Keep your 4 FreeCells open as long as possible; they are your power to move longer sequences.',
      'Clear an entire tableau column early—empty columns double your supermove carrying capacity.',
      'Examine the board before making your first move; virtually every deal has a guaranteed winning solution.'
    ]
  },
  spider1: {
    building: 'Descending rank regardless of suit (all 104 cards are Spades)',
    moving: 'Any descending sequence of cards (e.g. 10-9-8-7)',
    emptySpaces: 'Any card or sequence can be placed in an empty column',
    foundations: 'Full runs of King down to Ace automatically clear from the board',
    stockDeal: '1 card dealt to all 10 columns simultaneously (requires no empty columns)',
    difficultyRating: 'Relaxed / Introductory',
    winRateEstimate: '60% - 75%',
    proTips: [
      'Build long, uninterrupted sequences from King down to Ace in order.',
      'Exhaust every possible tableau move before clicking the stock to deal 10 new cards.',
      'Use empty columns as temporary staging areas to assemble completed runs.'
    ]
  },
  spider2: {
    building: 'Descending rank (Spades and Hearts may be placed on each other)',
    moving: 'CRITICAL: Only cards in the SAME SUIT sequence can be moved together!',
    emptySpaces: 'Any card or valid same-suit sequence can fill an empty space',
    foundations: 'Complete King to Ace runs of the SAME suit clear to foundations',
    stockDeal: 'Deals 1 card to every column',
    difficultyRating: 'Strategic',
    winRateEstimate: '35% - 45%',
    proTips: [
      'Avoid mixing suits in a stack unless you have no other choice—mixed stacks cannot be moved together!',
      'Prioritize uncoupling mixed-suit cards as soon as an opportunity arises.',
      'Uncover face-down cards aggressively to unlock alternate suits.'
    ]
  },
  spider4: {
    building: 'Descending rank across all 4 suits (♠ ♥ ♣ ♦)',
    moving: 'Only same-suit descending sequences can be moved together',
    emptySpaces: 'Any single card or same-suit sequence',
    foundations: '8 completed same-suit runs (King down to Ace) win the game',
    stockDeal: 'Deals 1 card to every column',
    difficultyRating: 'Master / Expert',
    winRateEstimate: '10% - 15%',
    proTips: [
      'Focus on consolidating one suit at a time (e.g. dedicate columns to pure Spades or pure Hearts).',
      'An empty column is your most valuable asset—guard it fiercely and use it to sort entangled cards.',
      'Never deal from the stock until you have exhausted every single reorganization move.'
    ]
  },
  pyramid: {
    building: 'No tableau stacking; 28 cards arranged in a pyramid',
    moving: 'Pair any two uncovered cards whose ranks sum exactly to 13',
    emptySpaces: 'Spaces remain empty as cards are removed',
    foundations: 'Kings (value 13) are removed with 1 tap; pairs go to the discard pile',
    stockDeal: '1 card to waste; up to 2 redeals through the stock',
    difficultyRating: 'Puzzle / Arithmetic',
    winRateEstimate: '20% - 30%',
    proTips: [
      'Tap Kings immediately whenever exposed—they clear instantly without requiring a partner.',
      'Pair values: Q(12)+A(1), J(11)+2, 10+3, 9+4, 8+5, 7+6.',
      'Look at both children overlapping a card before deciding which pair to remove first.'
    ]
  },
  tripeaks: {
    building: 'No tableau cascades; 28 cards across three overlapping peaks',
    moving: 'Tap any uncovered card that is exactly 1 rank higher or lower (±1) than the waste card',
    emptySpaces: 'Peaks remain cleared once cards are captured',
    foundations: 'Ace wraps continuously to King and 2 (e.g. Q-K-A-2-3)',
    stockDeal: 'Draw 1 card to the waste when no moves remain in the peaks',
    difficultyRating: 'Fast-Paced / Addictive',
    winRateEstimate: '50% - 65%',
    proTips: [
      'Plan long consecutive streaks: each additional card in a streak exponentially increases your score!',
      'When you have a choice of equal cards, pick the one that uncovers the most buried cards.',
      'Use the continuous Ace-King wrap to reverse direction and keep combos alive.'
    ]
  },
  golf: {
    building: '7 columns of 5 cards dealt face up; only top card of each column is active',
    moving: 'Move cards from column tops to the waste pile if exactly ±1 in rank',
    emptySpaces: 'Columns remain empty when depleted; no cards can be moved into them',
    foundations: 'Cards stack onto the single waste discard pile',
    stockDeal: 'Deals 1 card to waste; no redeals',
    difficultyRating: 'Tactical Pairing',
    winRateEstimate: '25% - 35%',
    proTips: [
      'Scan all 7 visible column tops before selecting your first card to find the longest sequence chain.',
      'Try to balance column heights—leaving one tall column with no matching cards hurts your endgame.',
      'Clearing all 35 cards achieves the elusive Hole-in-One!'
    ]
  },
  yukon: {
    building: 'Alternating colors in descending rank',
    moving: 'CRITICAL RULE: ANY face-up card and ALL cards resting on it can be moved together regardless of order!',
    emptySpaces: 'Kings only (or stacks with a King at the base)',
    foundations: 'Build up in suit from Ace to King',
    stockDeal: 'None — all 52 cards are on the board at the beginning',
    difficultyRating: 'Strategic Freedom',
    winRateEstimate: '30% - 40%',
    proTips: [
      'Take advantage of the loose grouping rule: move deep cards to free face-down cards even if the stack is messy.',
      'Always focus on flipping face-down cards over keeping neat runs.',
      'Kings into empty columns give you the anchors needed to unravel chaos.'
    ]
  },
  russian: {
    building: 'CRITICAL: Build down in the SAME SUIT (e.g. ♠7 on ♠8)',
    moving: 'Any face-up card and all cards on top of it can be moved together',
    emptySpaces: 'Kings only',
    foundations: 'Build up in suit from Ace to King',
    stockDeal: 'None — all cards dealt into tableau',
    difficultyRating: 'Punishing / Expert',
    winRateEstimate: '5% - 10%',
    proTips: [
      'Because builds must be in the same suit, every move is critical and irreversible.',
      'Map out where Kings will go before moving cards that open an empty column.',
      'Protect suit integrity and don\'t bury a needed card unless it immediately exposes a face-down card.'
    ]
  },
  scorpion: {
    building: 'Build down in the SAME SUIT directly within the tableau',
    moving: 'Any face-up card and all cards resting on it can be moved together',
    emptySpaces: 'Kings only',
    foundations: 'Completed runs from King down to Ace in same suit are completed on tableau',
    stockDeal: '3 reserve cards dealt to columns 1-3 when ready',
    difficultyRating: 'Expert / Tactical',
    winRateEstimate: '10% - 15%',
    proTips: [
      'Uncover the 12 face-down cards in the first four columns as fast as humanly possible.',
      'Do not click the 3 reserve cards until you have completely exhausted all possible board moves.',
      'Keep an empty column ready for a King before moving cards away.'
    ]
  },
  fortythieves: {
    building: 'Build down in the SAME SUIT across 10 columns',
    moving: 'Single cards only! Multi-card sequences cannot be moved together',
    emptySpaces: 'Any card can fill an empty column',
    foundations: '8 foundations (2 full decks) build up in suit from Ace to King',
    stockDeal: '1 card from stock to waste; NO redeals',
    difficultyRating: 'Legendary / Hardcore',
    winRateEstimate: '8% - 12%',
    proTips: [
      'Since you can only move single cards, empty columns act as vital temporary storage cells.',
      'Avoid placing a card on the tableau if it blocks a lower card of the same suit.',
      'Scan the waste pile carefully before dealing the next card from the stock.'
    ]
  },
  canfield: {
    building: 'Alternating colors in descending rank (King wraps to Ace)',
    moving: 'Single cards or ordered sequences in alternating colors',
    emptySpaces: 'Automatically refilled from the 13-card Reserve pile (then player choice)',
    foundations: 'Foundations start on a randomly dealt base rank and wrap K to A',
    stockDeal: 'Deals 3 cards to waste; unlimited redeals',
    difficultyRating: 'Classic Casino',
    winRateEstimate: '20% - 30%',
    proTips: [
      'Your primary objective is exhausting the 13-card reserve pile.',
      'All 4 foundations must start with the same rank as the first dealt foundation card.',
      'Keep tableau columns active so reserve cards can immediately slide into play.'
    ]
  },
  bakersgame: {
    building: 'CRITICAL: Build down in the SAME SUIT (unlike FreeCell\'s alternating colors)',
    moving: 'Supermove formula applies based on free cells and empty columns',
    emptySpaces: 'Any card can fill an empty column',
    foundations: 'Build up in suit from Ace to King',
    stockDeal: 'None — full open deal',
    difficultyRating: 'Strict / High Strategy',
    winRateEstimate: '75% - 85%',
    proTips: [
      'Same-suit building makes this much tighter than standard FreeCell.',
      'Guard your free reserve cells with extreme discipline.',
      'Only place cards into reserve cells if you know the exact exit sequence to retrieve them.'
    ]
  },
  eightoff: {
    building: 'Build down in the SAME SUIT',
    moving: 'Single cards only (or supermove supported by empty reserve cells)',
    emptySpaces: 'KINGS ONLY can fill an empty tableau column!',
    foundations: 'Build up in suit from Ace to King',
    stockDeal: 'None — 8 reserve cells (4 start filled, 4 empty)',
    difficultyRating: 'Demanding Puzzle',
    winRateEstimate: '25% - 35%',
    proTips: [
      'Never clear an empty column unless you have a King ready to occupy it immediately.',
      'Use the 8 reserve cells to temporarily hold obstructing cards while sorting in-suit cascades.',
      'Advance Aces to foundations the moment they are accessible.'
    ]
  },
  seahaven: {
    building: 'Build down in the SAME SUIT',
    moving: 'Single cards only across 10 columns of 5 cards',
    emptySpaces: 'KINGS ONLY can fill an empty column!',
    foundations: 'Build up in suit from Ace to King',
    stockDeal: 'None — 4 reserve cells (2 start filled, 2 empty)',
    difficultyRating: 'Expert Analytical',
    winRateEstimate: '20% - 30%',
    proTips: [
      'Analyze the entire board before making your first move.',
      'Since only Kings can enter empty columns, don\'t empty a column without a King on hand.',
      'Conserve your two empty reserve cells for critical untangling maneuvers.'
    ]
  },
  acesup: {
    building: 'No tableau cascades; 4 columns dealt 4 cards at a time',
    moving: 'Discard any top card if another top card shares the SAME SUIT and has a HIGHER RANK',
    emptySpaces: 'Any top card can be moved into an empty column',
    foundations: 'Discard pile collects all removed cards; final goal is only 4 Aces remaining',
    stockDeal: 'Deals 4 cards (1 to each column) when no more discards are available',
    difficultyRating: 'Fast-Paced Elimination',
    winRateEstimate: '10% - 15%',
    proTips: [
      'Aces are high! An Ace eliminates any other card of the same suit.',
      'Always use empty columns to move cards that are blocking matching suit eliminations.',
      'Never deal another round of 4 cards until all possible discards and moves have been made.'
    ]
  },
  montecarlo: {
    building: '5x5 grid of 25 cards with no stacking',
    moving: 'Pair and remove any two cards of the SAME RANK that are adjacent (horizontal, vertical, diagonal)',
    emptySpaces: 'Consolidate button shifts remaining cards left and up, dealing fresh cards from stock',
    foundations: 'Pairs are sent to the discard pile',
    stockDeal: 'Consolidate grid refills empty spots from stock',
    difficultyRating: 'Visual Match / Spatial',
    winRateEstimate: '35% - 45%',
    proTips: [
      'Check diagonals! Players often miss diagonal pairs that could clear the board.',
      'When multiple pairs of the same rank are available, choose the pair that brings other matching cards closer together.',
      'Consolidate only when zero adjacent pairs remain on the board.'
    ]
  },
  gaps: {
    building: '4 rows of 13 cards; Aces removed to leave 4 open gaps',
    moving: 'Fill a gap with the card of the SAME SUIT that is +1 RANK higher than the card to its left',
    emptySpaces: 'If gap is in column 1 (far left), only a 2 of any suit can be placed there',
    foundations: 'Rows 1-4 arranged from 2 through King by suit',
    stockDeal: 'Reshuffle / Redeal up to 2 times for unplaced cards',
    difficultyRating: 'Addictive Spatial Puzzle',
    winRateEstimate: '20% - 30%',
    proTips: [
      'Never leave a gap immediately to the right of a King—Kings have rank 13, so no card can ever fill that gap!',
      'Fill column 1 with 2s as quickly as possible to anchor your suit rows.',
      'Delay using your precious redeals until all 4 gaps are blocked behind Kings.'
    ]
  },
  clock: {
    building: '12 hour piles around the clock dial + 1 King pile in center',
    moving: 'Turn over center card, place it face-up under its matching hour pile, turn over that pile\'s card',
    emptySpaces: 'Piles are fixed at the 12 clock positions (1:00=Ace, 11:00=Jack, 12:00=Queen, Center=King)',
    foundations: 'Clock face piles accumulate 4 cards each',
    stockDeal: 'Pure automated clockwork loop triggered by tapping the next card',
    difficultyRating: 'Pure Fate / Relaxing',
    winRateEstimate: '1% (1 in 100 odds)',
    proTips: [
      'Hour locations: 1:00=Ace, 2:00=2, 3:00=3, ..., 10:00=10, 11:00=Jack, 12:00=Queen.',
      'If the 4th King is placed in the center before all 12 hours are completed, the game ends.',
      'Sit back and enjoy the hypnotic, kinetic mechanical flow of the clockwork deal!'
    ]
  },
  grandfather: {
    building: '8 tableau columns building down regardless of suit (single cards only)',
    moving: 'Move top tableau cards to matching clock foundations',
    emptySpaces: 'Any card can fill an empty column',
    foundations: '12 clock foundations start with fixed base cards and build in suit to their hour target',
    stockDeal: '2 redeals through the stock',
    difficultyRating: 'Intricate Clock Puzzle',
    winRateEstimate: '25% - 35%',
    proTips: [
      'Check the target cards on the clock face foundations to see where each suit is heading.',
      'Keep single cards moving downward in the tableau to reveal lower cards.',
      'Plan moves so that foundations are fed evenly around the clock.'
    ]
  },
  osmosis: {
    building: '4 tableau reserve columns of 4 cards (top card active)',
    moving: 'Move cards from tableau or waste to the 4 foundations',
    emptySpaces: 'Refilled from stock',
    foundations: 'Foundations build in suit, but require the foundation above to already contain that rank!',
    stockDeal: 'Deals 3 cards from stock to waste; unlimited redeals',
    difficultyRating: 'Fascinating Flow Logic',
    winRateEstimate: '20% - 30%',
    proTips: [
      'The top foundation dictates the pace—any card of its suit can be placed on it.',
      'A card can only be played to foundations 2, 3, or 4 if a card of the SAME RANK is already in the row above.',
      'Watch for unlock chains where placing one card on Foundation 1 unlocks moves across rows 2, 3, and 4.'
    ]
  },
  castle: {
    building: '8 tableau wings (4 left, 4 right) building down regardless of suit',
    moving: 'Single cards only can be moved between wings or to center foundations',
    emptySpaces: 'Any card can fill an empty wing',
    foundations: '4 center foundations start with Aces and build up in suit to Kings',
    stockDeal: 'None — all 52 cards are face-up in the wings',
    difficultyRating: 'Castle Siege Strategy',
    winRateEstimate: '30% - 40%',
    proTips: [
      'Creating an empty wing is your top tactical priority—it serves as an invaluable free cell.',
      'Work inward from the outer wing edges toward the center foundations.',
      'Consolidate ranks on the wings to expose trapped low cards.'
    ]
  },
  bristol: {
    building: '8 columns building down regardless of suit (single cards only)',
    moving: 'Single cards only; King cannot be played on Ace',
    emptySpaces: 'CANNOT be filled! Empty columns remain vacant for the rest of the game',
    foundations: '4 foundations build up in suit from Ace to King',
    stockDeal: 'Deals 3 cards simultaneously to 3 waste piles',
    difficultyRating: 'Precision Planning',
    winRateEstimate: '15% - 25%',
    proTips: [
      'Never miss an opportunity to promote an Ace or low card into the foundations.',
      'Because empty columns cannot be filled, do not rely on them as storage spaces.',
      'Distribute your stock deals across the 3 waste piles without burying urgent ranks.'
    ]
  },
  calculation: {
    building: '4 waste piles; any card can be placed on any waste pile with zero restrictions',
    moving: 'Only the top card of each waste pile can be moved to foundations',
    emptySpaces: 'Waste piles can hold unlimited cards in any order',
    foundations: 'Foundation 1 (+1): A-2-3-4... Foundation 2 (+2): 2-4-6-8... Foundation 3 (+3): 3-6-9-Q... Foundation 4 (+4): 4-8-Q-3...',
    stockDeal: '1 card from stock at a time; no redeals',
    difficultyRating: 'Master Mathematical Solitaire',
    winRateEstimate: '65% - 80% (Pure Skill)',
    proTips: [
      'Calculation is 100% skill: memorize the four arithmetic progressions (+1, +2, +3, +4).',
      'Designate waste piles for specific rank categories (e.g. reserve one pile for Kings, which are always played last).',
      'Stack cards in descending mathematical order on waste piles so they peel off in sequence.'
    ]
  }
};

export const GameRulesModal: React.FC<GameRulesModalProps> = ({
  isOpen,
  onClose,
  gameId,
  onSelectGame,
  onOpenTutorial
}) => {
  const [selectedGameId, setSelectedGameId] = useState<GameId>(gameId);
  const [activeTab, setActiveTab] = useState<'rules' | 'strategy'>('rules');

  // Keep local selection synced when opened
  useEffect(() => {
    setSelectedGameId(gameId);
    setActiveTab('rules');
  }, [gameId, isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const game = SOLITAIRE_GAMES[selectedGameId] || SOLITAIRE_GAMES.klondike;
  const mechanics = GAME_MECHANICS[selectedGameId] || GAME_MECHANICS.klondike;
  const isCurrentGame = selectedGameId === gameId;

  const redealText =
    game.redealLimit === -1
      ? 'Unlimited Redeals'
      : game.redealLimit === 0
      ? 'No Redeals'
      : `${game.redealLimit} Redeal${game.redealLimit > 1 ? 's' : ''}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 text-xl font-bold shadow-inner">
              {game.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="rules-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {game.name} Rules
                </h2>
                {isCurrentGame ? (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    Active Game
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    Preview
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="capitalize">{game.category}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{game.difficulty}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{game.decks} {game.decks === 1 ? 'Deck' : 'Decks'}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{redealText}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Game Switcher Dropdown */}
            <select
              value={selectedGameId}
              onChange={(e) => {
                setSelectedGameId(e.target.value as GameId);
                sound.playCardFlip();
              }}
              className="bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 cursor-pointer"
              title="Switch to view rules for another variant"
            >
              {Object.values(SOLITAIRE_GAMES).map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900 text-slate-200">
                  {g.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => {
                sound.playCardFlip();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              aria-label="Close rules overlay"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Sub-Header (Rules vs Strategy) */}
        <div className="flex items-center justify-between px-5 py-2 bg-slate-950/60 border-b border-slate-800/80">
          <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'rules'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Rules & Mechanics</span>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                activeTab === 'strategy'
                  ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Strategy & Tips</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span>Win Rate: <strong className="text-amber-300 font-mono">{mechanics.winRateEstimate}</strong></span>
            <span aria-hidden="true" className="text-slate-700">|</span>
            <span>Skill Level: <strong className="text-slate-200">{mechanics.difficultyRating}</strong></span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {/* Main Objective Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Primary Goal
              </div>
              <p className="text-sm font-medium text-slate-100 mt-0.5 leading-snug">
                {game.objective}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {game.description}
              </p>
            </div>
          </div>

          {activeTab === 'rules' ? (
            <>
              {/* Mechanics Breakdown Matrix */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>How Cards Work in {game.name}</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {/* Tableau Stacking */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Tableau Building
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {mechanics.building}
                    </p>
                  </div>

                  {/* Card Moving Capacity */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Moving Cards
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {mechanics.moving}
                    </p>
                  </div>

                  {/* Empty Spaces */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Empty Columns / Spaces
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {mechanics.emptySpaces}
                    </p>
                  </div>

                  {/* Foundations / Targets */}
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Foundations & Scoring
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {mechanics.foundations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complete Rules Checklist */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Specific Game Rules</span>
                </h3>
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl divide-y divide-slate-800/60">
                  {game.rules.map((rule, idx) => (
                    <div key={idx} className="p-3 flex items-start gap-2.5 text-xs">
                      <span className="font-mono text-amber-400/80 font-bold mt-0.5">
                        {idx + 1}.
                      </span>
                      <span className="text-slate-200 leading-relaxed">
                        {rule}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Engine Quirks / Engine Accuracy Note */}
              {game.fixedIssues && game.fixedIssues.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-800 text-[11px]">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <span>Engine Rules Compliance</span>
                  </div>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside">
                    {game.fixedIssues.map((issue, idx) => (
                      <li key={idx} className="leading-normal">{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Strategy & Tips Tab */
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pro Strategies for {game.name}</span>
                </h3>
                <div className="space-y-2.5">
                  {mechanics.proTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Solitaire Best Practices */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs space-y-2">
                <div className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span>Universal Master Principles</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-400 text-[11px]">
                  <div>
                    <strong className="text-slate-300">Look Before You Leap:</strong> Check whether playing to a foundation blocks a card you might need for column sequences later.
                  </div>
                  <div>
                    <strong className="text-slate-300">Open Columns are Gold:</strong> Empty columns give you the leeway to re-order cascades and expose hidden cards.
                  </div>
                  <div>
                    <strong className="text-slate-300">Undo & Experiment:</strong> Don't hesitate to test sequence orders—undo is available with no penalty!
                  </div>
                  <div>
                    <strong className="text-slate-300">Pacing:</strong> In games with stock redeals, track the cards in the stock to plan ahead.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-t border-slate-800 gap-2 flex-wrap">
          {/* Klondike Interactive Tutorial CTA if applicable */}
          {onOpenTutorial && (selectedGameId === 'klondike' || selectedGameId === 'klondike3') ? (
            <button
              onClick={() => {
                onClose();
                onOpenTutorial();
              }}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/30 text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>Interactive Step-by-Step Tutorial</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700 font-mono text-[10px]">ESC</kbd> to return to table
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {!isCurrentGame && onSelectGame && (
              <button
                onClick={() => {
                  onSelectGame(selectedGameId);
                  onClose();
                }}
                className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold active:scale-95 transition-all cursor-pointer border border-slate-700"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Play {game.name}</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playCardFlip();
                onClose();
              }}
              className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold active:scale-95 transition-all shadow-md cursor-pointer"
            >
              <span>Got It, Back to Game</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
