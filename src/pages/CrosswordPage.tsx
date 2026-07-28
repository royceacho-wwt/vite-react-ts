import './CrosswordPage.css';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface CellData {
  letter: string; // The correct letter
  number?: number; // Clue number (if start of a word)
  isBlack: boolean; // Black/blocked cell
}

interface UserCell {
  value: string;
  isCorrect: boolean | null; // null = not checked yet
}

interface Clue {
  number: number;
  text: string;
  answer: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
}

/* ── Puzzle Data ───────────────────────────────────────────────────────────── */

// 5x5 crossword puzzle layout
// '.' represents a black cell, letters represent the solution
const PUZZLE_LAYOUT: string[][] = [
  ['R', 'E', 'A', 'C', 'T'],
  ['A', '.', 'P', 'O', 'D'],
  ['I', 'D', 'E', 'A', '.'],
  ['N', 'O', '.', 'T', 'S'],
  ['.', 'G', 'I', 'T', '.'],
];

const CLUES: Clue[] = [
  // Across
  { number: 1, text: 'Popular JavaScript UI library', answer: 'REACT', startRow: 0, startCol: 0, direction: 'across' },
  { number: 5, text: 'Audio broadcast episode', answer: 'POD', startRow: 1, startCol: 2, direction: 'across' },
  { number: 6, text: 'A thought or concept', answer: 'IDEA', startRow: 2, startCol: 0, direction: 'across' },
  { number: 7, text: 'Negative response', answer: 'NO', startRow: 3, startCol: 0, direction: 'across' },
  { number: 8, text: 'Multiple of these make a set', answer: 'TS', startRow: 3, startCol: 3, direction: 'across' },
  { number: 9, text: 'Version control system', answer: 'GIT', startRow: 4, startCol: 1, direction: 'across' },
  // Down
  { number: 1, text: 'Precipitation', answer: 'RAIN', startRow: 0, startCol: 0, direction: 'down' },
  { number: 2, text: 'Consumed food', answer: 'ATE', startRow: 0, startCol: 2, direction: 'down' },
  { number: 3, text: 'Programming language or jacket', answer: 'COAT', startRow: 0, startCol: 3, direction: 'down' },
  { number: 4, text: 'Canine companion', answer: 'DOG', startRow: 1, startCol: 4, direction: 'down' },
  { number: 6, text: 'Identification document', answer: 'ID', startRow: 2, startCol: 1, direction: 'down' },
];

/* ── Helper Functions ──────────────────────────────────────────────────────── */

function buildGrid(): CellData[][] {
  const grid: CellData[][] = [];
  let clueNumber = 1;

  for (let row = 0; row < 5; row++) {
    const rowData: CellData[] = [];
    for (let col = 0; col < 5; col++) {
      const char = PUZZLE_LAYOUT[row][col];
      const isBlack = char === '.';

      // Determine if this cell starts a word (needs a number)
      let needsNumber = false;
      if (!isBlack) {
        // Starts across word: not black, and (at left edge OR left is black) AND has letter to right
        const startsAcross =
          (col === 0 || PUZZLE_LAYOUT[row][col - 1] === '.') && col < 4 && PUZZLE_LAYOUT[row][col + 1] !== '.';

        // Starts down word: not black, and (at top edge OR above is black) AND has letter below
        const startsDown =
          (row === 0 || PUZZLE_LAYOUT[row - 1][col] === '.') && row < 4 && PUZZLE_LAYOUT[row + 1][col] !== '.';

        needsNumber = startsAcross || startsDown;
      }

      rowData.push({
        letter: isBlack ? '' : char,
        number: needsNumber ? clueNumber++ : undefined,
        isBlack,
      });
    }
    grid.push(rowData);
  }

  return grid;
}

function initUserGrid(): UserCell[][] {
  return Array(5)
    .fill(null)
    .map(() =>
      Array(5)
        .fill(null)
        .map(() => ({ value: '', isCorrect: null }))
    );
}

// No-op handler for controlled input (input is handled via keydown)
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/* ── Cell Component ────────────────────────────────────────────────────────── */

interface CrosswordCellProps {
  cell: CellData;
  userCell: UserCell;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: (row: number, col: number) => void;
  onInputRef: (el: HTMLInputElement | null) => void;
}

