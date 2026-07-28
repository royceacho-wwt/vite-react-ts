import './CrosswordPage.css';

import { useCallback, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Clue {
  number: number;
  text: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

interface Cell {
  letter: string;
  number?: number;
  isBlocked: boolean;
  clueAcross?: number;
  clueDown?: number;
}

/* ── Puzzle Data ───────────────────────────────────────────────────────────── */

const CLUES: Clue[] = [
  // Across
  { number: 1, text: 'Stringed instrument played with a bow', answer: 'VIOLIN', row: 0, col: 0, direction: 'across' },
  { number: 4, text: 'Musical symbol indicating silence', answer: 'REST', row: 2, col: 3, direction: 'across' },
  { number: 6, text: 'Lowest female singing voice', answer: 'ALTO', row: 4, col: 0, direction: 'across' },
  { number: 7, text: 'Group of singers performing together', answer: 'CHOIR', row: 6, col: 2, direction: 'across' },
  // Down
  { number: 1, text: 'Speed of music (Italian term)', answer: 'TEMPO', row: 0, col: 0, direction: 'down' },
  { number: 2, text: 'Large brass instrument', answer: 'TUBA', row: 0, col: 3, direction: 'down' },
  { number: 3, text: 'Musical composition for orchestra', answer: 'SONATA', row: 0, col: 5, direction: 'down' },
  { number: 5, text: 'Keyboard instrument with pipes', answer: 'ORGAN', row: 2, col: 6, direction: 'down' },
];

const GRID_SIZE = 8;

/* ── Build grid from clues ─────────────────────────────────────────────────── */

function buildGrid(clues: Clue[]): Cell[][] {
  // Initialize all cells as blocked
  const grid: Cell[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      letter: '',
      isBlocked: true,
    }))
  );

  // Mark cells used by clues as unblocked
  for (const clue of clues) {
    const { row, col, answer, direction, number } = clue;
    for (let i = 0; i < answer.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      if (r < GRID_SIZE && c < GRID_SIZE) {
        grid[r][c].isBlocked = false;
        if (i === 0) {
          grid[r][c].number = number;
        }
        if (direction === 'across') {
          grid[r][c].clueAcross = number;
        } else {
          grid[r][c].clueDown = number;
        }
      }
    }
  }

  return grid;
}

