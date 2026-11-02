export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';

export interface Card {
  id: string;            // unique identifier (e.g. "h-1-0" for Ace of Hearts, deck 0)
  suit: Suit;
  rank: number;          // 1 (Ace) to 13 (King)
  faceUp: boolean;
  deckIndex?: number;    // 0 or 1 for multi-deck games
  extra?: Record<string, any>;
}

export type GameCategory = 
  | 'classic'      // Klondike, FreeCell
  | 'spider'       // Spider 1, 2, 4 Suits
  | 'builders'     // Yukon, Russian, Scorpion, Forty Thieves, Canfield, Baker's Game, Eight Off, Seahaven
  | 'pairing'      // Pyramid, TriPeaks, Golf, Monte Carlo
  | 'puzzles'      // Gaps, Clock, Grandfather's Clock, Osmosis
  | 'specialty';   // Aces Up, Beleaguered Castle, Bristol, Calculation

export type GameId =
  | 'klondike'
  | 'klondike3'
  | 'freecell'
  | 'spider1'
  | 'spider2'
  | 'spider4'
  | 'pyramid'
  | 'tripeaks'
  | 'golf'
  | 'yukon'
  | 'russian'
  | 'scorpion'
  | 'fortythieves'
  | 'canfield'
  | 'bakersgame'
  | 'eightoff'
  | 'seahaven'
  | 'acesup'
  | 'montecarlo'
  | 'gaps'
  | 'clock'
  | 'grandfather'
  | 'osmosis'
  | 'castle'
  | 'bristol'
  | 'calculation';

export interface GameDefinition {
  id: GameId;
  name: string;
  category: GameCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  decks: number;
  description: string;
  rules: string[];
  fixedIssues: string[]; // Details of bugs fixed in this variant
  objective: string;
  redealLimit: number; // -1 for unlimited, 0 for none, or specific number
  icon: string;
}

export type TableTheme = 'emerald' | 'burgundy' | 'sapphire' | 'obsidian';
export type CardBackStyle = 'classic-red' | 'royal-blue' | 'emerald-dragon' | 'celestial-gold' | 'cyber-black';
export type CardFaceStyle = 'classic' | 'modern' | 'vintage' | 'cyber';

export interface GameStats {
  played: number;
  won: number;
  bestTime: number | null; // in seconds
  bestMoves: number | null;
  highScore: number;
  streak: number;
}

export type AudioPackId = 'modern' | 'vintage' | 'minimalist';
export type LandscapeLayoutMode = 'auto' | 'split' | 'side-left' | 'top';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type HapticIntensity = 'low' | 'medium' | 'high';
export type CardAnimationStyle = 'slide' | 'fade' | 'snap';

export interface PlayerSettings {
  difficultyLevel: DifficultyLevel;
  soundEnabled: boolean;
  audioPack: AudioPackId;
  landscapeLayout?: LandscapeLayoutMode;
  hapticsEnabled: boolean;
  hapticIntensity?: HapticIntensity;
  tableTheme: TableTheme;
  cardBack: CardBackStyle;
  cardFace?: CardFaceStyle;
  cardAnimation?: CardAnimationStyle;
  autoMoveOnTap: boolean;
  showHintsHighlight: boolean;
  showValidDropTargets: boolean;
  fastAnimations: boolean;
  relaxedRules: boolean; // e.g. wrap King in Golf, deal onto empty columns in Spider
  showGameInfoOverlay?: boolean; // Compact semi-transparent live win-probability & efficiency overlay
  soundVolume?: number; // 0.0 to 1.0 master sound effect volume
}

export type MoveType = 
  | 'tableau_to_tableau'
  | 'tableau_to_foundation'
  | 'waste_to_tableau'
  | 'waste_to_foundation'
  | 'stock_to_waste'
  | 'stock_to_tableau'
  | 'freecell_to_tableau'
  | 'freecell_to_foundation'
  | 'tableau_to_freecell'
  | 'reserve_to_tableau'
  | 'reserve_to_foundation'
  | 'pair_removal'
  | 'grid_consolidate'
  | 'gap_fill'
  | 'clock_place'
  | 'auto_sort'
  | 'undo'
  | 'redo';

export interface MoveRecord {
  type: MoveType;
  description?: string;
  timestamp: number;
  cardsCount: number;
  scoreChange: number;
  previousStateSnapshot: string; // JSON serialized state
  nextStateSnapshot?: string; // JSON serialized state after move was performed (for redo)
}

export interface ReplayBoardState {
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  freecells: (Card | null)[];
  reserve: Card[];
  grid: (Card | null)[][];
  clockPositions?: { hour: number; targetRank: number; cards: Card[] }[];
  score: number;
  moves: number;
  redealsLeft?: number;
}

export interface ReplayStep {
  stepNumber: number;
  description: string;
  moveType: string;
  state: ReplayBoardState;
  timestamp: number;
}

export interface DailyChallengeConfig {
  date: string; // YYYY-MM-DD
  gameId: GameId;
  seed: number;
  title: string;
  crownEarned?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerName: string;
  country: string;
  countryFlag: string;
  avatar: string;
  score: number;
  timeSeconds: number;
  moves: number;
  isPlayer?: boolean;
}

export interface PlayerProfile {
  name: string;
  country: string;
  countryFlag: string;
  avatar: string;
  totalCrowns: number;
  currentStreak: number;
  highestStreak: number;
  completedDates: Record<string, { won: boolean; score: number; time: number; moves: number; rank?: number }>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'general' | 'speed' | 'skill' | 'streaks' | 'variety';
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  rewardPoints: number;
}

export interface DailyStreakInfo {
  currentStreak: number;
  highestStreak: number;
  isCompletedToday: boolean;
  isCompletedYesterday: boolean;
  lastCompletedDate: string | null;
  streakActive: boolean;
}