function CrosswordCell({
  cell,
  userCell,
  row,
  col,
  isSelected,
  isHighlighted,
  onSelect,
  onInputRef,
}: CrosswordCellProps) {
  if (cell.isBlack) {
    return <div className="cw-cell cw-cell--black" aria-hidden="true" />;
  }

  const classes = [
    'cw-cell',
    isSelected ? 'cw-cell--selected' : '',
    isHighlighted ? 'cw-cell--highlighted' : '',
    userCell.isCorrect === true ? 'cw-cell--correct' : '',
    userCell.isCorrect === false ? 'cw-cell--incorrect' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      onClick={() => onSelect(row, col)}
      role="gridcell"
      aria-label={`Row ${row + 1}, Column ${col + 1}`}
    >
      {cell.number && <span className="cw-cell-number">{cell.number}</span>}
      <input
        ref={isSelected ? onInputRef : undefined}
        className="cw-cell-input"
        type="text"
        maxLength={1}
        value={userCell.value}
        onChange={noop}
        onFocus={() => onSelect(row, col)}
        aria-label={`Cell ${row + 1}-${col + 1}${cell.number ? `, clue ${cell.number}` : ''}`}
        readOnly
      />
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────────────────── */

export function CrosswordPage() {
  const [grid] = useState<CellData[][]>(buildGrid);
  const [userGrid, setUserGrid] = useState<UserCell[][]>(initUserGrid);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [isComplete, setIsComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const acrossClues = CLUES.filter((c) => c.direction === 'across');
  const downClues = CLUES.filter((c) => c.direction === 'down');

  // Get cells that are part of the current word
  const getHighlightedCells = useCallback((): Set<string> => {
    if (!selectedCell) return new Set();

    const { row, col } = selectedCell;
    const highlighted = new Set<string>();

    if (direction === 'across') {
      // Find start of word
      let startCol = col;
      while (startCol > 0 && !grid[row][startCol - 1].isBlack) {
        startCol--;
      }
      // Highlight all cells in word
      for (let c = startCol; c < 5 && !grid[row][c].isBlack; c++) {
        highlighted.add(`${row}-${c}`);
      }
    } else {
      // Find start of word
      let startRow = row;
      while (startRow > 0 && !grid[startRow - 1][col].isBlack) {
        startRow--;
      }
      // Highlight all cells in word
      for (let r = startRow; r < 5 && !grid[r][col].isBlack; r++) {
        highlighted.add(`${r}-${col}`);
      }
    }

    return highlighted;
  }, [selectedCell, direction, grid]);

  const highlightedCells = getHighlightedCells();

  // Handle cell selection
  const handleCellSelect = (row: number, col: number) => {
    if (grid[row][col].isBlack) return;

    if (selectedCell?.row === row && selectedCell?.col === col) {
      // Toggle direction if clicking same cell
      setDirection((d) => (d === 'across' ? 'down' : 'across'));
    } else {
      setSelectedCell({ row, col });
    }
  };

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedCell) return;

      const { row, col } = selectedCell;

      if (e.key === 'Backspace') {
        e.preventDefault();
        setUserGrid((prev) => {
          const newGrid = prev.map((r) => r.map((c) => ({ ...c })));
          if (newGrid[row][col].value) {
            newGrid[row][col].value = '';
            newGrid[row][col].isCorrect = null;
          } else {
            // Move to previous cell
            if (direction === 'across' && col > 0 && !grid[row][col - 1].isBlack) {
              setSelectedCell({ row, col: col - 1 });
              newGrid[row][col - 1].value = '';
              newGrid[row][col - 1].isCorrect = null;
            } else if (direction === 'down' && row > 0 && !grid[row - 1][col].isBlack) {
              setSelectedCell({ row: row - 1, col });
              newGrid[row - 1][col].value = '';
              newGrid[row - 1][col].isCorrect = null;
            }
          }
          return newGrid;
        });
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        setDirection((d) => (d === 'across' ? 'down' : 'across'));
        return;
      }

      // Arrow keys
      if (e.key === 'ArrowUp' && row > 0 && !grid[row - 1][col].isBlack) {
        e.preventDefault();
        setSelectedCell({ row: row - 1, col });
        setDirection('down');
        return;
      }
      if (e.key === 'ArrowDown' && row < 4 && !grid[row + 1][col].isBlack) {
        e.preventDefault();
        setSelectedCell({ row: row + 1, col });
        setDirection('down');
        return;
      }
      if (e.key === 'ArrowLeft' && col > 0 && !grid[row][col - 1].isBlack) {
        e.preventDefault();
        setSelectedCell({ row, col: col - 1 });
        setDirection('across');
        return;
      }
      if (e.key === 'ArrowRight' && col < 4 && !grid[row][col + 1].isBlack) {
        e.preventDefault();
        setSelectedCell({ row, col: col + 1 });
        setDirection('across');
        return;
      }

      // Letter input
      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toUpperCase();

        setUserGrid((prev) => {
          const newGrid = prev.map((r) => r.map((c) => ({ ...c })));
          newGrid[row][col].value = letter;
          newGrid[row][col].isCorrect = null;
          return newGrid;
        });

        // Move to next cell
        if (direction === 'across') {
          for (let c = col + 1; c < 5; c++) {
            if (!grid[row][c].isBlack) {
              setSelectedCell({ row, col: c });
              break;
            }
          }
        } else {
          for (let r = row + 1; r < 5; r++) {
            if (!grid[r][col].isBlack) {
              setSelectedCell({ row: r, col });
              break;
            }
          }
        }
      }
    },
    [selectedCell, direction, grid]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Focus input when cell is selected
  useEffect(() => {
    if (selectedCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedCell]);

  // Check answers
  const handleCheck = () => {
    let allCorrect = true;
    let allFilled = true;

    setUserGrid((prev) => {
      const newGrid = prev.map((r, ri) =>
        r.map((c, ci) => {
          if (grid[ri][ci].isBlack) return c;
          if (!c.value) {
            allFilled = false;
            return c;
          }
          const correct = c.value === grid[ri][ci].letter;
          if (!correct) allCorrect = false;
          return { ...c, isCorrect: correct };
        })
      );
      return newGrid;
    });

    if (allFilled && allCorrect) {
      setIsComplete(true);
    }
  };

  // Reveal answers
  const handleReveal = () => {
    setShowAnswers(true);
    setUserGrid((prev) =>
      prev.map((r, ri) =>
        r.map((c, ci) => {
          if (grid[ri][ci].isBlack) return c;
          return { value: grid[ri][ci].letter, isCorrect: true };
        })
      )
    );
    setIsComplete(true);
  };

  // Reset puzzle
  const handleReset = () => {
    setUserGrid(initUserGrid());
    setSelectedCell(null);
    setDirection('across');
    setIsComplete(false);
    setShowAnswers(false);
  };

  // Handle clue click
  const handleClueClick = (clue: Clue) => {
    setSelectedCell({ row: clue.startRow, col: clue.startCol });
    setDirection(clue.direction);
  };

  // Callback ref for input
  const setInputRef = useCallback((el: HTMLInputElement | null) => {
    inputRef.current = el;
  }, []);

  return (
    <main className="cw-page">
      <h1 className="cw-title">📝 Crossword Puzzle</h1>
      <p className="cw-subtitle">Fill in the grid using the clues below</p>

      {isComplete && (
        <div className="cw-complete" role="alert">
          {showAnswers ? '🔍 Answers revealed!' : '🎉 Congratulations! Puzzle complete!'}
        </div>
      )}

      <div className="cw-container">
        {/* Grid */}
        <div className="cw-grid-wrapper">
          <div className="cw-grid" role="grid" aria-label="Crossword puzzle grid">
            {grid.map((row, ri) => (
              <div key={ri} className="cw-row" role="row">
                {row.map((cell, ci) => (
                  <CrosswordCell
                    key={`${ri}-${ci}`}
                    cell={cell}
                    userCell={userGrid[ri][ci]}
                    row={ri}
                    col={ci}
                    isSelected={selectedCell?.row === ri && selectedCell?.col === ci}
                    isHighlighted={highlightedCells.has(`${ri}-${ci}`)}
                    onSelect={handleCellSelect}
                    onInputRef={setInputRef}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="cw-direction-indicator" aria-live="polite">
            Direction: <strong>{direction === 'across' ? '→ Across' : '↓ Down'}</strong>
            <span className="cw-direction-hint">(Press Tab to switch)</span>
          </div>

          {/* Actions */}
          <div className="cw-actions">
            <button className="cw-btn cw-btn--primary" onClick={handleCheck} disabled={isComplete}>
              ✓ Check
            </button>
            <button className="cw-btn cw-btn--secondary" onClick={handleReveal} disabled={isComplete}>
              👁️ Reveal
            </button>
            <button className="cw-btn cw-btn--secondary" onClick={handleReset}>
              🔄 Reset
            </button>
          </div>
        </div>

        {/* Clues */}
        <div className="cw-clues">
          <div className="cw-clues-section">
            <h2 className="cw-clues-title">Across</h2>
            <ul className="cw-clues-list">
              {acrossClues.map((clue) => (
                <li
                  key={`across-${clue.number}`}
                  className={`cw-clue${
                    selectedCell?.row === clue.startRow &&
                    direction === 'across' &&
                    highlightedCells.has(`${clue.startRow}-${clue.startCol}`)
                      ? ' cw-clue--active'
                      : ''
                  }`}
                  onClick={() => handleClueClick(clue)}
                >
                  <span className="cw-clue-number">{clue.number}.</span>
                  <span className="cw-clue-text">{clue.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="cw-clues-section">
            <h2 className="cw-clues-title">Down</h2>
            <ul className="cw-clues-list">
              {downClues.map((clue) => (
                <li
                  key={`down-${clue.number}`}
                  className={`cw-clue${
                    selectedCell?.col === clue.startCol &&
                    direction === 'down' &&
                    highlightedCells.has(`${clue.startRow}-${clue.startCol}`)
                      ? ' cw-clue--active'
                      : ''
                  }`}
                  onClick={() => handleClueClick(clue)}
                >
                  <span className="cw-clue-number">{clue.number}.</span>
                  <span className="cw-clue-text">{clue.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="cw-instructions">
        <h3>How to Play</h3>
        <ul>
          <li>Click a cell to select it, then type a letter</li>
          <li>
            Click the same cell again or press <kbd>Tab</kbd> to switch direction
          </li>
          <li>
            Use <kbd>Arrow keys</kbd> to navigate
          </li>
          <li>
            Press <kbd>Backspace</kbd> to delete
          </li>
          <li>Click a clue to jump to that word</li>
        </ul>
      </div>
    </main>
  );
}
