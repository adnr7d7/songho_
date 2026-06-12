/**
 * GAME ENGINE FOR SONGo CHAMPIONSHIP (Songo Rules)
 * 14 pits total:
 * Bottom row (South): indices 0 to 6 representing S7, S6, S5, S4, S3, S2, S1.
 * Top row (North): indices 7 to 13 representing N1, N2, N3, N4, N5, N6, N7.
 *
 * Loop direction (Counter-Clockwise):
 * 0 (S7) -> 1 (S6) -> 2 (S5) -> 3 (S4) -> 4 (S3) -> 5 (S2) -> 6 (S1)
 * -> 7 (N1) -> 8 (N2) -> 9 (N3) -> 10 (N4) -> 11 (N5) -> 12 (N6) -> 13 (N7)
 * -> loop back to 0 (S7)
 */

export type PlayerSide = 'SUD' | 'NORD';

export interface GameState {
  board: number[]; // size 14
  scoreNord: number;
  scoreSud: number;
  activePlayer: PlayerSide;
  history: string[];
  winner: PlayerSide | 'NUL' | null;
  statusMessage: string;
}

export const INITIAL_SEEDS = 5;

export function createInitialState(): GameState {
  return {
    board: Array(14).fill(INITIAL_SEEDS),
    scoreNord: 0,
    scoreSud: 0,
    activePlayer: 'SUD', // South traditionally starts
    history: ['Début de la partie - 70 graines sur le plateau.'],
    winner: null,
    statusMessage: "C'est au tour du Joueur SUD. Choisissez une case.",
  };
}

/**
 * Checks if a player's camp is completely empty.
 */
export function isCampEmpty(board: number[], player: PlayerSide): boolean {
  const startIdx = player === 'SUD' ? 0 : 7;
  const endIdx = player === 'SUD' ? 6 : 13;
  for (let i = startIdx; i <= endIdx; i++) {
    if (board[i] > 0) return false;
  }
  return true;
}

/**
 * Calculates the landing path for sowing seeds from a pit.
 * Returns the exact order of indexes sowed.
 */
export function getSowingPath(startPit: number, seedCount: number): number[] {
  const path: number[] = [];
  let curr = startPit;
  for (let s = 1; s <= seedCount; s++) {
    curr = (curr + 1) % 14;
    // Rule: Do not deposit back into the origin pit if we loop a full circle
    if (curr === startPit) {
      curr = (curr + 1) % 14;
    }
    path.push(curr);
  }
  return path;
}

/**
 * Checks if a specific move feeds an empty opponent.
 */
export function movesFeedsOpponent(board: number[], startPit: number, player: PlayerSide): boolean {
  const seeds = board[startPit];
  if (seeds === 0) return false;
  const path = getSowingPath(startPit, seeds);
  const oppMin = player === 'SUD' ? 7 : 0;
  const oppMax = player === 'SUD' ? 13 : 6;
  return path.some((idx) => idx >= oppMin && idx <= oppMax);
}

/**
 * Finds all valid move indices for the active player.
 */
export function getValidMoves(board: number[], player: PlayerSide): number[] {
  const startIdx = player === 'SUD' ? 0 : 7;
  const endIdx = player === 'SUD' ? 6 : 13;
  const moves: number[] = [];

  // 1. Gather any pits with seeds
  for (let i = startIdx; i <= endIdx; i++) {
    if (board[i] > 0) {
      moves.push(i);
    }
  }

  // 2. Solidarity Rule: If opponent camp is empty, we MUST choose a move that feeds them
  const opponent = player === 'SUD' ? 'NORD' : 'SUD';
  if (isCampEmpty(board, opponent)) {
    const feedingMoves = moves.filter((m) => movesFeedsOpponent(board, m, player));
    if (feedingMoves.length > 0) {
      return feedingMoves;
    }
  }

  return moves;
}

