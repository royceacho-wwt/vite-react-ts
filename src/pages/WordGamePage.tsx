import './WordGamePage.css';

import { useCallback, useState } from 'react';

import { WORD_GAME_DICTIONARY } from '@/data/wordGameDictionary';
import { WORD_GAME_TARGETS } from '@/data/wordGameTargets';

/* ── Types ─────────────────────────────────────────────────────────────────── */

export type TileState = 'correct' | 'present' | 'absent' | 'empty';

export interface Tile {
  letter: string; // uppercase single char, or '' for empty
  state: TileState;
}

export type Row = [Tile, Tile, Tile, Tile, Tile];

interface GameState {
  target: string;
  rows: Row[];
  currentAttempt: number;
  status: 'playing' | 'won' | 'lost';
}

/* ── Pure logic functions ───────────────────────────────────────────────────── */

/** Returns the index-to-TileState mapping for a 5-letter guess against a target. */
export function scoreGuess(guess: string, target: string): TileState[] {
  const g = guess.toUpperCase();
  const t = target.toUpperCase();
  const result: TileState[] = ['absent', 'absent', 'absent', 'absent', 'absent'];

  // Track remaining target letter counts for the Present pass
  const remaining: Record<string, number> = {};
  for (let i = 0; i < 5; i++) {
    remaining[t[i]] = (remaining[t[i]] ?? 0) + 1;
  }

  // Pass 1 — exact matches (correct)
  for (let i = 0; i < 5; i++) {
    if (g[i] === t[i]) {
      result[i] = 'correct';
      remaining[t[i]]--;
    }
  }

  // Pass 2 — present (wrong position, but letter still available)
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    if (remaining[g[i]] && remaining[g[i]] > 0) {
      result[i] = 'present';
      remaining[g[i]]--;
    }
  }

  return result;
}

/** Returns true when the word (case-insensitive) is in the dictionary. */
export function isInDictionary(word: string): boolean {
  return WORD_GAME_DICTIONARY.has(word.toUpperCase());
}

/** Picks one entry at random from the targets array. */
export function pickRandomTarget(targets: string[]): string {
  return targets[Math.floor(Math.random() * targets.length)];
}

/* ── Initial state builder ─────────────────────────────────────────────────── */

function emptyRow(): Row {
  return [
    { letter: '', state: 'empty' },
    { letter: '', state: 'empty' },
    { letter: '', state: 'empty' },
    { letter: '', state: 'empty' },
    { letter: '', state: 'empty' },
  ];
}

function buildInitialState(targets: string[] = WORD_GAME_TARGETS): GameState {
  return {
    target: pickRandomTarget(targets),
    rows: [emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()],
    currentAttempt: 0,
    status: 'playing',
  };
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

interface TileProps {
  tile: Tile;
}

function TileCell({ tile }: TileProps) {
  const stateClass = tile.state !== 'empty' ? ` wg-tile--${tile.state}` : '';
  const filled = tile.letter !== '' ? ' wg-tile--filled' : '';
  const ariaLabel = tile.state === 'empty' || tile.letter === '' ? 'empty' : `${tile.letter}, ${tile.state}`;

  return (
    <div className={`wg-tile${stateClass}${filled}`} aria-label={ariaLabel}>
      {tile.letter}
    </div>
  );
}

interface GuessBoardProps {
  rows: Row[];
}

function GuessBoard({ rows }: GuessBoardProps) {
  return (
    <div className="wg-board" aria-label="Guess board" role="grid">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="wg-row" role="row">
          {row.map((tile, tileIdx) => (
            <TileCell key={tileIdx} tile={tile} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface GuessInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  errorMessage: string;
}

function GuessInput({ value, onChange, onSubmit, disabled, errorMessage }: GuessInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSubmit();
  };

  return (
    <div className="wg-input-area">
      <label className="wg-input-label" htmlFor="wg-guess-input">
        Your guess
      </label>
      <div className="wg-input-row">
        <input
          id="wg-guess-input"
          className="wg-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={10}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="Enter 5-letter word"
          aria-label="Enter your guess"
        />
        <button className="wg-btn wg-btn--primary" onClick={onSubmit} disabled={disabled} aria-label="Submit guess">
          Submit
        </button>
      </div>
      <div className="wg-error" role="alert" aria-live="polite" aria-atomic="true">
        {errorMessage}
      </div>
    </div>
  );
}

interface StatusMessageProps {
  status: 'playing' | 'won' | 'lost';
  target: string;
  onPlayAgain: () => void;
}

function StatusMessage({ status, target, onPlayAgain }: StatusMessageProps) {
  if (status === 'playing') return null;

  const message = status === 'won' ? 'You got it! 🎉' : `The word was ${target}. Better luck next time!`;

  return (
    <div className="wg-status" role="status" aria-live="polite">
      <p className={`wg-status-message${status === 'won' ? ' wg-status-message--win' : ' wg-status-message--loss'}`}>
        {message}
      </p>
      <button className="wg-btn wg-btn--primary" onClick={onPlayAgain} aria-label="Play again">
        Play Again
      </button>
    </div>
  );
}

/* ── Page component ─────────────────────────────────────────────────────────── */

export function WordGamePage() {
  const [game, setGame] = useState<GameState>(() => buildInitialState());
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useCallback(() => {
    if (game.status !== 'playing') return;

    const guess = inputValue.trim().toUpperCase();

    // Validation: length
    if (guess.length !== 5) {
      setErrorMessage('Guess must be exactly 5 letters.');
      return;
    }

    // Validation: dictionary
    if (!isInDictionary(guess)) {
      setErrorMessage('Not a recognised word. Try again!');
      return;
    }

    // Clear error on valid guess
    setErrorMessage('');

    const states = scoreGuess(guess, game.target);
    const newRow: Row = guess.split('').map((letter, i) => ({
      letter,
      state: states[i],
    })) as Row;

    const newRows = game.rows.map((row, idx) => (idx === game.currentAttempt ? newRow : row)) as Row[];

    const nextAttempt = game.currentAttempt + 1;
    const won = states.every((s) => s === 'correct');
    const lost = !won && nextAttempt >= 6;

    setGame({
      ...game,
      rows: newRows,
      currentAttempt: nextAttempt,
      status: won ? 'won' : lost ? 'lost' : 'playing',
    });

    setInputValue('');
  }, [game, inputValue]);

  const handlePlayAgain = useCallback(() => {
    setGame(buildInitialState());
    setInputValue('');
    setErrorMessage('');
  }, []);

  const inputDisabled = game.status !== 'playing';

  return (
    <main className="wg-page">
      <h1 className="wg-title">🟩 Word Game</h1>
      <p className="wg-subtitle">Guess the 5-letter word in 6 tries!</p>

      <GuessBoard rows={game.rows} />

      <GuessInput
        value={inputValue}
        onChange={(val) => {
          setInputValue(val);
          if (errorMessage) setErrorMessage('');
        }}
        onSubmit={handleSubmit}
        disabled={inputDisabled}
        errorMessage={errorMessage}
      />

      <StatusMessage status={game.status} target={game.target} onPlayAgain={handlePlayAgain} />
    </main>
  );
}
