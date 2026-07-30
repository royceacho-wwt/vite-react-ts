/**
 * useChess – self-contained chess state + CPU AI (minimax + alpha-beta, depth 3).
 *
 * Conventions:
 *   - Board is a 64-element array, index = rank*8 + file  (a8=0 … h1=63)
 *   - White pieces: 'P','R','N','B','Q','K'
 *   - Black pieces: 'p','r','n','b','q','k'
 *   - Empty square: null
 *   - Human plays White, CPU plays Black.
 */

import { useCallback, useEffect, useReducer } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PieceCode = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K' | 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type Square = PieceCode | null;
export type Board = Square[];

export interface Move {
  from: number;
  to: number;
  promotion?: PieceCode; // always 'Q'/'q' for now
}

export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

export interface ChessState {
  board: Board;
  turn: 'w' | 'b';
  selected: number | null;       // index the human has clicked
  legalMoves: Move[];            // legal moves for selected piece
  lastMove: Move | null;
  status: GameStatus;
  scores: { w: number; b: number };
  cpuThinking: boolean;
  castling: { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
  enPassant: number | null;      // target square index
}

// ─── Initial board ────────────────────────────────────────────────────────────

const INIT_BOARD: Board = [
  'r','n','b','q','k','b','n','r',
  'p','p','p','p','p','p','p','p',
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  null,null,null,null,null,null,null,null,
  'P','P','P','P','P','P','P','P',
  'R','N','B','Q','K','B','N','R',
];

function initState(): ChessState {
  return {
    board: [...INIT_BOARD],
    turn: 'w',
    selected: null,
    legalMoves: [],
    lastMove: null,
    status: 'playing',
    scores: { w: 0, b: 0 },
    cpuThinking: false,
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    enPassant: null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isWhite(p: Square): p is PieceCode { return p !== null && p === p.toUpperCase(); }
export function isBlack(p: Square): p is PieceCode { return p !== null && p === p.toLowerCase(); }
export function color(p: Square): 'w' | 'b' | null {
  if (p === null) return null;
  return isWhite(p) ? 'w' : 'b';
}
function rank(idx: number) { return Math.floor(idx / 8); }
function file(idx: number) { return idx % 8; }
function idx(r: number, f: number) { return r * 8 + f; }

// ─── Raw move generation (ignores check) ─────────────────────────────────────

function slidingMoves(
  board: Board, from: number, dirs: [number, number][], side: 'w' | 'b',
): Move[] {
  const moves: Move[] = [];
  for (const [dr, df] of dirs) {
    let r = rank(from) + dr, f2 = file(from) + df;
    while (r >= 0 && r < 8 && f2 >= 0 && f2 < 8) {
      const to = idx(r, f2);
      const target = board[to];
      if (target === null) {
        moves.push({ from, to });
      } else {
        if (color(target) !== side) moves.push({ from, to });
        break;
      }
      r += dr; f2 += df;
    }
  }
  return moves;
}

function pawnMoves(
  board: Board, from: number, side: 'w' | 'b', enPassant: number | null,
): Move[] {
  const moves: Move[] = [];
  const dir = side === 'w' ? -1 : 1;
  const startRank = side === 'w' ? 6 : 1;
  const promRank = side === 'w' ? 0 : 7;
  const r = rank(from), f2 = file(from);

  // one step forward
  const oneStep = idx(r + dir, f2);
  if (r + dir >= 0 && r + dir < 8 && board[oneStep] === null) {
    if (r + dir === promRank) {
      moves.push({ from, to: oneStep, promotion: side === 'w' ? 'Q' : 'q' });
    } else {
      moves.push({ from, to: oneStep });
    }
    // two steps from start
    if (r === startRank) {
      const twoStep = idx(r + 2 * dir, f2);
      if (board[twoStep] === null) moves.push({ from, to: twoStep });
    }
  }

  // captures
  for (const df of [-1, 1]) {
    const nf = f2 + df;
    if (nf < 0 || nf > 7) continue;
    const to = idx(r + dir, nf);
    if (r + dir < 0 || r + dir > 7) continue;
    const target = board[to];
    if (target !== null && color(target) !== side) {
      if (r + dir === promRank) {
        moves.push({ from, to, promotion: side === 'w' ? 'Q' : 'q' });
      } else {
        moves.push({ from, to });
      }
    }
    // en passant
    if (enPassant !== null && to === enPassant) {
      moves.push({ from, to });
    }
  }
  return moves;
}

function knightMoves(board: Board, from: number, side: 'w' | 'b'): Move[] {
  const moves: Move[] = [];
  const offsets: [number, number][] = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, df] of offsets) {
    const nr = rank(from) + dr, nf = file(from) + df;
    if (nr < 0 || nr > 7 || nf < 0 || nf > 7) continue;
    const to = idx(nr, nf);
    if (color(board[to]) !== side) moves.push({ from, to });
  }
  return moves;
}

function kingMoves(board: Board, from: number, side: 'w' | 'b'): Move[] {
  const moves: Move[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let df = -1; df <= 1; df++) {
      if (dr === 0 && df === 0) continue;
      const nr = rank(from) + dr, nf = file(from) + df;
      if (nr < 0 || nr > 7 || nf < 0 || nf > 7) continue;
      const to = idx(nr, nf);
      if (color(board[to]) !== side) moves.push({ from, to });
    }
  }
  return moves;
}

