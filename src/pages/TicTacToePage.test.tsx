import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cpuMove, TicTacToePage } from '@/pages/TicTacToePage';

/* ── Timer helpers ─────────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Flush the CPU's 400 ms thinking delay. */
function letCpuMove() {
  act(() => {
    vi.runAllTimers();
  });
}

/* ── Board helpers ─────────────────────────────────────────────────────────── */

/** Returns all 9 cell buttons in board order. */
function getCells() {
  return screen.getAllByRole('button', { name: /^Cell \d/ });
}

/** Click a cell by its 1-based index (human X move). */
function clickCell(index: number) {
  fireEvent.click(getCells()[index - 1]);
}

/* ── cpuMove unit tests ────────────────────────────────────────────────────── */

describe('cpuMove – minimax AI', () => {
  it('takes the winning move when one is immediately available', () => {
    // O occupies indices 0 and 1; winning move is index 2 (top row)
    const board = ['O', 'O', null, 'X', 'X', null, null, null, null] as ('X' | 'O' | null)[];
    expect(cpuMove(board)).toBe(2);
  });

  it('blocks X from winning on the next move', () => {
    // X threatens to win at index 2 (top row: 0,1,2)
    const board = ['X', 'X', null, null, null, null, null, null, null] as ('X' | 'O' | null)[];
    expect(cpuMove(board)).toBe(2);
  });

  it('returns a valid index (0-8) on an empty board', () => {
    const board = Array(9).fill(null) as ('X' | 'O' | null)[];
    const move = cpuMove(board);
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
  });

  it('returns the only available index on a near-full board', () => {
    // Only index 6 is free
    const board = ['X', 'O', 'X', 'X', 'O', 'O', null, 'O', 'X'] as ('X' | 'O' | null)[];
    expect(cpuMove(board)).toBe(6);
  });
});

/* ── Rendering ────────────────────────────────────────────────────────────── */

describe('TicTacToePage – rendering', () => {
  it('renders the page title, subtitle, board, and control buttons', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('heading', { name: /tic tac toe/i })).toBeDefined();
    expect(screen.getByText(/you are x/i)).toBeDefined();
    expect(getCells()).toHaveLength(9);
    expect(screen.getByRole('button', { name: /new game/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /reset scores/i })).toBeDefined();
  });

  it('renders the scoreboard with all three panels starting at 0', () => {
    render(<TicTacToePage />);
    expect(screen.getByLabelText('Player X score').textContent).toBe('0');
    expect(screen.getByLabelText('CPU O score').textContent).toBe('0');
    expect(screen.getByLabelText('Draw count').textContent).toBe('0');
  });

  it('shows "Your turn (X)" initially', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('status').textContent).toMatch(/your turn/i);
  });
});

/* ── Human moves ───────────────────────────────────────────────────────────── */

describe('TicTacToePage – human moves', () => {
  it('placing X in a cell labels it with X', () => {
    render(<TicTacToePage />);
    clickCell(1);
    expect(getCells()[0].textContent).toBe('X');
  });

  it('switches to "CPU is thinking" after a human move', () => {
    render(<TicTacToePage />);
    clickCell(1);
    expect(screen.getByRole('status').textContent).toMatch(/cpu is thinking/i);
  });

  it('returns to "Your turn" after the CPU has moved', () => {
    render(<TicTacToePage />);
    clickCell(1);
    letCpuMove();
    // Game is still in progress — should be human's turn again
    if (!screen.getByRole('status').textContent?.match(/wins|draw/i)) {
      expect(screen.getByRole('status').textContent).toMatch(/your turn/i);
    }
  });

  it('ignores a click on an occupied cell', () => {
    render(<TicTacToePage />);
    clickCell(1); // X
    letCpuMove(); // CPU plays somewhere
    // Try to re-click cell 1 — already X
    clickCell(1);
    expect(getCells()[0].textContent).toBe('X');
  });

  it('cells are disabled while the CPU is thinking', () => {
    render(<TicTacToePage />);
    clickCell(5); // human plays centre
    // CPU hasn't moved yet — board should be locked
    getCells().forEach((cell) => {
      expect((cell as HTMLButtonElement).disabled).toBe(true);
    });
  });
});

/* ── Win / draw detection ──────────────────────────────────────────────────── */

