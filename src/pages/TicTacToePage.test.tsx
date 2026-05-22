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

/* ── Rendering ────────────────────────────────────────────────────────────── */

describe('TicTacToePage – rendering', () => {
  it('renders the page title, subtitle, board, and control buttons', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('heading', { name: /tic tac toe/i })).toBeDefined();
    expect(screen.getByText(/classic two-player game/i)).toBeDefined();
    expect(getCells()).toHaveLength(9);
    expect(screen.getByRole('button', { name: /new game/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /reset scores/i })).toBeDefined();
  });

  it('renders the scoreboard with all three panels starting at 0', () => {
    render(<TicTacToePage />);
    expect(screen.getByLabelText('Player X score').textContent).toBe('0');
    expect(screen.getByLabelText('Player O score').textContent).toBe('0');
    expect(screen.getByLabelText('Draw count').textContent).toBe('0');
  });
});

/* ── Turn tracking ────────────────────────────────────────────────────────── */

describe('TicTacToePage – turn tracking', () => {
  it('shows Player X turn initially, switches to O then back to X', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);

    clickCell(1);
    expect(screen.getByRole('status').textContent).toMatch(/player o/i);

    clickCell(2);
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);
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
    // X: 1, 2, 3  |  O: 4, 5
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X
    clickCell(5); // O
    clickCell(3); // X wins
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

  it('marks only winning cells with ttt-cell--winning and disables the board', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X
    clickCell(5); // O
    clickCell(3); // X wins on row 1
    const cells = getCells();
    // Winning cells
    expect(cells[0].className).toContain('ttt-cell--winning');
    expect(cells[1].className).toContain('ttt-cell--winning');
    expect(cells[2].className).toContain('ttt-cell--winning');
    // Non-winning cells
    expect(cells[3].className).not.toContain('ttt-cell--winning');
    expect(cells[4].className).not.toContain('ttt-cell--winning');
    // All disabled
    cells.forEach((cell) => {
      expect((cell as HTMLButtonElement).disabled).toBe(true);
    });
  });
});

/* ── Draw detection ────────────────────────────────────────────────────────── */

describe('TicTacToePage – draw detection', () => {
  /*
    Forced draw sequence (no winner):
      X O X
      X X O
      O X O
    Moves: X1 O2 X3 O6 X5 O7 X4 O9 X8
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

  it('announces a draw, increments the draw counter, and disables all cells', () => {
    render(<TicTacToePage />);
    playDraw();
    expect(screen.getByRole('status').textContent).toMatch(/draw/i);
    expect(screen.getByLabelText('Draw count').textContent).toBe('1');
    getCells().forEach((cell) => {
      expect((cell as HTMLButtonElement).disabled).toBe(true);
    });
  });
});

/* ── Score tracking ────────────────────────────────────────────────────────── */

describe('TicTacToePage – score tracking', () => {
  function playXWins() {
    // X wins top row: X:1,2,3 | O:4,5
    clickCell(1);
    clickCell(4);
    clickCell(2);
    clickCell(5);
    clickCell(3);
  }

  it('increments X score after X wins', () => {
    render(<TicTacToePage />);
    playXWins();
    expect(screen.getByLabelText('Player X score').textContent).toBe('1');
  });

  it('X score increases across multiple games', () => {
    render(<TicTacToePage />);
    playXWins();
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    playXWins();
    expect(screen.getByLabelText('Player X score').textContent).toBe('2');
  });

  it('Reset Scores resets all scores to 0', () => {
    render(<TicTacToePage />);
    playXWins();
    fireEvent.click(screen.getByRole('button', { name: /reset scores/i }));
    expect(screen.getByLabelText('Player X score').textContent).toBe('0');
    expect(screen.getByLabelText('Player O score').textContent).toBe('0');
    expect(screen.getByLabelText('Draw count').textContent).toBe('0');
  });
});

/* ── New Game ─────────────────────────────────────────────────────────────── */

describe('TicTacToePage – New Game', () => {
  it('clears the board, resets to Player X, and re-enables cells after a win', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X
    clickCell(5); // O
    clickCell(3); // X wins

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));

    getCells().forEach((cell) => {
      expect(cell.textContent).toBe('');
      expect((cell as HTMLButtonElement).disabled).toBe(false);
    });
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);
  });

  it('preserves scores after New Game', () => {
    render(<TicTacToePage />);
    clickCell(1);
    clickCell(4);
    clickCell(2);
    clickCell(5);
    clickCell(3); // X wins
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(screen.getByLabelText('Player X score').textContent).toBe('1');
  });
});

/* ── Accessibility ────────────────────────────────────────────────────────── */

describe('TicTacToePage – accessibility', () => {
  it('each cell has an aria-label with position; occupied cells include the mark', () => {
    render(<TicTacToePage />);
    const cells = getCells();
    cells.forEach((cell, i) => {
      expect(cell.getAttribute('aria-label')).toMatch(new RegExp(`Cell ${i + 1}`, 'i'));
    });

    clickCell(1); // X
    expect(getCells()[0].getAttribute('aria-label')).toMatch(/X/);
  });

  it('board has role="grid" and status region has role="status"', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('grid')).toBeDefined();
    expect(screen.getByRole('status')).toBeDefined();
  });
});
