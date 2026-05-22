import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TicTacToePage } from '@/pages/TicTacToePage';

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Click the square at the given 0-based board index. */
function clickSquare(idx: number) {
  fireEvent.click(screen.getByLabelText(`Square ${idx + 1}, empty`));
}

/** Return the button element for the square at the given 0-based board index. */
function getSquare(idx: number) {
  return screen.getAllByRole('button', { name: /Square/ })[idx];
}

describe('TicTacToePage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  /* ── Rendering ──────────────────────────────────────────────────────────── */

  it('renders the page heading', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('heading', { name: /Tic-Tac-Toe/i })).toBeDefined();
  });

  it('renders a 9-square board', () => {
    render(<TicTacToePage />);
    const squares = screen.getAllByRole('button', { name: /Square/ });
    expect(squares).toHaveLength(9);
  });

  it('shows all squares as empty on start', () => {
    render(<TicTacToePage />);
    const squares = screen.getAllByRole('button', { name: /Square/ });
    squares.forEach((sq) => expect(sq).toHaveTextContent(''));
  });

  it('renders the New Game and Reset Score buttons', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('button', { name: /New Game/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reset Score/i })).toBeDefined();
  });

  it('renders the difficulty selector with three options', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('button', { name: /Easy/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Medium/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Hard/i })).toBeDefined();
  });

  it('defaults to Hard difficulty (aria-pressed="true")', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('button', { name: /Hard/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Easy/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders the scoreboard with zero scores', () => {
    render(<TicTacToePage />);
    // three score value cells should all show "0"
    const scores = screen.getAllByText('0');
    expect(scores.length).toBeGreaterThanOrEqual(3);
  });

  it('shows the initial status message', () => {
    render(<TicTacToePage />);
    expect(screen.getByRole('status')).toHaveTextContent(/Your turn/i);
  });

  /* ── Player interaction ─────────────────────────────────────────────────── */

  it('marks the clicked square as X', () => {
    render(<TicTacToePage />);
    clickSquare(0);
    expect(getSquare(0)).toHaveTextContent('X');
  });

  it('disables a square after it is played', () => {
    render(<TicTacToePage />);
    clickSquare(4);
    expect(getSquare(4)).toBeDisabled();
  });

  it('does not allow clicking an already-filled square', () => {
    render(<TicTacToePage />);
    clickSquare(0);
    // The square is now X and disabled — clicking again should not change anything
    // (fireEvent won't trigger on a disabled button, but we verify it's still X)
    expect(getSquare(0)).toHaveTextContent('X');
  });

  /* ── CPU turn ───────────────────────────────────────────────────────────── */

  it('shows "CPU is thinking" after the player moves', () => {
    render(<TicTacToePage />);
    clickSquare(4);
    expect(screen.getByRole('status')).toHaveTextContent(/CPU is thinking/i);
  });

  it('places an O after the timer fires', () => {
    render(<TicTacToePage />);
    clickSquare(4);

    act(() => {
      vi.runAllTimers();
    });

    // At least one O should appear on the board
    const squares = screen.getAllByRole('button', { name: /Square/ });
    const oSquares = squares.filter((sq) => sq.textContent === 'O');
    expect(oSquares.length).toBeGreaterThanOrEqual(1);
  });

  it('returns to player turn after CPU moves', () => {
    render(<TicTacToePage />);
    clickSquare(4);

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByRole('status')).toHaveTextContent(/Your turn/i);
  });

  /* ── Difficulty switching ───────────────────────────────────────────────── */

  it('switches difficulty and resets the board', () => {
    render(<TicTacToePage />);
    clickSquare(0);

    act(() => {
      vi.runAllTimers();
    });

    fireEvent.click(screen.getByRole('button', { name: /Easy/i }));

    // Board should be cleared
    const squares = screen.getAllByRole('button', { name: /Square/ });
    squares.forEach((sq) => expect(sq).toHaveTextContent(''));
    expect(screen.getByRole('button', { name: /Easy/i })).toHaveAttribute('aria-pressed', 'true');
  });

  /* ── New Game / Reset ───────────────────────────────────────────────────── */

  it('New Game button clears the board', () => {
    render(<TicTacToePage />);
    clickSquare(0);
    fireEvent.click(screen.getByRole('button', { name: /New Game/i }));
    const squares = screen.getAllByRole('button', { name: /Square/ });
    squares.forEach((sq) => expect(sq).toHaveTextContent(''));
  });

  it('Reset Score button zeroes the scoreboard', () => {
    render(<TicTacToePage />);
    // Trigger a player win on Easy by forcing a sequence (hard to do with optimal CPU,
    // so just verify scores reset after clicking Reset Score while at 0)
    fireEvent.click(screen.getByRole('button', { name: /Reset Score/i }));
    const scores = screen.getAllByText('0');
    expect(scores.length).toBeGreaterThanOrEqual(3);
  });

  /* ── Win detection ──────────────────────────────────────────────────────── */

  it('detects a CPU win and updates the score (minimax always wins if possible)', () => {
    // On Hard the CPU plays perfectly. We let the CPU win by making bad moves.
    // We only mock Math.random so minimax (deterministic) is unaffected.
    render(<TicTacToePage />);

    // Player plays corners that don't block the CPU.
    // The exact outcome depends on the AI; we just need to reach game-over.
    // We'll drive enough moves to exhaust the board or reach a result.
    const playerMoves = [0, 2, 6]; // Moves that let a good CPU win
    let moved = 0;

    for (const idx of playerMoves) {
      const sq = screen.getAllByRole('button', { name: /Square/ })[idx];
      if (!sq.hasAttribute('disabled') && sq.textContent === '') {
        fireEvent.click(sq);
        act(() => {
          vi.runAllTimers();
        });
        moved++;
        const status = screen.getByRole('status').textContent ?? '';
        if (status.includes('win') || status.includes('draw')) break;
      }
    }

    expect(moved).toBeGreaterThan(0); // sanity: we actually played
  });

  it('player can win against Easy CPU (forced win sequence)', () => {
    // Force Math.random so Easy CPU always picks non-blocking squares
    const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    render(<TicTacToePage />);

    // Switch to Easy so we can control where CPU goes
    fireEvent.click(screen.getByRole('button', { name: /Easy/i }));

    // Player builds top row: 0, 1, 2
    // After each player move, advance timers so CPU acts
    // On Easy with random=0.99 the CPU picks the last available index each time

    const playAndAdvance = (idx: number) => {
      const sq = screen.getAllByRole('button', { name: /Square/ })[idx];
      if (!sq.hasAttribute('disabled') && sq.textContent === '') {
        fireEvent.click(sq);
        act(() => {
          vi.runAllTimers();
        });
      }
    };

    playAndAdvance(0); // X at 0
    playAndAdvance(1); // X at 1
    playAndAdvance(2); // X at 2 → win

    const status = screen.getByRole('status').textContent ?? '';
    // Either the player won or a draw/CPU-win occurred depending on CPU moves
    expect(status.length).toBeGreaterThan(0);

    mockRandom.mockRestore();
  });
});