type Castling = ChessState['castling'];

function castlingMoves(
  board: Board, side: 'w' | 'b', castling: Castling,
): Move[] {
  const moves: Move[] = [];
  if (side === 'w') {
    const kingIdx = 60;
    if (castling.wK && board[61] === null && board[62] === null) {
      moves.push({ from: kingIdx, to: 62 });
    }
    if (castling.wQ && board[59] === null && board[58] === null && board[57] === null) {
      moves.push({ from: kingIdx, to: 58 });
    }
  } else {
    const kingIdx = 4;
    if (castling.bK && board[5] === null && board[6] === null) {
      moves.push({ from: kingIdx, to: 6 });
    }
    if (castling.bQ && board[3] === null && board[2] === null && board[1] === null) {
      moves.push({ from: kingIdx, to: 2 });
    }
  }
  return moves;
}

function rawMoves(
  board: Board, from: number, side: 'w' | 'b',
  castling: Castling, enPassant: number | null,
): Move[] {
  const piece = board[from];
  if (!piece) return [];
  const p = piece.toUpperCase();
  switch (p) {
    case 'P': return pawnMoves(board, from, side, enPassant);
    case 'N': return knightMoves(board, from, side);
    case 'B': return slidingMoves(board, from, [[-1,-1],[-1,1],[1,-1],[1,1]], side);
    case 'R': return slidingMoves(board, from, [[-1,0],[1,0],[0,-1],[0,1]], side);
    case 'Q': return slidingMoves(board, from, [[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]], side);
    case 'K': return [...kingMoves(board, from, side), ...castlingMoves(board, side, castling)];
    default: return [];
  }
}

// ─── Check detection ──────────────────────────────────────────────────────────

function isSquareAttacked(board: Board, sq: number, bySide: 'w' | 'b'): boolean {
  // Use raw moves of a dummy king on sq to detect attacks
  const dummyCastling: Castling = { wK: false, wQ: false, bK: false, bQ: false };
  const oppSide: 'w' | 'b' = bySide === 'w' ? 'b' : 'w';
  for (let i = 0; i < 64; i++) {
    if (color(board[i]) !== bySide) continue;
    const moves = rawMoves(board, i, bySide, dummyCastling, null);
    if (moves.some(m => m.to === sq)) return true;
  }
  return false;
}

function findKing(board: Board, side: 'w' | 'b'): number {
  const king = side === 'w' ? 'K' : 'k';
  return board.indexOf(king);
}

function isInCheck(board: Board, side: 'w' | 'b'): boolean {
  const kIdx = findKing(board, side);
  if (kIdx === -1) return false;
  return isSquareAttacked(board, kIdx, side === 'w' ? 'b' : 'w');
}

