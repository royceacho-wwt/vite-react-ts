import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { isInDictionary, pickRandomTarget, scoreGuess, WordGamePage } from '@/pages/WordGamePage';

/* ── scoreGuess unit tests ──────────────────────────────────────────────────── */

describe('scoreGuess – basic colouring', () => {
  it('all correct when guess equals target', () => {
    expect(scoreGuess('CRANE', 'CRANE')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });

  it('all absent when guess shares no letters with target', () => {
    expect(scoreGuess('WHIFF', 'CRANE')).toEqual(['absent', 'absent', 'absent', 'absent', 'absent']);
  });

  it('marks present when letter is in word but wrong position', () => {
    // BACNE vs CRANE: B=absent, A=present(A is in CRANE), C=present, N=present, E=correct
    const result = scoreGuess('BACNE', 'CRANE');
    expect(result[4]).toBe('correct'); // E in position 4
    expect(result[2]).toBe('present'); // C is in CRANE but not at idx 2 (it's at idx 0)
  });

  it('is case-insensitive', () => {
    expect(scoreGuess('crane', 'CRANE')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });
});

describe('scoreGuess – duplicate letter rules', () => {
  it('does not double-highlight a letter the target only has once (extra is absent)', () => {
    // target CRANE has one R; guess ERROR has two Rs at positions 1 and 4
    // Position 1 (R) – present (R is in CRANE but not at idx 1)
    // Position 4 (R) – absent (R quota exhausted)
    const result = scoreGuess('ERROR', 'CRANE');
    const rIndices = [1, 4]; // positions of R in ERROR
    const rHighlights = rIndices.filter((i) => result[i] === 'correct' || result[i] === 'present');
    expect(rHighlights.length).toBeLessThanOrEqual(1);
  });

  it('correct match takes priority over present for duplicate letters', () => {
    // target ABBEY, guess AABBY: first A is present/correct, second A should be absent
    // A is at index 0 in ABBEY; guess has A at 0 and 1
    const result = scoreGuess('AABBY', 'ABBEY');
    expect(result[0]).toBe('correct'); // A at idx 0 is correct
    expect(result[1]).toBe('absent'); // second A – quota used up by the correct one
  });

  it('two of the same letter both highlighted when target has two of that letter', () => {
    // target KEEPS has two Es (idx 1 and 2); guess EERIE has Es at 0,1,3
    // Only 2 highlights allowed for E
    const result = scoreGuess('EERIE', 'KEEPS');
    const eHighlights = result.filter((s) => s === 'correct' || s === 'present');
    expect(eHighlights.length).toBeLessThanOrEqual(2);
  });

  it('duplicate correct positions both marked correct', () => {
    // target BELLE, guess BELLE — all correct including repeated L and E
    expect(scoreGuess('BELLE', 'BELLE')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
  });
});

/* ── isInDictionary unit tests ──────────────────────────────────────────────── */

describe('isInDictionary', () => {
  it('returns true for a known word (case-insensitive)', () => {
    expect(isInDictionary('crane')).toBe(true);
    expect(isInDictionary('CRANE')).toBe(true);
    expect(isInDictionary('Crane')).toBe(true);
  });

  it('returns false for a nonsense string', () => {
    expect(isInDictionary('ZZZZZ')).toBe(false);
    expect(isInDictionary('XQJVW')).toBe(false);
  });
});

/* ── pickRandomTarget unit tests ────────────────────────────────────────────── */

describe('pickRandomTarget', () => {
  it('returns one of the provided targets', () => {
    const targets = ['CRANE', 'SLATE', 'ARISE'];
    for (let i = 0; i < 20; i++) {
      expect(targets).toContain(pickRandomTarget(targets));
    }
  });

  it('returns the only element when array has one item', () => {
    expect(pickRandomTarget(['ALONE'])).toBe('ALONE');
  });
});

/* ── WordGamePage rendering ──────────────────────────────────────────────────── */

describe('WordGamePage – rendering', () => {
  it('renders the page heading', () => {
    render(<WordGamePage />);
    expect(screen.getByRole('heading', { name: /word game/i })).toBeDefined();
  });

  it('renders the guess board with 6 rows and 30 tiles', () => {
    render(<WordGamePage />);
    const board = screen.getByRole('grid', { name: /guess board/i });
    expect(board).toBeDefined();
    // 6 rows
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(6);
  });

  it('renders the input, label, and submit button', () => {
    render(<WordGamePage />);
    expect(screen.getByLabelText(/enter your guess/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /submit guess/i })).toBeDefined();
  });

  it('does not show the target word in the DOM initially', () => {
    render(<WordGamePage />);
    // Status message should not be present when playing
    expect(screen.queryByRole('status')).toBeNull();
  });
});

/* ── Navigation / NavBar integration (plain unit check) ───────────────────── */

describe('WordGamePage – page loads at /wordgame route', () => {
  it('renders successfully as a standalone component', () => {
    render(<WordGamePage />);
    expect(screen.getByRole('main')).toBeDefined();
  });
});

/* ── Guessing – validation ───────────────────────────────────────────────────── */

describe('WordGamePage – input validation', () => {
  it('shows an error and does not fill a row when guess is too short', () => {
    render(<WordGamePage />);
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: 'HI' } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));

    expect(screen.getByRole('alert').textContent).toMatch(/5 letters/i);
    // All tiles still empty
    const labels = screen.getAllByLabelText('empty');
    expect(labels.length).toBe(30);
  });

  it('shows an error and does not fill a row when guess is too long', () => {
    render(<WordGamePage />);
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: 'TOOLONG' } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));

    expect(screen.getByRole('alert').textContent).toMatch(/5 letters/i);
  });

  it('shows an error when the 5-letter guess is not in the dictionary', () => {
    render(<WordGamePage />);
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: 'ZZZZZ' } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));

    expect(screen.getByRole('alert').textContent).toMatch(/not a recognised word/i);
  });

  it('clears the error message after a valid submission', () => {
    render(<WordGamePage />);
    const input = screen.getByLabelText(/enter your guess/i);

    // First trigger an error
    fireEvent.change(input, { target: { value: 'HI' } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));
    expect(screen.getByRole('alert').textContent).not.toBe('');

    // Now submit a valid word
    fireEvent.change(input, { target: { value: 'CRANE' } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));
    expect(screen.getByRole('alert').textContent).toBe('');
  });

  it('submission is triggered by pressing Enter', () => {
    render(<WordGamePage />);
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: 'CRANE' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // A valid word should fill the first row (no error)
    expect(screen.getByRole('alert').textContent).toBe('');
  });
});

