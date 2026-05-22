import './TicTacToePage.css';

import { useState } from 'react';

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

  const result = calcWinner(board);
  const winningLine = result?.line ?? [];
  const isDraw = !result && board.every((cell) => cell !== null);

  const statusMessage = (() => {
    if (result) return `Player ${result.player} wins! 🎉`;
    if (isDraw) return "It's a draw! 🤝";
    return `Player ${currentPlayer}'s turn`;
  })();

  const handleCellClick = (idx: number) => {
    if (gameOver || board[idx] !== null) return;

    const next = board.slice();
    next[idx] = currentPlayer;
    setBoard(next);

    const newResult = calcWinner(next);
    const newDraw = !newResult && next.every((c) => c !== null);

    if (newResult) {
      setScores((s) => ({ ...s, [newResult.player]: s[newResult.player] + 1 }));
      setGameOver(true);
    } else if (newDraw) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }));
      setGameOver(true);
    } else {
      setCurrentPlayer((p) => (p === 'X' ? 'O' : 'X'));
    }
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
  };

  const handleResetAll = () => {
    handleReset();
    setScores({ X: 0, O: 0, draws: 0 });
  };

  return (
    <main className="ttt-page">
      <h1 className="ttt-title">⭕ Tic Tac Toe</h1>
      <p className="ttt-subtitle">Classic two-player game. First to three in a row wins!</p>

      {/* Score board */}
      <div className="ttt-scoreboard" aria-label="Scoreboard">
        <div className="ttt-score ttt-score--x">
          <span className="ttt-score-label">Player X</span>
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
          <span className="ttt-score-label">Player O</span>
          <span className="ttt-score-value" aria-label="Player O score">
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
            disabled={gameOver}
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