/**
 * Helper to check if a pit index belongs to high-level game restrictions or is a general pit.
 * S1: rightmost for South is index 6 (first opponent node for North)
 * N1: rightmost for North is index 7 (first opponent node for South)
 * S7: leftmost for South is index 0 (case 7)
 * N7: leftmost for North is index 13 (case 7)
 */
export function getSpecialPitInfo(idx: number) {
  return {
    isSouth: idx >= 0 && idx <= 6,
    isNorth: idx >= 7 && idx <= 13,
    isFirstOpponentForSouth: idx === 7, // N1
    isFirstOpponentForNorth: idx === 6, // S1
    isCase7South: idx === 0, // S7
    isCase7North: idx === 13, // N7
  };
}

/**
 * Performs a move and yields the updated board, captures, and move logging info.
 */
export function performMove(
  gameState: GameState,
  startPit: number
): {
  success: boolean;
  nextState: GameState;
  sowingPath: number[];
  capturedPits: number[];
  capturedSeedsCount: number;
} {
  const player = gameState.activePlayer;
  const opponent = player === 'SUD' ? 'NORD' : 'SUD';

  // Validate the move belongs to active player
  const startIdx = player === 'SUD' ? 0 : 7;
  const endIdx = player === 'SUD' ? 6 : 13;
  if (startPit < startIdx || startPit > endIdx) {
    return { success: false, nextState: gameState, sowingPath: [], capturedPits: [], capturedSeedsCount: 0 };
  }

  const validMoves = getValidMoves(gameState.board, player);
  if (!validMoves.includes(startPit)) {
    return { success: false, nextState: gameState, sowingPath: [], capturedPits: [], capturedSeedsCount: 0 };
  }

  // Clone board and values
  const board = [...gameState.board];
  const seeds = board[startPit];
  board[startPit] = 0;

  // Sowing
  const path = getSowingPath(startPit, seeds);
  path.forEach((idx) => {
    board[idx]++;
  });

  // Calculate potential captures
  // Captures occur at the end pit and previous pits sowed (going backwards)
  // as long as they are in the opponent territory and contain 2, 3, or 4 seeds.
  let capturedPits: number[] = [];
  let capturedSeedsCount = 0;

  const opponentMin = opponent === 'SUD' ? 0 : 7;
  const opponentMax = opponent === 'SUD' ? 6 : 13;

  // Trace backwards along the path
  for (let p = path.length - 1; p >= 0; p--) {
    const pitIdx = path[p];

    // Check if opponent pit
    if (pitIdx >= opponentMin && pitIdx <= opponentMax) {
      const g = board[pitIdx];
      if (g === 2 || g === 3 || g === 4) {
        // Exclude index if it is Case 7 (traditional protection)
        const isOpponentCase7 = (player === 'SUD' && pitIdx === 13) || (player === 'NORD' && pitIdx === 0);
        if (isOpponentCase7) {
          // Rule: Case 7 cannot be captured, skip or stop
          // Under typical Cameroonian Songo rules, case 7 is skipped or stops the chain. We stop the backtrack here.
          break;
        }

        capturedPits.push(pitIdx);
      } else {
        // Chain is broken
        break;
      }
    } else {
      // Out of opponent's yard, stop backtracking
      break;
    }
  }

  // Handle "Première case adverse ne peut être capturée seule"
  const firstOpponentPit = player === 'SUD' ? 7 : 6; // N1 for South, S1 for North
  if (capturedPits.length === 1 && capturedPits[0] === firstOpponentPit) {
    // Cannot capture the first opponent pit ALONE!
    capturedPits = [];
  }

  // Anti-Famine: Check if this capture completely empties the opponent's camp
  if (capturedPits.length > 0) {
    // Clone board to simulate capture
    const testBoard = [...board];
    capturedPits.forEach((idx) => {
      testBoard[idx] = 0;
    });

    const oppEmptyAfterCapture = isCampEmpty(testBoard, opponent);
    if (oppEmptyAfterCapture) {
      // Canceled to prevent starving the opponent
      capturedPits = [];
    }
  }

  // Commit captures
  if (capturedPits.length > 0) {
    capturedPits.forEach((idx) => {
      capturedSeedsCount += board[idx];
      board[idx] = 0;
    });
  }

  // Adjust scores
  let scoreNord = gameState.scoreNord;
  let scoreSud = gameState.scoreSud;
  if (player === 'SUD') {
    scoreSud += capturedSeedsCount;
  } else {
    scoreNord += capturedSeedsCount;
  }

  // Switch turn
  const nextPlayer = opponent;

  // Describe move
  const labelStart = player === 'SUD' ? `S${7 - startPit}` : `N${startPit - 6}`;
  let mDescription = `Tour ${gameState.history.length}: ${player} joue ${labelStart}`;
  if (capturedSeedsCount > 0) {
    mDescription += ` / Capture de ${capturedSeedsCount} graines (${capturedPits.map(idx => player === 'SUD' ? `N${idx - 6}` : `S${7 - idx}`).join(', ')})`;
  }

  // Check Game End Condition
  let winner: PlayerSide | 'NUL' | null = null;
  let statusMessage = `C'est au tour du Joueur ${nextPlayer}.`;

  const totalBoardSeeds = board.reduce((a, b) => a + b, 0);

  if (scoreSud >= 40) {
    winner = 'SUD';
    statusMessage = 'Le Joueur SUD triomphe avec 40 graines ou plus ! Victoire !';
  } else if (scoreNord >= 40) {
    winner = 'NORD';
    statusMessage = 'Le Joueur NORD triomphe avec 40 graines ou plus ! Victoire !';
  } else if (totalBoardSeeds < 10) {
    // Less than 10 seeds left, game automatically stops. Winner is the one with highest score
    // or we distribute remaining to the side where they reside then choose winner.
    const remainingSud = board.slice(0, 7).reduce((a, b) => a + b, 0);
    const remainingNord = board.slice(7, 14).reduce((a, b) => a + b, 0);

    const finalSud = scoreSud + remainingSud;
    const finalNord = scoreNord + remainingNord;

    if (finalSud > finalNord) {
      winner = 'SUD';
      statusMessage = `Moins de 10 graines restantes. SUD gagne au score total : ${finalSud} - ${finalNord}`;
    } else if (finalNord > finalSud) {
      winner = 'NORD';
      statusMessage = `Moins de 10 graines restantes. NORD gagne au score total : ${finalNord} - ${finalSud}`;
    } else {
      winner = 'NUL';
      statusMessage = `Moins de 10 graines restantes. Match Nul : ${finalSud} partout !`;
    }
  } else {
    // Test if next player has any valid moves (solidarity / empty check)
    const nextValid = getValidMoves(board, nextPlayer);
    if (nextValid.length === 0) {
      // Solidarity impossible! Game ends. Remaining seeds go to the active player.
      const remainingOpp = board.reduce((a, b) => a + b, 0);
      if (nextPlayer === 'SUD') {
        scoreNord += remainingOpp;
      } else {
        scoreSud += remainingOpp;
      }

      if (scoreSud > scoreNord) {
        winner = 'SUD';
        statusMessage = `Solidarité impossible pour ${nextPlayer}. SUD gagne au score final : ${scoreSud} - ${scoreNord}`;
      } else if (scoreNord > scoreSud) {
        winner = 'NORD';
        statusMessage = `Solidarité impossible pour ${nextPlayer}. NORD gagne au score final : ${scoreNord} - ${scoreSud}`;
      } else {
        winner = 'NUL';
        statusMessage = `Solidarité impossible pour ${nextPlayer}. Match Nul : ${scoreSud} partout !`;
      }
    }
  }

  const nextState: GameState = {
    board,
    scoreNord,
    scoreSud,
    activePlayer: nextPlayer,
    history: [...gameState.history, mDescription],
    winner,
    statusMessage,
  };

  return {
    success: true,
    nextState,
    sowingPath: path,
    capturedPits,
    capturedSeedsCount,
  };
}