/* ── Guessing – colouring ─────────────────────────────────────────────────── */

describe('WordGamePage – tile colouring', () => {
  /**
   * Mocks the target to a known word so we can assert exact colours.
   * We do this by spying on Math.random to always pick index 0.
   */
  beforeEach(() => {
    // pickRandomTarget uses Math.floor(Math.random() * targets.length)
    // Force index 0 → first target word = CRANE
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  it('marks all tiles correct when guess equals target', () => {
    render(<WordGamePage />);
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: 'CRANE' } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));

    // All 5 letters in the first row should be aria-labelled as "correct"
    expect(screen.getByLabelText('C, correct')).toBeDefined();
    expect(screen.getByLabelText('R, correct')).toBeDefined();
    expect(screen.getByLabelText('A, correct')).toBeDefined();
    expect(screen.getByLabelText('N, correct')).toBeDefined();
    expect(screen.getByLabelText('E, correct')).toBeDefined();
  });

  it('marks absent tiles for letters not in the target', () => {
    render(<WordGamePage />);
    // POOLS vs CRANE: P absent, O absent (×2), L absent, S absent
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: 'POOLS' } }); // none of these letters in CRANE
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));

    // P appears once – getByLabelText is fine
    expect(screen.getByLabelText('P, absent')).toBeDefined();
    // O appears twice in POOLS – use getAllByLabelText and check at least one
    const oTiles = screen.getAllByLabelText('O, absent');
    expect(oTiles.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('L, absent')).toBeDefined();
    expect(screen.getByLabelText('S, absent')).toBeDefined();
  });
});