describe('TicTacToePage – win / draw detection', () => {
  /** Play the game to completion by always clicking the first available cell. */
  function playToEnd() {
    for (let attempt = 0; attempt < 9; attempt++) {
      const available = getCells().find((c) => c.textContent === '' && !(c as HTMLButtonElement).disabled);
      if (!available) break;
      fireEvent.click(available);
      letCpuMove();
      if (screen.getByRole('status').textContent?.match(/win|draw/i)) break;
    }
  }

  it('game always ends in a win or draw (never stays mid-game indefinitely)', () => {
    render(<TicTacToePage />);
    playToEnd();
    const status = screen.getByRole('status').textContent ?? '';
    expect(status).toMatch(/win|draw/i);
  });

  it('all cells are disabled once the game is over', () => {
    render(<TicTacToePage />);
    playToEnd();
    getCells().forEach((cell) => {
      expect((cell as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('winning cells carry ttt-cell--winning class when there is a winner', () => {
    render(<TicTacToePage />);
    playToEnd();
    const status = screen.getByRole('status').textContent ?? '';
    if (status.match(/win/i)) {
      const winningCells = getCells().filter((c) => c.className.includes('ttt-cell--winning'));
      expect(winningCells.length).toBe(3);
    }
  });

  it('increments the correct score counter after the game ends', () => {
    render(<TicTacToePage />);
    playToEnd();
    const status = screen.getByRole('status').textContent ?? '';
    if (status.match(/draw/i)) {
      expect(screen.getByLabelText('Draw count').textContent).toBe('1');
    } else if (status.match(/cpu wins/i)) {
      expect(screen.getByLabelText('CPU O score').textContent).toBe('1');
    } else if (status.match(/you win/i)) {
      expect(screen.getByLabelText('Player X score').textContent).toBe('1');
    }
  });
});

/* ── Score tracking ────────────────────────────────────────────────────────── */

describe('TicTacToePage – score tracking', () => {
  it('Reset Scores resets all scores to 0', () => {
    render(<TicTacToePage />);
    // Play one full game
    for (let i = 0; i < 9; i++) {
      const available = getCells().find((c) => c.textContent === '' && !(c as HTMLButtonElement).disabled);
      if (!available) break;
      fireEvent.click(available);
      letCpuMove();
      if (screen.getByRole('status').textContent?.match(/win|draw/i)) break;
    }
    fireEvent.click(screen.getByRole('button', { name: /reset scores/i }));
    expect(screen.getByLabelText('Player X score').textContent).toBe('0');
    expect(screen.getByLabelText('CPU O score').textContent).toBe('0');
    expect(screen.getByLabelText('Draw count').textContent).toBe('0');
  });
});

/* ── New Game ──────────────────────────────────────────────────────────────── */

describe('TicTacToePage – New Game', () => {
  it('clears the board and re-enables cells after clicking New Game', () => {
    render(<TicTacToePage />);
    clickCell(1);
    letCpuMove();

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));

    getCells().forEach((cell) => {
      expect(cell.textContent).toBe('');
      expect((cell as HTMLButtonElement).disabled).toBe(false);
    });
    expect(screen.getByRole('status').textContent).toMatch(/your turn/i);
  });

  it('preserves scores after New Game', () => {
    render(<TicTacToePage />);
    // Play a full game to get a score on the board
    for (let i = 0; i < 9; i++) {
      const available = getCells().find((c) => c.textContent === '' && !(c as HTMLButtonElement).disabled);
      if (!available) break;
      fireEvent.click(available);
      letCpuMove();
      if (screen.getByRole('status').textContent?.match(/win|draw/i)) break;
    }
    const xBefore = screen.getByLabelText('Player X score').textContent;
    const oBefore = screen.getByLabelText('CPU O score').textContent;
    const dBefore = screen.getByLabelText('Draw count').textContent;

    fireEvent.click(screen.getByRole('button', { name: /new game/i }));

    expect(screen.getByLabelText('Player X score').textContent).toBe(xBefore);
    expect(screen.getByLabelText('CPU O score').textContent).toBe(oBefore);
    expect(screen.getByLabelText('Draw count').textContent).toBe(dBefore);
  });
});

/* ── Accessibility ─────────────────────────────────────────────────────────── */

describe('TicTacToePage – accessibility', () => {
  it('each cell has an aria-label with position; occupied cells include the mark', () => {
    render(<TicTacToePage />);
    const cells = getCells();
    cells.forEach((cell, i) => {
      expect(cell.getAttribute('aria-label')).toMatch(new RegExp(`Cell ${i + 1}`, 'i'));
    });

    clickCell(1); // human places X
    expect(getCells()[0].getAttribute('aria-label')).toMatch(/X/);
  });

  it('board has role="grid" and status region has role="status"', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('grid')).toBeDefined();
    expect(screen.getByRole('status')).toBeDefined();
  });

  it('scoreboard labels reflect CPU terminology', () => {
    render(<TicTacToePage />);
    expect(screen.getByLabelText('Player X score')).toBeDefined();
    expect(screen.getByLabelText('CPU O score')).toBeDefined();
  });
});
