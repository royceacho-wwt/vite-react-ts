import './TicTacToePage.css';

import { useCallback, useEffect, useState } from 'react';

/* ── Types ────────────────────────────────────────────────────────────────── */

type Square = 'X' | 'O' | null;
type Board = Square[];
type Difficulty = 'easy' | 'medium' | 'hard';

/* ── Win conditions ───────────────────────────────────────────────────────── */

const WIN_LINES: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board: Board): { winner: Square; line: number[] } | null {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  return null;
}

function isDraw(board: Board): boolean {
  return board.every((sq) => sq !== null) && !checkWinner(board);
}

/* ── AI logic ─────────────────────────────────────────────────────────────── */

function getEmptySquares(board: Board): number[] {
  return board.reduce<number[]>((acc, sq, i) => (sq === null ? [...acc, i] : acc), []);
}

/** Minimax with alpha-beta pruning — returns the score for the given board state. */
function minimax(board: Board, isMaximising: boolean, alpha: number, beta: number): number {
  const result = checkWinner(board);
  if (result) return result.winner === 'O' ? 10 : -10;
  if (isDraw(board)) return 0;

  const empties = getEmptySquares(board);

  if (isMaximising) {
    let best = -Infinity;
    for (const idx of empties) {
      board[idx] = 'O';
      best = Math.max(best, minimax(board, false, alpha, beta));
      board[idx] = null;
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const idx of empties) {
      board[idx] = 'X';
      best = Math.min(best, minimax(board, true, alpha, beta));
      board[idx] = null;
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

/** Pick the best move index for the CPU ('O'). */
function bestMove(board: Board): number {
  let bestScore = -Infinity;
  let move = -1;
  for (const idx of getEmptySquares(board)) {
    board[idx] = 'O';
    const score = minimax(board, false, -Infinity, Infinity);
    board[idx] = null;
    if (score > bestScore) {
      bestScore = score;
      move = idx;
    }
  }
  return move;
}

/** Pick a CPU move based on difficulty. */
function cpuMove(board: Board, difficulty: Difficulty): number {
  const empties = getEmptySquares(board);

  if (difficulty === 'easy') {
    // Fully random
    return empties[Math.floor(Math.random() * empties.length)];
  }

  if (difficulty === 'medium') {
    // 60% chance to play optimally, 40% random
    if (Math.random() < 0.6) return bestMove(board);
    return empties[Math.floor(Math.random() * empties.length)];
  }

  // hard — always optimal
  return bestMove(board);
}

/* ── Scoreboard ───────────────────────────────────────────────────────────── */

interface Score {
  player: number;
  cpu: number;
  draws: number;
}

/* ── Game component ───────────────────────────────────────────────────────── */

const EMPTY_BOARD: Board = Array(9).fill(null);

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '😊 Easy',
  medium: '🤔 Medium',
  hard: '😈 Hard',
};

export function TicTacToePage() {
  const [board, setBoard] = useState<Board>([...EMPTY_BOARD]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winResult, setWinResult] = useState<{ winner: Square; line: number[] } | null>(null);
  const [draw, setDraw] = useState(false);
  const [score, setScore] = useState<Score>({ player: 0, cpu: 0, draws: 0 });
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [cpuThinking, setCpuThinking] = useState(false);

  const gameOver = winResult !== null || draw;

  /* Reset just the board, keep score & difficulty */
  const resetBoard = useCallback(() => {
    setBoard([...EMPTY_BOARD]);
    setWinResult(null);
    setDraw(false);
    setIsPlayerTurn(true);
    setCpuThinking(false);
  }, []);

  /* Full reset including score */
  const resetAll = useCallback(() => {
    resetBoard();
    setScore({ player: 0, cpu: 0, draws: 0 });
  }, [resetBoard]);

  /* CPU turn effect */
  useEffect(() => {
    if (gameOver || isPlayerTurn) return;

    setCpuThinking(true);

    const delay = difficulty === 'easy' ? 400 : difficulty === 'medium' ? 600 : 500;

    const id = setTimeout(() => {
      setBoard((prev) => {
        const next = [...prev];
        const idx = cpuMove(next, difficulty);
        if (idx === -1) return prev; // shouldn't happen
        next[idx] = 'O';

        const result = checkWinner(next);
        if (result) {
          setWinResult(result);
          setScore((s) => ({ ...s, cpu: s.cpu + 1 }));
        } else if (isDraw(next)) {
          setDraw(true);
          setScore((s) => ({ ...s, draws: s.draws + 1 }));
        } else {
          setIsPlayerTurn(true);
        }

        return next;
      });
      setCpuThinking(false);
    }, delay);

    return () => clearTimeout(id);
  }, [isPlayerTurn, gameOver, difficulty]);

  /* Player click */
  const handleSquareClick = (idx: number) => {
    if (!isPlayerTurn || board[idx] !== null || gameOver || cpuThinking) return;

    const next = [...board];
    next[idx] = 'X';

    const result = checkWinner(next);
    if (result) {
      setBoard(next);
      setWinResult(result);
      setScore((s) => ({ ...s, player: s.player + 1 }));
      return;
    }
    if (isDraw(next)) {
      setBoard(next);
      setDraw(true);
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
      return;
    }

    setBoard(next);
    setIsPlayerTurn(false);
  };

  /* ── Status message ──────────────────────────────────────────────────────── */
  let statusMsg: string;
  if (winResult) {
    statusMsg = winResult.winner === 'X' ? '🎉 You win!' : '🤖 CPU wins!';
  } else if (draw) {
    statusMsg = "🤝 It's a draw!";
  } else if (cpuThinking) {
    statusMsg = '🤖 CPU is thinking…';
  } else {
    statusMsg = '🎯 Your turn — you are X';
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */
  return (
    <main className="ttt-page">
      <h1 className="ttt-title">✖️ Tic-Tac-Toe</h1>
      <p className="ttt-subtitle">
        You are <strong>X</strong>. The CPU is <strong>O</strong>. Go first!
      </p>

      {/* Difficulty selector */}
      <div className="ttt-difficulty" role="group" aria-label="Difficulty">
        {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            className={`ttt-diff-btn${difficulty === d ? ' ttt-diff-btn--active' : ''}`}
            onClick={() => {
              setDifficulty(d);
              resetBoard();
            }}
            aria-pressed={difficulty === d}
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Scoreboard */}
      <div className="ttt-scoreboard" aria-label="Scoreboard">
        <div className="ttt-score-cell">
          <span className="ttt-score-label">You (X)</span>
          <span className="ttt-score-value">{score.player}</span>
        </div>
        <div className="ttt-score-cell ttt-score-cell--draws">
          <span className="ttt-score-label">Draws</span>
          <span className="ttt-score-value">{score.draws}</span>
        </div>
        <div className="ttt-score-cell">
          <span className="ttt-score-label">CPU (O)</span>
          <span className="ttt-score-value">{score.cpu}</span>
        </div>
      </div>

      {/* Status */}
      <p
        className={`ttt-status${
          winResult?.winner === 'X'
            ? ' ttt-status--win'
            : winResult?.winner === 'O'
            ? ' ttt-status--lose'
            : draw
            ? ' ttt-status--draw'
            : ''
        }`}
        aria-live="polite"
        role="status"
      >
        {statusMsg}
      </p>

      {/* Board */}
      <div className="ttt-board" aria-label="Tic-Tac-Toe board">
        {board.map((sq, idx) => {
          const isWinSquare = winResult?.line.includes(idx) ?? false;
          return (
            <button
              key={idx}
              className={`ttt-square${sq === 'X' ? ' ttt-square--x' : sq === 'O' ? ' ttt-square--o' : ''}${
                isWinSquare ? ' ttt-square--win' : ''
              }`}
              onClick={() => handleSquareClick(idx)}
              aria-label={`Square ${idx + 1}${sq ? `, ${sq}` : ', empty'}`}
              disabled={sq !== null || !isPlayerTurn || gameOver || cpuThinking}
            >
              {sq}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="ttt-actions">
        <button className="ttt-btn ttt-btn--primary" onClick={resetBoard}>
          🔄 New Game
        </button>
        <button className="ttt-btn ttt-btn--secondary" onClick={resetAll}>
          🗑️ Reset Score
        </button>
      </div>
    </main>
  );
}
