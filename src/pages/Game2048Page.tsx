import './Game2048Page.css';

import type { Board, GameStatus } from '@/hooks/use2048';
import { use2048 } from '@/hooks/use2048';

/* ── Cell ────────────────────────────────────────────────────────────────────── */

interface CellProps {
  value: number;
}

function Cell({ value }: CellProps) {
  const tileClass = value === 0 ? 'tile-empty' : value > 2048 ? 'tile-super' : `tile-${value}`;

  return (
    <div className={`g2048-cell ${tileClass}`} aria-label={value === 0 ? 'empty' : String(value)}>
      {value !== 0 && <span className="g2048-cell-value">{value}</span>}
    </div>
  );
}

/* ── Board ───────────────────────────────────────────────────────────────────── */

interface BoardProps {
  board: Board;
}

function BoardGrid({ board }: BoardProps) {
  return (
    <div className="g2048-board" aria-label="2048 game board" role="grid">
      {board.map((row, r) => row.map((value, c) => <Cell key={`${r}-${c}`} value={value} />))}
    </div>
  );
}

/* ── StatusMessage ───────────────────────────────────────────────────────────── */

interface StatusMessageProps {
  status: GameStatus;
}

function StatusMessage({ status }: StatusMessageProps) {
  if (status === 'playing') {
    return <div className="g2048-status" role="status" aria-live="polite" aria-label="Game status" />;
  }

  const message = status === 'won' ? 'You win! 🏆' : 'Game over! 😢';

  return (
    <div className="g2048-status g2048-status--visible" role="status" aria-live="polite" aria-label="Game status">
      <span className="g2048-status-message">{message}</span>
    </div>
  );
}

/* ── Game2048Page ────────────────────────────────────────────────────────────── */

export function Game2048Page() {
  const { board, score, status, newGame } = use2048();

  return (
    <main className="g2048-page">
      <h1 className="g2048-title">2048</h1>

      <div className="g2048-header">
        <span className="g2048-score" aria-label={`Score: ${score}`}>
          <span className="g2048-score-label">Score</span>
          <span className="g2048-score-value">{score}</span>
        </span>

        <button className="g2048-btn-new" onClick={newGame} aria-label="New Game">
          New Game
        </button>
      </div>

      <StatusMessage status={status} />
      <BoardGrid board={board} />

      <p className="g2048-hint">Use arrow keys to move tiles</p>
    </main>
  );
}