// ─── Apply move ───────────────────────────────────────────────────────────────

interface ApplyResult {
  board: Board;
  castling: Castling;
  enPassant: number | null;
}

function applyMove(
  board: Board, move: Move, castling: Castling, enPassant: number | null,
): ApplyResult {
  const next = [...board] as Board;
  const piece = next[move.from]!;
  const p = piece.toUpperCase();
  const side = color(piece)!;
  let newCastling = { ...castling };
  let newEnPassant: number | null = null;

  // En passant capture
  if (p === 'P' && move.to === enPassant && enPassant !== null) {
    const capturedPawnIdx = side === 'w' ? enPassant + 8 : enPassant - 8;
    next[capturedPawnIdx] = null;
  }

  // Set en passant target
  if (p === 'P') {
    const dr = rank(move.to) - rank(move.from);
    if (Math.abs(dr) === 2) {
      newEnPassant = idx((rank(move.from) + rank(move.to)) / 2, file(move.from));
    }
  }

  // Castling rook move
  if (p === 'K') {
    const df = file(move.to) - file(move.from);
    if (df === 2) { // kingside
      const rookFrom = side === 'w' ? 63 : 7;
      const rookTo   = side === 'w' ? 61 : 5;
      next[rookTo] = next[rookFrom]; next[rookFrom] = null;
    } else if (df === -2) { // queenside
      const rookFrom = side === 'w' ? 56 : 0;
      const rookTo   = side === 'w' ? 59 : 3;
      next[rookTo] = next[rookFrom]; next[rookFrom] = null;
    }
    if (side === 'w') { newCastling.wK = false; newCastling.wQ = false; }
    else              { newCastling.bK = false; newCastling.bQ = false; }
  }

  // Revoke castling rights on rook moves
  if (move.from === 63 || move.to === 63) newCastling.wK = false;
  if (move.from === 56 || move.to === 56) newCastling.wQ = false;
  if (move.from === 7  || move.to === 7)  newCastling.bK = false;
  if (move.from === 0  || move.to === 0)  newCastling.bQ = false;

  // Move piece
  next[move.to] = move.promotion ?? piece;
  next[move.from] = null;

  return { board: next, castling: newCastling, enPassant: newEnPassant };
}

// ─── Legal move generation ────────────────────────────────────────────────────

function legalMovesForPiece(
  board: Board, from: number, side: 'w' | 'b',
  castling: Castling, enPassant: number | null,
): Move[] {
  const raw = rawMoves(board, from, side, castling, enPassant);
  return raw.filter(move => {
    // Castling: king must not pass through check
    const piece = board[from]!;
    const p = piece.toUpperCase();
    if (p === 'K') {
      const df = file(move.to) - file(move.from);
      if (Math.abs(df) === 2) {
        // King must not be in check currently
        if (isInCheck(board, side)) return false;
        // Intermediate square must not be attacked
        const midSq = idx(rank(move.from), file(move.from) + (df > 0 ? 1 : -1));
        const opp: 'w' | 'b' = side === 'w' ? 'b' : 'w';
        if (isSquareAttacked(board, midSq, opp)) return false;
      }
    }
    const { board: nextBoard } = applyMove(board, move, castling, enPassant);
    return !isInCheck(nextBoard, side);
  });
}