/**
 * Advanced Strategic Songo Solver using MiniMax with Alpha Beta Pruning.
 */
export function evaluateBoard(board: number[], scoreNord: number, scoreSud: number, side: PlayerSide): number {
  // Simple evaluation function
  let score = 0;

  // 1. Scoring advantage
  const scoreDiff = scoreSud - scoreNord;
  score += scoreDiff * 10;

  // 2. Control over pits / security (excluding easy capture threats on own yard)
  // Check pits that are vulnerable to opponent landing capture
  // Pits with 1, 2, or 3 seeds can easily become 2, 3, 4 seeds
  let vulnerabilitiesSud = 0;
  let vulnerabilitiesNord = 0;

  for (let i = 0; i < 7; i++) {
    const s = board[i];
    if (s > 0 && s < 4) vulnerabilitiesSud++;
  }
  for (let i = 7; i < 14; i++) {
    const s = board[i];
    if (s > 0 && s < 4) vulnerabilitiesNord++;
  }

  score += (vulnerabilitiesNord - vulnerabilitiesSud) * 2;

  // Case 7 values (Case 7 is highly strategic in Songo)
  score += board[0] * 1.5; // S7 (South Case 7)
  score -= board[13] * 1.5; // N7 (North Case 7)

  // Seed density
  const totalSud = board.slice(0, 7).reduce((a, b) => a + b, 0);
  const totalNord = board.slice(7, 14).reduce((a, b) => a + b, 0);
  score += (totalSud - totalNord) * 0.5;

  return side === 'SUD' ? score : -score;
}

