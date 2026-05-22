import './TicTacToePage.css';

import { useEffect, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Player = 'X' | 'O';
type CellValue = Player | null;
type Board = CellValue[];

/* ── Win detection ─────────────────────────────────────────────────────────── */

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diagonals
];

/** Returns the winning player and the three winning indices, or null. */
function calcWinner(board: Board): { player: Player; line: number[] } | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a] as Player, line };
    }
  }
  return null;
}

/* ── Minimax AI ─────────────────────────────────────────────────────────────── */

/** Minimax score for a terminal board state from the CPU (O) perspective. */
function minimax(board: Board, isMaximising: boolean): number {
  const result = calcWinner(board);
  if (result) return result.player === 'O' ? 10 : -10;
  if (board.every((c) => c !== null)) return 0;

  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    const next = board.slice() as Board;
    next[i] = isMaximising ? 'O' : 'X';
    scores.push(minimax(next, !isMaximising));
  }
  return isMaximising ? Math.max(...scores) : Math.min(...scores);
}

/**
 * Returns the best move index for the CPU (O) using minimax.
 * Exported for unit testing.
 */
export function cpuMove(board: Board): number {
  let bestScore = -Infinity;
  let bestIndex = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] !== null) continue;
    const next = board.slice() as Board;
    next[i] = 'O';
    const score = minimax(next, false);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/* ── Score tracking ─────────────────────────────────────────────────────────── */

interface Scores {
  X: number;
  O: number;
  draws: number;
}

/* ── Cell component ─────────────────────────────────────────────────────────── */

interface CellProps {
  value: CellValue;
  index: number;
  isWinning: boolean;
  onClick: () => void;
  disabled: boolean;
}

function Cell({ value, index, isWinning, onClick, disabled }: CellProps) {
  const classes = [
    'ttt-cell',
    value === 'X' ? 'ttt-cell--x' : value === 'O' ? 'ttt-cell--o' : '',
    isWinning ? 'ttt-cell--winning' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || value !== null}
      aria-label={`Cell ${index + 1}${value ? `, ${value}` : ', empty'}`}
    >
      {value}
    </button>
  );
}

/* ── Page component ─────────────────────────────────────────────────────────── */

export function TicTacToePage() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, draws: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [cpuThinking, setCpuThinking] = useState(false);

  const result = calcWinner(board);
  const winningLine = result?.line ?? [];
  const isDraw = !result && board.every((cell) => cell !== null);

  const statusMessage = (() => {
    if (result) return result.player === 'X' ? 'You win! 🎉' : 'CPU wins! 🤖';
    if (isDraw) return "It's a draw! 🤝";
    if (cpuThinking) return 'CPU is thinking…';
    return 'Your turn (X)';
  })();

  /* ── CPU auto-move ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (gameOver || currentPlayer !== 'O') return;

    setCpuThinking(true);
    const timer = setTimeout(() => {
      setBoard((prev) => {
        // Safety: re-check game hasn't ended between render and timeout
        if (calcWinner(prev) || prev.every((c) => c !== null)) {
          setCpuThinking(false);
          return prev;
        }
        const idx = cpuMove(prev);
        const next = prev.slice() as Board;
        next[idx] = 'O';

        const newResult = calcWinner(next);
        const newDraw = !newResult && next.every((c) => c !== null);

        if (newResult) {
          setScores((s) => ({ ...s, O: s.O + 1 }));
          setGameOver(true);
        } else if (newDraw) {
          setScores((s) => ({ ...s, draws: s.draws + 1 }));
          setGameOver(true);
        } else {
          setCurrentPlayer('X');
        }

        setCpuThinking(false);
        return next;
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [currentPlayer, gameOver]);

  /* ── Human move ────────────────────────────────────────────────────────── */
  const handleCellClick = (idx: number) => {
    if (gameOver || cpuThinking || board[idx] !== null || currentPlayer !== 'X') return;

    const next = board.slice() as Board;
    next[idx] = 'X';
    setBoard(next);

    const newResult = calcWinner(next);
    const newDraw = !newResult && next.every((c) => c !== null);

    if (newResult) {
      setScores((s) => ({ ...s, X: s.X + 1 }));
      setGameOver(true);
    } else if (newDraw) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      setGameOver(true);
    } else {
      setCurrentPlayer('O');
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
    setCpuThinking(false);
  };

  const handleResetAll = () => {
    handleReset();
    setScores({ X: 0, O: 0, draws: 0 });
  };

  const boardDisabled = gameOver || cpuThinking;

  return (
    <main className="ttt-page">
      <h1 className="ttt-title">⭕ Tic Tac Toe</h1>
      <p className="ttt-subtitle">You are X. Play against the CPU!</p>

      {/* Score board */}
      <div className="ttt-scoreboard" aria-label="Scoreboard">
        <div className="ttt-score ttt-score--x">
          <span className="ttt-score-label">You (X)</span>
          <span className="ttt-score-value" aria-label="Player X score">
            {scores.X}
          </span>
        </div>
        <div className="ttt-score ttt-score--draws">
          <span className="ttt-score-label">Draws</span>
          <span className="ttt-score-value" aria-label="Draw count">
            {scores.draws}
          </span>
        </div>
        <div className="ttt-score ttt-score--o">
          <span className="ttt-score-label">CPU (O)</span>
          <span className="ttt-score-value" aria-label="CPU O score">
            {scores.O}
          </span>
        </div>
      </div>

      {/* Status */}
      <div
        className={`ttt-status${gameOver ? ' ttt-status--gameover' : ''}`}
        role="status"
        aria-live="polite"
        aria-label="Game status"
      >
        {statusMessage}
      </div>

      {/* Board */}
      <div className="ttt-board" role="grid" aria-label="Tic Tac Toe board">
        {board.map((cell, idx) => (
          <Cell
            key={idx}
            value={cell}
            index={idx}
            isWinning={winningLine.includes(idx)}
            onClick={() => handleCellClick(idx)}
            disabled={boardDisabled}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="ttt-actions">
        <button className="ttt-btn ttt-btn--primary" onClick={handleReset} aria-label="New game">
          🔄 New Game
        </button>
        <button className="ttt-btn ttt-btn--secondary" onClick={handleResetAll} aria-label="Reset scores">
          🗑️ Reset Scores
        </button>
      </div>
    </main>
  );
}