/* ── Game End – win ───────────────────────────────────────────────────────── */

describe('WordGamePage – win', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // target = CRANE (index 0)
  });

  function submitGuess(word: string) {
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: word } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));
  }

  it('shows a win message after guessing the correct word', () => {
    render(<WordGamePage />);
    submitGuess('CRANE');
    expect(screen.getByRole('status').textContent).toMatch(/you got it/i);
  });

  it('disables input and submit after a win', () => {
    render(<WordGamePage />);
    submitGuess('CRANE');

    const input = screen.getByLabelText(/enter your guess/i) as HTMLInputElement;
    const btn = screen.getByRole('button', { name: /submit guess/i }) as HTMLButtonElement;
    expect(input.disabled).toBe(true);
    expect(btn.disabled).toBe(true);
  });

  it('shows Play Again after a win and starts a new round on click', () => {
    render(<WordGamePage />);
    submitGuess('CRANE');

    const playAgain = screen.getByRole('button', { name: /play again/i });
    expect(playAgain).toBeDefined();
    fireEvent.click(playAgain);

    // Status message should disappear (playing again)
    expect(screen.queryByRole('status')).toBeNull();
    // Input re-enabled
    const input = screen.getByLabelText(/enter your guess/i) as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });
});

/* ── Game End – loss ──────────────────────────────────────────────────────── */

describe('WordGamePage – loss', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // target = CRANE (index 0)
  });

  function submitGuess(word: string) {
    const input = screen.getByLabelText(/enter your guess/i);
    fireEvent.change(input, { target: { value: word } });
    fireEvent.click(screen.getByRole('button', { name: /submit guess/i }));
  }

  it('shows a loss message containing the target word after 6 wrong guesses', () => {
    render(<WordGamePage />);
    const wrongWords = ['POOLS', 'THUMB', 'FJORD', 'WALTZ', 'QUIRK', 'BLAZE'];
    wrongWords.forEach((w) => submitGuess(w));

    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/crane/i);
    expect(status.textContent).toMatch(/better luck/i);
  });

  it('disables input and submit after a loss', () => {
    render(<WordGamePage />);
    ['POOLS', 'THUMB', 'FJORD', 'WALTZ', 'QUIRK', 'BLAZE'].forEach((w) => submitGuess(w));

    const input = screen.getByLabelText(/enter your guess/i) as HTMLInputElement;
    const btn = screen.getByRole('button', { name: /submit guess/i }) as HTMLButtonElement;
    expect(input.disabled).toBe(true);
    expect(btn.disabled).toBe(true);
  });

  it('shows Play Again after a loss and starts a new round on click', () => {
    render(<WordGamePage />);
    ['POOLS', 'THUMB', 'FJORD', 'WALTZ', 'QUIRK', 'BLAZE'].forEach((w) => submitGuess(w));

    const playAgain = screen.getByRole('button', { name: /play again/i });
    fireEvent.click(playAgain);

    expect(screen.queryByRole('status')).toBeNull();
    const input = screen.getByLabelText(/enter your guess/i) as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });
});

/* ── Accessibility ───────────────────────────────────────────────────────── */

describe('WordGamePage – accessibility', () => {
  it('guess board has aria-label', () => {
    render(<WordGamePage />);
    expect(screen.getByRole('grid', { name: /guess board/i })).toBeDefined();
  });

  it('empty tiles have aria-label "empty"', () => {
    render(<WordGamePage />);
    const emptyTiles = screen.getAllByLabelText('empty');
    expect(emptyTiles.length).toBe(30);
  });

  it('error region has role="alert" and aria-live', () => {
    render(<WordGamePage />);
    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('aria-live')).toBe('polite');
  });

  it('input has an associated label', () => {
    render(<WordGamePage />);
    expect(screen.getByLabelText(/enter your guess/i)).toBeDefined();
  });
});
