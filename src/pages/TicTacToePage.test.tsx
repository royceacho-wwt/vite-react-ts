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
  it('renders the page title', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('heading', { name: /tic tac toe/i })).toBeDefined();
  });

  it('renders the subtitle', () => {
    render(<TicTacToePage />);
    expect(screen.getByText(/classic two-player game/i)).toBeDefined();
  });

  it('renders 9 cell buttons', () => {
    render(<TicTacToePage />);
    expect(getCells()).toHaveLength(9);
  });

  it('all cells start empty', () => {
    render(<TicTacToePage />);
    getCells().forEach((cell) => {
      expect(cell.textContent).toBe('');
    });
  });

  it('renders the New Game button', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('button', { name: /new game/i })).toBeDefined();
  });

  it('renders the Reset Scores button', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('button', { name: /reset scores/i })).toBeDefined();
  });

  it('renders the scoreboard with three score panels', () => {
    render(<TicTacToePage />);
    expect(screen.getByLabelText('Player X score')).toBeDefined();
    expect(screen.getByLabelText('Player O score')).toBeDefined();
    expect(screen.getByLabelText('Draw count')).toBeDefined();
  });

  it('all scores start at 0', () => {
    render(<TicTacToePage />);
    expect(screen.getByLabelText('Player X score').textContent).toBe('0');
    expect(screen.getByLabelText('Player O score').textContent).toBe('0');
    expect(screen.getByLabelText('Draw count').textContent).toBe('0');
  });
});

/* ── Turn tracking ────────────────────────────────────────────────────────── */

describe('TicTacToePage – turn tracking', () => {
  it('shows Player X turn initially', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);
  });

  it('switches to Player O after X takes a cell', () => {
    render(<TicTacToePage />);
    clickCell(1);
    expect(screen.getByRole('status').textContent).toMatch(/player o/i);
  });

  it('switches back to Player X after O takes a cell', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(2); // O
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);
  });

  it('cell 1 shows X after Player X clicks it', () => {
    render(<TicTacToePage />);
    clickCell(1);
    expect(getCells()[0].textContent).toBe('X');
  });

  it('cell 2 shows O after Player O clicks it', () => {
    render(<TicTacToePage />);
    clickCell(1); // X plays cell 1
    clickCell(2); // O plays cell 2
    expect(getCells()[1].textContent).toBe('O');
  });

  it('does not change a cell that is already occupied', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(1); // O tries same cell — should be no-op
    expect(getCells()[0].textContent).toBe('X');
    // Still O's turn? No — it stays X because it was already taken; now it should be O's turn still
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

  it('marks winning cells with the ttt-cell--winning class', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X
    clickCell(5); // O
    clickCell(3); // X wins on row 1
    const cells = getCells();
    expect(cells[0].className).toContain('ttt-cell--winning');
    expect(cells[1].className).toContain('ttt-cell--winning');
    expect(cells[2].className).toContain('ttt-cell--winning');
  });

  it('non-winning cells do not get the winning class', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X
    clickCell(5); // O
    clickCell(3); // X wins
    const cells = getCells();
    expect(cells[3].className).not.toContain('ttt-cell--winning');
    expect(cells[4].className).not.toContain('ttt-cell--winning');
  });

  it('disables all cells after a win', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    clickCell(4); // O
    clickCell(2); // X
    clickCell(5); // O
    clickCell(3); // X wins
    getCells().forEach((cell) => {
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

  it('announces a draw when board is full with no winner', () => {
    render(<TicTacToePage />);
    playDraw();
    expect(screen.getByRole('status').textContent).toMatch(/draw/i);
  });

  it('increments the draw counter', () => {
    render(<TicTacToePage />);
    playDraw();
    expect(screen.getByLabelText('Draw count').textContent).toBe('1');
  });

  it('disables all cells after a draw', () => {
    render(<TicTacToePage />);
    playDraw();
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
  it('clears the board after clicking New Game', () => {
    render(<TicTacToePage />);
    clickCell(1);
    clickCell(2);
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    getCells().forEach((cell) => {
      expect(cell.textContent).toBe('');
    });
  });

  it('resets to Player X turn after New Game', () => {
    render(<TicTacToePage />);
    clickCell(1);
    clickCell(2);
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(screen.getByRole('status').textContent).toMatch(/player x/i);
  });

  it('cells are enabled again after New Game following a win', () => {
    render(<TicTacToePage />);
    clickCell(1);
    clickCell(4);
    clickCell(2);
    clickCell(5);
    clickCell(3); // X wins
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    getCells().forEach((cell) => {
      expect((cell as HTMLButtonElement).disabled).toBe(false);
    });
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
  it('each cell has an aria-label identifying its position', () => {
    render(<TicTacToePage />);
    const cells = getCells();
    cells.forEach((cell, i) => {
      expect(cell.getAttribute('aria-label')).toMatch(new RegExp(`Cell ${i + 1}`, 'i'));
    });
  });

  it('occupied cell aria-label includes the player mark', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    expect(getCells()[0].getAttribute('aria-label')).toMatch(/X/);
  });

  it('status region has role="status"', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('board has role="grid"', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('grid')).toBeDefined();
  });
});
