import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TicTacToePage } from '@/pages/TicTacToePage';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Returns all 9 cell buttons in board order. */
function getCells() {
  return screen.getAllByRole('button', { name: /^Cell \d/ });
}

/** Click a cell by its 1-based index. */
function clickCell(index: number) {
  fireEvent.click(getCells()[index - 1]);
}

/**
 * Play a game where X wins the top row.
 * X: cells 1, 2, 3  |  O: cells 4, 5
 */
function playXWinsTopRow() {
  clickCell(1); // X
  clickCell(4); // O
  clickCell(2); // X
  clickCell(5); // O
  clickCell(3); // X wins
}

/**
 * Play a forced draw — board fills with no winner.
 *   X O X
 *   X X O
 *   O X O
 * Moves: X1 O2 X3 O6 X5 O7 X4 O9 X8
 */
function playDraw() {
  clickCell(1); // X
  clickCell(2); // O
  clickCell(3); // X
  clickCell(6); // O
  clickCell(5); // X
  clickCell(7); // O
  clickCell(4); // X
  clickCell(9); // O
  clickCell(8); // X — board full, no winner
}

/* ── Rendering ────────────────────────────────────────────────────────────── */

describe('TicTacToePage – rendering', () => {
  it('renders all key UI elements', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('heading', { name: /tic tac toe/i })).toBeDefined();
    expect(screen.getByText(/classic two-player game/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /new game/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /reset scores/i })).toBeDefined();
    expect(screen.getByRole('grid')).toBeDefined();
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('renders 9 empty cell buttons', () => {
    render(<TicTacToePage />);
    const cells = getCells();
    expect(cells).toHaveLength(9);
    cells.forEach((cell) => expect(cell.textContent).toBe(''));
  });

  it('renders the scoreboard with all scores at 0', () => {
    render(<TicTacToePage />);
    expect(screen.getByLabelText('Player X score').textContent).toBe('0');
    expect(screen.getByLabelText('Player O score').textContent).toBe('0');
    expect(screen.getByLabelText('Draw count').textContent).toBe('0');
  });
});

/* ── Turn tracking ────────────────────────────────────────────────────────── */

describe('TicTacToePage – turn tracking', () => {
  it('shows Player X turn initially, then alternates correctly', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);

    clickCell(1); // X plays
    expect(screen.getByRole('status').textContent).toMatch(/player o/i);
    expect(getCells()[0].textContent).toBe('X');

    clickCell(2); // O plays
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);
    expect(getCells()[1].textContent).toBe('O');
  });

  it('does not change a cell that is already occupied', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(1); // O tries same cell — should be no-op
    expect(getCells()[0].textContent).toBe('X');
    expect(screen.getByRole('status').textContent).toMatch(/player o/i);
  });
});

/* ── Win detection ────────────────────────────────────────────────────────── */

describe('TicTacToePage – win detection', () => {
  /*
    Board indices (1-based):
      1 | 2 | 3
      4 | 5 | 6
      7 | 8 | 9
  */

  it('declares X the winner when X fills the top row', () => {
    render(<TicTacToePage />);
    playXWinsTopRow();
    expect(screen.getByRole('status').textContent).toMatch(/player x wins/i);
  });

  it('declares O the winner when O fills the middle row', () => {
    render(<TicTacToePage />);
    // X: 1, 2, 9  |  O: 4, 5, 6
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X
    clickCell(5); // O
    clickCell(9); // X (safe, no win)
    clickCell(6); // O wins
    expect(screen.getByRole('status').textContent).toMatch(/player o wins/i);
  });

  it('declares X the winner on the main diagonal', () => {
    render(<TicTacToePage />);
    // X: 1, 5, 9  |  O: 2, 3
    clickCell(1); // X
    clickCell(2); // O
    clickCell(5); // X
    clickCell(3); // O
    clickCell(9); // X wins (1-5-9 diagonal)
    expect(screen.getByRole('status').textContent).toMatch(/player x wins/i);
  });

  it('marks winning cells with ttt-cell--winning and leaves others unmarked', () => {
    render(<TicTacToePage />);
    playXWinsTopRow();
    const cells = getCells();
    // Winning cells: 0, 1, 2
    [0, 1, 2].forEach((i) => expect(cells[i].className).toContain('ttt-cell--winning'));
    // Non-winning cells: 3, 4
    [3, 4].forEach((i) => expect(cells[i].className).not.toContain('ttt-cell--winning'));
  });

  it('disables all cells after a win', () => {
    render(<TicTacToePage />);
    playXWinsTopRow();
    getCells().forEach((cell) => expect((cell as HTMLButtonElement).disabled).toBe(true));
  });
});

/* ── Draw detection ────────────────────────────────────────────────────────── */

describe('TicTacToePage – draw detection', () => {
  it('announces a draw, increments draw counter, and disables all cells', () => {
    render(<TicTacToePage />);
    playDraw();
    expect(screen.getByRole('status').textContent).toMatch(/draw/i);
    expect(screen.getByLabelText('Draw count').textContent).toBe('1');
    getCells().forEach((cell) => expect((cell as HTMLButtonElement).disabled).toBe(true));
  });
});

/* ── Score tracking ────────────────────────────────────────────────────────── */

describe('TicTacToePage – score tracking', () => {
  it('increments X score after X wins, and accumulates across games', () => {
    render(<TicTacToePage />);
    playXWinsTopRow();
    expect(screen.getByLabelText('Player X score').textContent).toBe('1');

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    playXWinsTopRow();
    expect(screen.getByLabelText('Player X score').textContent).toBe('2');
  });

  it('Reset Scores resets all scores to 0', () => {
    render(<TicTacToePage />);
    playXWinsTopRow();
    fireEvent.click(screen.getByRole('button', { name: /reset scores/i }));
    expect(screen.getByLabelText('Player X score').textContent).toBe('0');
    expect(screen.getByLabelText('Player O score').textContent).toBe('0');
    expect(screen.getByLabelText('Draw count').textContent).toBe('0');
  });
});

/* ── New Game ─────────────────────────────────────────────────────────────── */

describe('TicTacToePage – New Game', () => {
  it('clears the board, resets turn to Player X, and re-enables cells after a win', () => {
    render(<TicTacToePage />);
    playXWinsTopRow();

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));

    getCells().forEach((cell) => {
      expect(cell.textContent).toBe('');
      expect((cell as HTMLButtonElement).disabled).toBe(false);
    });
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);
  });

  it('preserves scores after New Game', () => {
    render(<TicTacToePage />);
    playXWinsTopRow();
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(screen.getByLabelText('Player X score').textContent).toBe('1');
  });
});

/* ── Accessibility ────────────────────────────────────────────────────────── */

describe('TicTacToePage – accessibility', () => {
  it('each cell has an aria-label identifying its position and content', () => {
    render(<TicTacToePage />);
    getCells().forEach((cell, i) => {
      expect(cell.getAttribute('aria-label')).toMatch(new RegExp(`Cell ${i + 1}`, 'i'));
    });

    clickCell(1); // X
    expect(getCells()[0].getAttribute('aria-label')).toMatch(/X/);
  });
});