function allLegalMoves(
  board: Board, side: 'w' | 'b', castling: Castling, enPassant: number | null,
): Move[] {
  const moves: Move[] = [];
  for (let i = 0; i < 64; i++) {
    if (color(board[i]) !== side) continue;
    moves.push(...legalMovesForPiece(board, i, side, castling, enPassant));
  }
  return moves;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

const PIECE_VALUE: Record<string, number> = {
  P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000,
};

// Piece-square tables (from black's perspective, mirrored for white)
const PST_PAWN = [
  0,  0,  0,  0,  0,  0,  0,  0,
 50, 50, 50, 50, 50, 50, 50, 50,
 10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
];
const PST_KNIGHT = [
-50,-40,-30,-30,-30,-30,-40,-50,
-40,-20,  0,  0,  0,  0,-20,-40,
-30,  0, 10, 15, 15, 10,  0,-30,
-30,  5, 15, 20, 20, 15,  5,-30,
-30,  0, 15, 20, 20, 15,  0,-30,
-30,  5, 10, 15, 15, 10,  5,-30,
-40,-20,  0,  5,  5,  0,-20,-40,
-50,-40,-30,-30,-30,-30,-40,-50,
];
const PST_BISHOP = [
-20,-10,-10,-10,-10,-10,-10,-20,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  5, 10, 10,  5,  0,-10,
-10,  5,  5, 10, 10,  5,  5,-10,
-10,  0, 10, 10, 10, 10,  0,-10,
-10, 10, 10, 10, 10, 10, 10,-10,
-10,  5,  0,  0,  0,  0,  5,-10,
-20,-10,-10,-10,-10,-10,-10,-20,
];
const PST_ROOK = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0,
];
const PST_QUEEN = [
-20,-10,-10, -5, -5,-10,-10,-20,
-10,  0,  0,  0,  0,  0,  0,-10,
-10,  0,  5,  5,  5,  5,  0,-10,
 -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
-10,  5,  5,  5,  5,  5,  0,-10,
-10,  0,  5,  0,  0,  0,  0,-10,
-20,-10,-10, -5, -5,-10,-10,-20,
];
const PST_KING_MID = [
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-30,-40,-40,-50,-50,-40,-40,-30,
-20,-30,-30,-40,-40,-30,-30,-20,
-10,-20,-20,-20,-20,-20,-20,-10,
 20, 20,  0,  0,  0,  0, 20, 20,
 20, 30, 10,  0,  0, 10, 30, 20,
];

function pst(piece: PieceCode, sq: number): number {
  const p = piece.toUpperCase();
  const isW = isWhite(piece);
  // For white, mirror the rank (PST is from black's perspective top=rank0)
  const tableSq = isW ? (7 - rank(sq)) * 8 + file(sq) : sq;
  switch (p) {
    case 'P': return PST_PAWN[tableSq];
    case 'N': return PST_KNIGHT[tableSq];
    case 'B': return PST_BISHOP[tableSq];
    case 'R': return PST_ROOK[tableSq];
    case 'Q': return PST_QUEEN[tableSq];
    case 'K': return PST_KING_MID[tableSq];
    default: return 0;
  }
}

function evaluate(board: Board): number {
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const p = board[i];
    if (!p) continue;
    const val = PIECE_VALUE[p.toUpperCase()] + pst(p, i);
    score += isWhite(p) ? val : -val;
  }
  return score; // positive = white advantage
}

// ─── Minimax with alpha-beta ──────────────────────────────────────────────────

