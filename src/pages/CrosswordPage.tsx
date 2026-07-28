import './CrosswordPage.css';

import { useCallback, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Clue {
  number: number;
  direction: 'across' | 'down';
  clue: string;
  answer: string;
  row: number;
  col: number;
}

interface CellData {
  letter: string;
  userInput: string;
  isBlocked: boolean;
  number?: number;
  acrossClue?: number;
  downClue?: number;
}

/* ── Music-themed clues ─────────────────────────────────────────────────────── */

const CLUES: Clue[] = [
  { number: 1, direction: 'across', clue: 'Queen\'s "Bohemian ___"', answer: 'RHAPSODY', row: 0, col: 0 },
  {
    number: 2,
    direction: 'across',
    clue: 'Stringed instrument with a neck and frets',
    answer: 'GUITAR',
    row: 2,
    col: 1,
  },
  { number: 3, direction: 'across', clue: 'Musical speed or pace', answer: 'TEMPO', row: 4, col: 3 },
  { number: 4, direction: 'across', clue: 'Group of singers', answer: 'CHOIR', row: 6, col: 0 },
  { number: 5, direction: 'down', clue: 'Percussion instrument hit with sticks', answer: 'DRUMS', row: 0, col: 0 },
  { number: 6, direction: 'down', clue: 'Musical symbol at the start of a staff', answer: 'CLEF', row: 1, col: 4 },
  { number: 7, direction: 'down', clue: 'The "King of Pop"', answer: 'MICHAEL', row: 0, col: 7 },
  { number: 8, direction: 'down', clue: 'A song for two voices', answer: 'DUET', row: 3, col: 2 },
];

const GRID_SIZE = 8;

/* ── Build the grid ─────────────────────────────────────────────────────────── */

function buildGrid(clues: Clue[]): CellData[][] {
  // Initialize empty grid
  const grid: CellData[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({
      letter: '',
      userInput: '',
      isBlocked: true,
    }))
  );

  // Place answers on the grid
  for (const clue of clues) {
    const { answer, row, col, direction, number } = clue;
    for (let i = 0; i < answer.length; i++) {
      const r = direction === 'across' ? row : row + i;
      const c = direction === 'across' ? col + i : col;

      if (r < GRID_SIZE && c < GRID_SIZE) {
        grid[r][c].letter = answer[i];
        grid[r][c].isBlocked = false;

        if (direction === 'across') {
          grid[r][c].acrossClue = number;
        } else {
          grid[r][c].downClue = number;
        }
      }
    }

    // Set the number on the starting cell
    if (row < GRID_SIZE && col < GRID_SIZE) {
      grid[row][col].number = number;
    }
  }

  return grid;
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

interface CellProps {
  cell: CellData;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean;
  isCorrect: boolean;
  isIncorrect: boolean;
  onSelect: (row: number, col: number) => void;
  onInput: (row: number, col: number, value: string) => void;
}

function Cell({ cell, row, col, isSelected, isHighlighted, isCorrect, isIncorrect, onSelect, onInput }: CellProps) {
  if (cell.isBlocked) {
    return <div className="cw-cell cw-cell--blocked" />;
  }

  let className = 'cw-cell';
  if (isSelected) className += ' cw-cell--selected';
  else if (isHighlighted) className += ' cw-cell--highlighted';
  if (isCorrect) className += ' cw-cell--correct';
  if (isIncorrect) className += ' cw-cell--incorrect';

  return (
    <div className={className} onClick={() => onSelect(row, col)}>
      {cell.number && <span className="cw-cell-number">{cell.number}</span>}
      <input
        className="cw-cell-input"
        type="text"
        maxLength={1}
        value={cell.userInput}
        onChange={(e) => onInput(row, col, e.target.value.toUpperCase())}
        onFocus={() => onSelect(row, col)}
        aria-label={`Cell ${row + 1}, ${col + 1}`}
      />
    </div>
  );
}

interface ClueListProps {
  clues: Clue[];
  direction: 'across' | 'down';
  selectedClue: number | null;
  onSelectClue: (clueNumber: number, direction: 'across' | 'down') => void;
}

function ClueList({ clues, direction, selectedClue, onSelectClue }: ClueListProps) {
  const filteredClues = clues.filter((c) => c.direction === direction);

  return (
    <div className="cw-clue-section">
      <h3 className="cw-clue-heading">{direction === 'across' ? 'Across' : 'Down'}</h3>
      <ul className="cw-clue-list">
        {filteredClues.map((clue) => (
          <li
            key={`${clue.direction}-${clue.number}`}
            className={`cw-clue-item${selectedClue === clue.number ? ' cw-clue-item--selected' : ''}`}
            onClick={() => onSelectClue(clue.number, clue.direction)}
          >
            <span className="cw-clue-number">{clue.number}.</span>
            <span className="cw-clue-text">{clue.clue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Page component ─────────────────────────────────────────────────────────── */

export function CrosswordPage() {
  const [grid, setGrid] = useState<CellData[][]>(() => buildGrid(CLUES));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [showAnswers, setShowAnswers] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleCellSelect = useCallback(
    (row: number, col: number) => {
      if (grid[row][col].isBlocked) return;

      // If clicking the same cell, toggle direction
      if (selectedCell?.row === row && selectedCell?.col === col) {
        setSelectedDirection((prev) => (prev === 'across' ? 'down' : 'across'));
      } else {
        setSelectedCell({ row, col });
      }
    },
    [grid, selectedCell]
  );

  const handleInput = useCallback(
    (row: number, col: number, value: string) => {
      const newGrid = grid.map((r) => r.map((c) => ({ ...c })));
      newGrid[row][col].userInput = value;
      setGrid(newGrid);

      // Check if puzzle is complete
      const allFilled = newGrid.every((r) => r.every((c) => c.isBlocked || c.userInput === c.letter));
      if (allFilled) {
        setIsComplete(true);
      }
    },
    [grid]
  );

  const handleClueSelect = useCallback((clueNumber: number, direction: 'across' | 'down') => {
    const clue = CLUES.find((c) => c.number === clueNumber && c.direction === direction);
    if (clue) {
      setSelectedCell({ row: clue.row, col: clue.col });
      setSelectedDirection(direction);
    }
  }, []);

  const handleReveal = useCallback(() => {
    const newGrid = grid.map((r) =>
      r.map((c) => ({
        ...c,
        userInput: c.isBlocked ? '' : c.letter,
      }))
    );
    setGrid(newGrid);
    setShowAnswers(true);
    setIsComplete(true);
  }, [grid]);

  const handleReset = useCallback(() => {
    setGrid(buildGrid(CLUES));
    setSelectedCell(null);
    setShowAnswers(false);
    setIsComplete(false);
  }, []);

  // Determine which cells to highlight based on selected cell and direction
  const getHighlightedCells = useCallback(() => {
    if (!selectedCell) return new Set<string>();

    const highlighted = new Set<string>();
    const { row, col } = selectedCell;
    const cell = grid[row][col];

    if (selectedDirection === 'across' && cell.acrossClue) {
      const clue = CLUES.find((c) => c.number === cell.acrossClue && c.direction === 'across');
      if (clue) {
        for (let i = 0; i < clue.answer.length; i++) {
          highlighted.add(`${clue.row}-${clue.col + i}`);
        }
      }
    } else if (selectedDirection === 'down' && cell.downClue) {
      const clue = CLUES.find((c) => c.number === cell.downClue && c.direction === 'down');
      if (clue) {
        for (let i = 0; i < clue.answer.length; i++) {
          highlighted.add(`${clue.row + i}-${clue.col}`);
        }
      }
    }

    return highlighted;
  }, [selectedCell, selectedDirection, grid]);

  const highlightedCells = getHighlightedCells();
  const selectedClueNumber = selectedCell
    ? selectedDirection === 'across'
      ? grid[selectedCell.row][selectedCell.col].acrossClue
      : grid[selectedCell.row][selectedCell.col].downClue
    : null;

  return (
    <main className="cw-page">
      <h1 className="cw-title">🎵 Music Crossword</h1>
      <p className="cw-subtitle">Test your music knowledge!</p>

      {isComplete && (
        <div className="cw-status" role="status" aria-live="polite">
          <p className="cw-status-message">
            {showAnswers ? 'Answers revealed!' : '🎉 Congratulations! You completed the crossword!'}
          </p>
        </div>
      )}

      <div className="cw-container">
        <div className="cw-grid-wrapper">
          <div className="cw-grid" role="grid" aria-label="Crossword grid">
            {grid.map((row, rowIdx) => (
              <div key={rowIdx} className="cw-row" role="row">
                {row.map((cell, colIdx) => {
                  const cellKey = `${rowIdx}-${colIdx}`;
                  const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                  const isHighlighted = highlightedCells.has(cellKey);
                  const isCorrect = !cell.isBlocked && cell.userInput === cell.letter && cell.userInput !== '';
                  const isIncorrect = !cell.isBlocked && cell.userInput !== '' && cell.userInput !== cell.letter;

                  return (
                    <Cell
                      key={cellKey}
                      cell={cell}
                      row={rowIdx}
                      col={colIdx}
                      isSelected={isSelected}
                      isHighlighted={isHighlighted}
                      isCorrect={showAnswers ? false : isCorrect}
                      isIncorrect={showAnswers ? false : isIncorrect}
                      onSelect={handleCellSelect}
                      onInput={handleInput}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          <div className="cw-actions">
            <button className="cw-btn cw-btn--secondary" onClick={handleReveal} aria-label="Reveal answers">
              Reveal
            </button>
            <button className="cw-btn cw-btn--primary" onClick={handleReset} aria-label="Reset puzzle">
              Reset
            </button>
          </div>
        </div>

        <div className="cw-clues">
          <ClueList
            clues={CLUES}
            direction="across"
            selectedClue={selectedDirection === 'across' ? selectedClueNumber ?? null : null}
            onSelectClue={handleClueSelect}
          />
          <ClueList
            clues={CLUES}
            direction="down"
            selectedClue={selectedDirection === 'down' ? selectedClueNumber ?? null : null}
            onSelectClue={handleClueSelect}
          />
        </div>
      </div>
    </main>
  );
}