export function minimax(
  gameState: GameState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  side: PlayerSide
): { score: number; bestMove: number | null } {
  // Base cases
  if (depth === 0 || gameState.winner !== null) {
    return {
      score: evaluateBoard(gameState.board, gameState.scoreNord, gameState.scoreSud, side),
      bestMove: null,
    };
  }

  const validMoves = getValidMoves(gameState.board, gameState.activePlayer);
  if (validMoves.length === 0) {
    return {
      score: evaluateBoard(gameState.board, gameState.scoreNord, gameState.scoreSud, side),
      bestMove: null,
    };
  }

  let bestMove: number | null = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      const outcome = performMove(gameState, move);
      if (outcome.success) {
        const evaluation = minimax(outcome.nextState, depth - 1, alpha, beta, false, side).score;
        if (evaluation > maxEval) {
          maxEval = evaluation;
          bestMove = move;
        }
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      const outcome = performMove(gameState, move);
      if (outcome.success) {
        const evaluation = minimax(outcome.nextState, depth - 1, alpha, beta, true, side).score;
        if (evaluation < minEval) {
          minEval = evaluation;
          bestMove = move;
        }
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
    }
    return { score: minEval, bestMove };
  }
}

/**
 * Returns the recommended best move for a player.
 */
export function getRecommendedMove(gameState: GameState, difficulty: 'FACILE' | 'MOYEN' | 'DIFFICILE' | 'EXPERT'): number {
  const validMoves = getValidMoves(gameState.board, gameState.activePlayer);
  if (validMoves.length === 0) return -1;

  if (difficulty === 'FACILE') {
    // Pick a random move
    const val = validMoves[Math.floor(Math.random() * validMoves.length)];
    return val;
  }

  // Determine MiniMax Depth
  let depth = 2;
  if (difficulty === 'MOYEN') depth = 3;
  if (difficulty === 'DIFFICILE') depth = 5;
  if (difficulty === 'EXPERT') depth = 7;

  const result = minimax(gameState, depth, -Infinity, Infinity, true, gameState.activePlayer);
  if (result.bestMove !== null && validMoves.includes(result.bestMove)) {
    return result.bestMove;
  }
  return validMoves[0];
}