function buildSolution(clues: Clue[]): Map<string, string> {
  const solution = new Map<string, string>();
  for (const clue of clues) {
    const { row, col, answer, direction } = clue;
    for (let i = 0; i < answer.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;
      solution.set(`${r}-${c}`, answer[i]);
    }
  }
  return solution;
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

interface CellProps {
  cell: Cell;
  row: number;
  col: number;
  value: string;
  isSelected: boolean;
  isHighlighted: boolean;
  isCorrect: boolean | null;
  onChange: (value: string) => void;
  onFocus: () => void;
}

function CrosswordCell({ cell, row, col, value, isSelected, isHighlighted, isCorrect, onChange, onFocus }: CellProps) {
  if (cell.isBlocked) {
    return <div className="cw-cell cw-cell--blocked" aria-hidden="true" />;
  }

  const classes = [
    'cw-cell',
    isSelected && 'cw-cell--selected',
    isHighlighted && 'cw-cell--highlighted',
    isCorrect === true && 'cw-cell--correct',
    isCorrect === false && 'cw-cell--incorrect',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {cell.number && <span className="cw-cell-number">{cell.number}</span>}
      <input
        className="cw-cell-input"
        type="text"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onFocus={onFocus}
        aria-label={`Row ${row + 1}, Column ${col + 1}${cell.number ? `, Clue ${cell.number}` : ''}`}
      />
    </div>
  );
}

interface ClueListProps {
  title: string;
  clues: Clue[];
  selectedClue: number | null;
  onSelectClue: (number: number) => void;
}

function ClueList({ title, clues, selectedClue, onSelectClue }: ClueListProps) {
  return (
    <div className="cw-clue-section">
      <h3 className="cw-clue-title">{title}</h3>
      <ul className="cw-clue-list">
        {clues.map((clue) => (
          <li key={clue.number}>
            <button
              className={`cw-clue-item${selectedClue === clue.number ? ' cw-clue-item--selected' : ''}`}
              onClick={() => onSelectClue(clue.number)}
              aria-label={`Clue ${clue.number}: ${clue.text}`}
            >
              <span className="cw-clue-number">{clue.number}.</span>
              <span className="cw-clue-text">{clue.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Page component ─────────────────────────────────────────────────────────── */

export function CrosswordPage() {
  const [grid] = useState(() => buildGrid(CLUES));
  const [solution] = useState(() => buildSolution(CLUES));
  const [userInput, setUserInput] = useState<Map<string, string>>(new Map());
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  const acrossClues = CLUES.filter((c) => c.direction === 'across');
  const downClues = CLUES.filter((c) => c.direction === 'down');

  const handleCellChange = useCallback((row: number, col: number, value: string) => {
    setUserInput((prev) => {
      const next = new Map(prev);
      if (value) {
        next.set(`${row}-${col}`, value);
      } else {
        next.delete(`${row}-${col}`);
      }
      return next;
    });
    setShowResults(false);
  }, []);

  const handleCellFocus = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      const cell = grid[row][col];
      // Prefer across clue if available
      if (cell.clueAcross) {
        setSelectedClue(cell.clueAcross);
      } else if (cell.clueDown) {
        setSelectedClue(cell.clueDown);
      }
    },
    [grid]
  );

  const handleSelectClue = useCallback((number: number) => {
    setSelectedClue(number);
    const clue = CLUES.find((c) => c.number === number);
    if (clue) {
      setSelectedCell({ row: clue.row, col: clue.col });
    }
  }, []);

  const handleCheck = useCallback(() => {
    setShowResults(true);
  }, []);

  const handleReveal = useCallback(() => {
    const revealed = new Map<string, string>();
    solution.forEach((letter, key) => {
      revealed.set(key, letter);
    });
    setUserInput(revealed);
    setShowResults(true);
  }, [solution]);

  const handleClear = useCallback(() => {
    setUserInput(new Map());
    setShowResults(false);
  }, []);

  const isHighlighted = useCallback(
    (row: number, col: number) => {
      if (!selectedClue) return false;
      const clue = CLUES.find((c) => c.number === selectedClue);
      if (!clue) return false;

      if (clue.direction === 'across') {
        return row === clue.row && col >= clue.col && col < clue.col + clue.answer.length;
      } else {
        return col === clue.col && row >= clue.row && row < clue.row + clue.answer.length;
      }
    },
    [selectedClue]
  );

  const getCellCorrectness = useCallback(
    (row: number, col: number): boolean | null => {
      if (!showResults) return null;
      const key = `${row}-${col}`;
      const userLetter = userInput.get(key);
      const correctLetter = solution.get(key);
      if (!userLetter) return null;
      return userLetter === correctLetter;
    },
    [showResults, userInput, solution]
  );

  // Calculate completion percentage
  const totalCells = Array.from(solution.keys()).length;
  const correctCells = Array.from(solution.entries()).filter(([key, letter]) => userInput.get(key) === letter).length;
  const completionPercent = Math.round((correctCells / totalCells) * 100);

  return (
    <main className="cw-page">
      <h1 className="cw-title">🎵 Music Crossword</h1>
      <p className="cw-subtitle">Test your music knowledge with this crossword puzzle!</p>

      <div className="cw-container">
        <div className="cw-grid-wrapper">
          <div className="cw-grid" role="grid" aria-label="Crossword grid">
            {grid.map((row, rowIdx) => (
              <div key={rowIdx} className="cw-row" role="row">
                {row.map((cell, colIdx) => (
                  <CrosswordCell
                    key={`${rowIdx}-${colIdx}`}
                    cell={cell}
                    row={rowIdx}
                    col={colIdx}
                    value={userInput.get(`${rowIdx}-${colIdx}`) || ''}
                    isSelected={selectedCell?.row === rowIdx && selectedCell?.col === colIdx}
                    isHighlighted={isHighlighted(rowIdx, colIdx)}
                    isCorrect={getCellCorrectness(rowIdx, colIdx)}
                    onChange={(value) => handleCellChange(rowIdx, colIdx, value)}
                    onFocus={() => handleCellFocus(rowIdx, colIdx)}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="cw-actions">
            <button className="cw-btn cw-btn--primary" onClick={handleCheck} aria-label="Check answers">
              ✓ Check
            </button>
            <button className="cw-btn cw-btn--secondary" onClick={handleReveal} aria-label="Reveal answers">
              👁️ Reveal
            </button>
            <button className="cw-btn cw-btn--secondary" onClick={handleClear} aria-label="Clear grid">
              🗑️ Clear
            </button>
          </div>

          {showResults && (
            <div className="cw-progress" role="status" aria-live="polite">
              <div className="cw-progress-bar">
                <div
                  className="cw-progress-fill"
                  style={{ width: `${completionPercent}%` }}
                  aria-label={`${completionPercent}% complete`}
                />
              </div>
              <span className="cw-progress-text">
                {completionPercent === 100 ? '🎉 Complete!' : `${completionPercent}% correct`}
              </span>
            </div>
          )}
        </div>

        <div className="cw-clues">
          <ClueList title="Across" clues={acrossClues} selectedClue={selectedClue} onSelectClue={handleSelectClue} />
          <ClueList title="Down" clues={downClues} selectedClue={selectedClue} onSelectClue={handleSelectClue} />
        </div>
      </div>
    </main>
  );
}
