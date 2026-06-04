import { useCallback, useEffect, useReducer } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────────── */

export type Board = number[][]; // 4×4; 0 = empty cell

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  board: Board;
  score: number;
  status: GameStatus;
}

export type Direction = 'left' | 'right' | 'up' | 'down';

/* ── Pure helpers ────────────────────────────────────────────────────────────── */

/** Create a fresh 4×4 board filled with zeros. */
function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

/** Deep-clone a board. */
function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

/**
 * Slide a single row leftward, merging equal adjacent tiles.
 * Each tile participates in at most one merge per call.
 * Returns the resulting row and the score delta.
 */
export function slideRow(row: number[]): { row: number[]; score: number } {
  // 1. Compact: remove zeros
  const compact = row.filter((v) => v !== 0);

  let score = 0;
  const merged: number[] = [];
  let i = 0;

  // 2. Walk left-to-right, merging equal neighbours
  while (i < compact.length) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      const val = compact[i] * 2;
      merged.push(val);
      score += val;
      i += 2; // skip both source tiles
    } else {
      merged.push(compact[i]);
      i += 1;
    }
  }

  // 3. Pad with zeros on the right to length 4
  while (merged.length < 4) merged.push(0);

  return { row: merged, score };
}

/** Transpose a 4×4 board (swap rows ↔ columns). */
function transpose(board: Board): Board {
  return Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (__, c) => board[c][r]));
}

/** Reverse each row of a board. */
function reverseRows(board: Board): Board {
  return board.map((row) => [...row].reverse());
}

/**
 * Apply a move in the given direction to the board.
 * Returns the new board, total score delta, and whether any cell changed.
 */
export function applyMove(board: Board, direction: Direction): { board: Board; score: number; changed: boolean } {
  let working = cloneBoard(board);

  // Normalise: transform so that every direction becomes a "slide left"
  if (direction === 'right') {
    working = reverseRows(working);
  } else if (direction === 'up') {
    working = transpose(working);
  } else if (direction === 'down') {
    working = transpose(working);
    working = reverseRows(working);
  }

  let totalScore = 0;
  const newBoard = working.map((row) => {
    const result = slideRow(row);
    totalScore += result.score;
    return result.row;
  });

  // Un-transform
  let finalBoard = newBoard;
  if (direction === 'right') {
    finalBoard = reverseRows(finalBoard);
  } else if (direction === 'up') {
    finalBoard = transpose(finalBoard);
  } else if (direction === 'down') {
    finalBoard = reverseRows(finalBoard);
    finalBoard = transpose(finalBoard);
  }

  // Value-based change detection
  const changed = finalBoard.some((row, r) => row.some((cell, c) => cell !== board[r][c]));

  return { board: finalBoard, score: totalScore, changed };
}

/**
 * Spawn a new tile (value 2 with 90% probability, 4 with 10%) in a random
 * empty cell. Accepts an optional rand function for deterministic testing.
 * Returns the board unchanged if there are no empty cells.
 */
export function spawnTile(board: Board, rand: () => number = Math.random): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;

  const [r, c] = empty[Math.floor(rand() * empty.length)];
  const value = rand() < 0.9 ? 2 : 4;
  const next = cloneBoard(board);
  next[r][c] = value;
  return next;
}

/** Returns true if any cell contains 2048. */
export function hasWon(board: Board): boolean {
  return board.some((row) => row.includes(2048));
}

/**
 * Returns true when the board is completely full AND no two adjacent cells
 * (horizontally or vertically) share the same value — i.e. no moves remain.
 */
export function isLost(board: Board): boolean {
  // Any empty cell → not lost
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === 0) return false;
    }
  }

  // Any horizontally adjacent equal pair → not lost
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === board[r][c + 1]) return false;
    }
  }

  // Any vertically adjacent equal pair → not lost
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      if (board[r][c] === board[r + 1][c]) return false;
    }
  }

  return true;
}

/* ── Reducer ─────────────────────────────────────────────────────────────────── */

type Action = { type: 'MOVE'; direction: Direction; rand?: () => number } | { type: 'NEW_GAME'; rand?: () => number };

function initialState(rand: () => number = Math.random): GameState {
  let board = emptyBoard();
  board = spawnTile(board, rand);
  board = spawnTile(board, rand);
  return { board, score: 0, status: 'playing' };
}

function reducer(state: GameState, action: Action): GameState {
  if (action.type === 'NEW_GAME') {
    return initialState(action.rand);
  }

  if (action.type === 'MOVE') {
    if (state.status !== 'playing') return state;

    const rand = action.rand ?? Math.random;

    // 1. Apply the move
    const { board: movedBoard, score: scoreDelta, changed } = applyMove(state.board, action.direction);

    // 2. No change → silently ignore
    if (!changed) return state;

    // 3. Win check BEFORE spawning
    if (hasWon(movedBoard)) {
      return {
        board: movedBoard,
        score: state.score + scoreDelta,
        status: 'won',
      };
    }

    // 4. Spawn a new tile
    const boardAfterSpawn = spawnTile(movedBoard, rand);

    // 5. Loss check AFTER spawning
    const status: GameStatus = isLost(boardAfterSpawn) ? 'lost' : 'playing';

    return {
      board: boardAfterSpawn,
      score: state.score + scoreDelta,
      status,
    };
  }

  return state;
}

/* ── Hook ────────────────────────────────────────────────────────────────────── */

interface Use2048Result {
  board: Board;
  score: number;
  status: GameStatus;
  move: (direction: Direction) => void;
  newGame: () => void;
}

export function use2048(rand: () => number = Math.random): Use2048Result {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(rand));

  const move = useCallback(
    (direction: Direction) => {
      dispatch({ type: 'MOVE', direction, rand });
    },
    [rand]
  );

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME', rand });
  }, [rand]);

  // Keyboard listener — only active while playing
  useEffect(() => {
    if (state.status !== 'playing') return;

    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      };
      const direction = map[e.key];
      if (!direction) return;
      e.preventDefault();
      dispatch({ type: 'MOVE', direction, rand });
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.status, rand]);

  return { board: state.board, score: state.score, status: state.status, move, newGame };
}
