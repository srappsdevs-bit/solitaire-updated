import { GameId, DifficultyLevel } from '../types/solitaire';
import { SolitaireState } from '../games/engine';

export const AUTO_SAVE_STORAGE_KEY = 'solitaire_saved_game_v1';

export interface AutoSavedGame {
  version: number;
  gameId: GameId;
  difficultyLevel: DifficultyLevel;
  state: SolitaireState;
  isDailyChallengeActive: boolean;
  dailyChallengeDate: string;
  undoUsedInGame: boolean;
  hintUsedInGame: boolean;
  savedAt: number;
}

/**
 * Validates that the loaded data structure contains all essential properties
 * for a valid in-progress Solitaire game, guarding against corrupted data or legacy schemas.
 */
export function isValidSavedGame(data: any): data is AutoSavedGame {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== 1) return false;
  if (typeof data.gameId !== 'string') return false;
  if (!data.state || typeof data.state !== 'object') return false;

  const s = data.state;
  // If game is marked won, it should not be resumed
  if (s.isWon === true) return false;

  // Verify essential board array structures
  if (!Array.isArray(s.tableau)) return false;
  if (!Array.isArray(s.foundations)) return false;
  if (!Array.isArray(s.stock)) return false;
  if (!Array.isArray(s.waste)) return false;

  // Verify required scalar game properties
  if (typeof s.moves !== 'number' || s.moves < 0) return false;
  if (typeof s.elapsedTime !== 'number' || s.elapsedTime < 0) return false;
  if (typeof s.score !== 'number') return false;
  if (!Array.isArray(s.history)) return false;

  return true;
}

/**
 * Persists the current game session to localStorage.
 * Automatically clears the save file if the game is completed/won.
 */
export function saveCurrentGame(gameData: {
  gameId: GameId;
  difficultyLevel?: DifficultyLevel;
  state: SolitaireState;
  isDailyChallengeActive: boolean;
  dailyChallengeDate: string;
  undoUsedInGame: boolean;
  hintUsedInGame: boolean;
}): void {
  try {
    // If game is won, ensure auto-save is cleared so reopening the app starts fresh
    if (gameData.state.isWon) {
      clearAutoSavedGame();
      return;
    }

    const currentDifficulty: DifficultyLevel =
      gameData.difficultyLevel ||
      gameData.state.difficultyLevel ||
      'easy';

    const payload: AutoSavedGame = {
      version: 1,
      gameId: gameData.gameId,
      difficultyLevel: currentDifficulty,
      state: {
        ...gameData.state,
        difficultyLevel: currentDifficulty,
        // Reset transient interaction states so player doesn't restore into a dragging state
        selectedCardId: null,
        selectedStack: null,
      },
      isDailyChallengeActive: !!gameData.isDailyChallengeActive,
      dailyChallengeDate: gameData.dailyChallengeDate || '',
      undoUsedInGame: !!gameData.undoUsedInGame,
      hintUsedInGame: !!gameData.hintUsedInGame,
      savedAt: Date.now(),
    };

    localStorage.setItem(AUTO_SAVE_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[AutoSave] Could not save current game to localStorage:', err);
  }
}

/**
 * Loads and validates any auto-saved game from localStorage.
 * Returns null if no save exists or if data fails validation.
 */
export function loadAutoSavedGame(): AutoSavedGame | null {
  try {
    const raw = localStorage.getItem(AUTO_SAVE_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isValidSavedGame(parsed)) {
      clearAutoSavedGame();
      return null;
    }

    // Reset any temporary selection artifacts
    parsed.state.selectedCardId = null;
    parsed.state.selectedStack = null;

    // Normalize difficulty level to guarantee consistent resumption
    const difficultyLevel = parsed.difficultyLevel || parsed.state?.difficultyLevel || 'easy';
    parsed.difficultyLevel = difficultyLevel;
    if (parsed.state) {
      parsed.state.difficultyLevel = difficultyLevel;
    }

    return parsed;
  } catch (err) {
    console.warn('[AutoSave] Error parsing saved game:', err);
    clearAutoSavedGame();
    return null;
  }
}

/**
 * Removes the saved game from localStorage.
 */
export function clearAutoSavedGame(): void {
  try {
    localStorage.removeItem(AUTO_SAVE_STORAGE_KEY);
  } catch (err) {
    console.warn('[AutoSave] Error clearing saved game:', err);
  }
}

/**
 * Check if a valid in-progress game is currently stored.
 */
export function hasAutoSavedGame(): boolean {
  return loadAutoSavedGame() !== null;
}