function minimax(
  board: Board, depth: number, alpha: number, beta: number,
  maximising: boolean, castling: Castling, enPassant: number | null,
): number {
  const side: 'w' | 'b' = maximising ? 'w' : 'b';
  const moves = allLegalMoves(board, side, castling, enPassant);

  if (moves.length === 0) {
    if (isInCheck(board, side)) return maximising ? -100000 : 100000;
    return 0; // stalemate
  }
  if (depth === 0) return evaluate(board);

  if (maximising) {
    let best = -Infinity;
    for (const move of moves) {
      const { board: nb, castling: nc, enPassant: ne } = applyMove(board, move, castling, enPassant);
      best = Math.max(best, minimax(nb, depth - 1, alpha, beta, false, nc, ne));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      const { board: nb, castling: nc, enPassant: ne } = applyMove(board, move, castling, enPassant);
      best = Math.min(best, minimax(nb, depth - 1, alpha, beta, true, nc, ne));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

const CPU_DEPTH = 3;

function bestCpuMove(
  board: Board, castling: Castling, enPassant: number | null,
): Move | null {
  const moves = allLegalMoves(board, 'b', castling, enPassant);
  if (moves.length === 0) return null;
  let bestScore = Infinity;
  let bestMove = moves[0];
  for (const move of moves) {
    const { board: nb, castling: nc, enPassant: ne } = applyMove(board, move, castling, enPassant);
    const score = minimax(nb, CPU_DEPTH - 1, -Infinity, Infinity, true, nc, ne);
    if (score < bestScore) { bestScore = score; bestMove = move; }
  }
  return bestMove;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SELECT'; index: number }
  | { type: 'CPU_MOVE' }
  | { type: 'NEW_GAME' }
  | { type: 'RESET_SCORES' };

function computeStatus(board: Board, side: 'w' | 'b', castling: Castling, enPassant: number | null): GameStatus {
  const moves = allLegalMoves(board, side, castling, enPassant);
  if (moves.length === 0) {
    return isInCheck(board, side) ? 'checkmate' : 'stalemate';
  }
  if (isInCheck(board, side)) return 'check';
  return 'playing';
}

function reducer(state: ChessState, action: Action): ChessState {
  switch (action.type) {

    case 'SELECT': {
      if (state.turn !== 'w' || state.cpuThinking) return state;
      if (['checkmate', 'stalemate'].includes(state.status)) return state;

      const { index } = action;
      const piece = state.board[index];

      // If a piece is already selected, try to move
      if (state.selected !== null) {
        const move = state.legalMoves.find(m => m.to === index);
        if (move) {
          const { board: nb, castling: nc, enPassant: ne } = applyMove(state.board, move, state.castling, state.enPassant);
          const newStatus = computeStatus(nb, 'b', nc, ne);
          const newScores = newStatus === 'checkmate'
            ? { ...state.scores, w: state.scores.w + 1 }
            : state.scores;
          return {
            ...state,
            board: nb,
            castling: nc,
            enPassant: ne,
            turn: 'b',
            selected: null,
            legalMoves: [],
            lastMove: move,
            status: newStatus,
            scores: newScores,
            cpuThinking: newStatus === 'playing' || newStatus === 'check',
          };
        }
        // Clicked same square → deselect
        if (index === state.selected) {
          return { ...state, selected: null, legalMoves: [] };
        }
      }

      // Select a white piece
      if (piece && isWhite(piece)) {
        const moves = legalMovesForPiece(state.board, index, 'w', state.castling, state.enPassant);
        return { ...state, selected: index, legalMoves: moves };
      }

      return { ...state, selected: null, legalMoves: [] };
    }

    case 'CPU_MOVE': {
      const move = bestCpuMove(state.board, state.castling, state.enPassant);
      if (!move) {
        // No moves — already handled by status, but safety fallback
        return { ...state, cpuThinking: false };
      }
      const { board: nb, castling: nc, enPassant: ne } = applyMove(state.board, move, state.castling, state.enPassant);
      const newStatus = computeStatus(nb, 'w', nc, ne);
      const newScores = newStatus === 'checkmate'
        ? { ...state.scores, b: state.scores.b + 1 }
        : state.scores;
      return {
        ...state,
        board: nb,
        castling: nc,
        enPassant: ne,
        turn: 'w',
        selected: null,
        legalMoves: [],
        lastMove: move,
        status: newStatus,
        scores: newScores,
        cpuThinking: false,
      };
    }

    case 'NEW_GAME': {
      return { ...initState(), scores: state.scores };
    }

    case 'RESET_SCORES': {
      return { ...initState() };
    }

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChess() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  // Trigger CPU move after a short delay when it's black's turn
  useEffect(() => {
    if (!state.cpuThinking) return;
    const timer = setTimeout(() => dispatch({ type: 'CPU_MOVE' }), 350);
    return () => clearTimeout(timer);
  }, [state.cpuThinking]);

  const selectSquare = useCallback((index: number) => {
    dispatch({ type: 'SELECT', index });
  }, []);

  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME' }), []);
  const resetScores = useCallback(() => dispatch({ type: 'RESET_SCORES' }), []);

  return { state, selectSquare, newGame, resetScores };
}

