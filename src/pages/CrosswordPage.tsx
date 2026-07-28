import './CrosswordPage.css';

import { useCallback, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface ClueData {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

interface GameState {
  grid: string[][];
  solved: boolean;
}

/* ── Puzzle Data ───────────────────────────────────────────────────────────── */

// Sports-themed crossword puzzle (10x10 grid)
// '#' represents blocked cells
const PUZZLE_TEMPLATE = [
  ['1', '2', '3', '#', '4', '5', '6', '#', '7', '8'],
  ['.', '.', '.', '#', '.', '.', '.', '#', '.', '.'],
  ['9', '.', '.', '10', '.', '.', '.', '11', '.', '.'],
  ['.', '#', '#', '.', '#', '#', '.', '.', '#', '.'],
  ['12', '13', '14', '.', '15', '16', '.', '.', '17', '.'],
  ['.', '.', '.', '#', '.', '.', '#', '.', '.', '#'],
  ['.', '#', '18', '19', '.', '.', '20', '.', '.', '21'],
  ['22', '23', '.', '.', '#', '.', '.', '#', '.', '.'],
  ['.', '.', '#', '.', '24', '.', '.', '25', '.', '.'],
  ['.', '.', '#', '.', '.', '#', '.', '.', '.', '.'],
];

const CLUES: ClueData[] = [
  // Across clues
  { number: 1, clue: 'Sport with a puck', answer: 'NHL', row: 0, col: 0, direction: 'across' },
  { number: 4, clue: 'Tennis court divider', answer: 'NET', row: 0, col: 4, direction: 'across' },
  { number: 7, clue: 'Boxing punch', answer: 'JAB', row: 0, col: 8, direction: 'across' },
  { number: 9, clue: 'Olympic swimming stroke', answer: 'FREESTYLE', row: 2, col: 0, direction: 'across' },
  { number: 12, clue: 'Soccer kick from the corner', answer: 'CORNER', row: 4, col: 0, direction: 'across' },
  { number: 15, clue: 'Golf club type', answer: 'IRON', row: 4, col: 4, direction: 'across' },
  { number: 18, clue: 'Basketball hoop part', answer: 'RIM', row: 6, col: 2, direction: 'across' },
  { number: 20, clue: 'Baseball glove', answer: 'MITT', row: 6, col: 6, direction: 'across' },
  { number: 22, clue: 'Track event distance', answer: 'MILE', row: 7, col: 0, direction: 'across' },
  { number: 24, clue: 'Football field unit', answer: 'YARD', row: 8, col: 4, direction: 'across' },
  // Down clues
  { number: 1, clue: 'NBA legend Michael', answer: 'MJ', row: 0, col: 0, direction: 'down' },
  { number: 2, clue: 'Hockey protective gear', answer: 'HELMET', row: 0, col: 1, direction: 'down' },
  { number: 3, clue: 'Tennis serve type', answer: 'LOB', row: 0, col: 2, direction: 'down' },
  { number: 5, clue: 'Baseball hit for four bases', answer: 'HOMERUN', row: 0, col: 5, direction: 'down' },
  { number: 6, clue: 'Football position (abbr)', answer: 'TE', row: 0, col: 6, direction: 'down' },
  { number: 8, clue: 'Golf ball holder', answer: 'TEE', row: 0, col: 9, direction: 'down' },
  { number: 10, clue: 'Soccer game period', answer: 'HALF', row: 2, col: 3, direction: 'down' },
  { number: 11, clue: 'Wrestling move', answer: 'PIN', row: 2, col: 7, direction: 'down' },
  { number: 13, clue: 'Olympic medal color', answer: 'GOLD', row: 4, col: 1, direction: 'down' },
  { number: 14, clue: 'Cycling race', answer: 'TOUR', row: 4, col: 2, direction: 'down' },
  { number: 16, clue: 'Basketball shot type', answer: 'DUNK', row: 4, col: 5, direction: 'down' },
  { number: 17, clue: 'Tennis scoring term', answer: 'LOVE', row: 4, col: 8, direction: 'down' },
  { number: 19, clue: 'Boxing match', answer: 'BOUT', row: 6, col: 3, direction: 'down' },
  { number: 21, clue: 'Archery target center', answer: 'BULL', row: 6, col: 9, direction: 'down' },
  { number: 23, clue: 'Swimming pool length', answer: 'LAP', row: 7, col: 1, direction: 'down' },
  { number: 25, clue: 'Ski slope type', answer: 'RUN', row: 8, col: 7, direction: 'down' },
];

/* ── Helper Functions ──────────────────────────────────────────────────────── */

function initializeGrid(): string[][] {
  return PUZZLE_TEMPLATE.map((row) =>
    row.map((cell) => {
      if (cell === '#') return '#';
      return '';
    })
  );
}

function getCellNumber(row: number, col: number): number | undefined {
  const cell = PUZZLE_TEMPLATE[row][col];
  if (cell !== '.' && cell !== '#') {
    return parseInt(cell, 10);
  }
  return undefined;
}

function isBlocked(row: number, col: number): boolean {
  return PUZZLE_TEMPLATE[row][col] === '#';
}

function getSolutionGrid(): string[][] {
  const grid = initializeGrid();

  CLUES.forEach((clue) => {
    const { answer, row, col, direction } = clue;
    for (let i = 0; i < answer.length; i++) {
      if (direction === 'across') {
        grid[row][col + i] = answer[i];
      } else {
        grid[row + i][col] = answer[i];
      }
    }
  });

  return grid;
}

function checkSolution(userGrid: string[][], solutionGrid: string[][]): boolean {
  for (let r = 0; r < userGrid.length; r++) {
    for (let c = 0; c < userGrid[r].length; c++) {
      if (solutionGrid[r][c] !== '#') {
        if (userGrid[r][c].toUpperCase() !== solutionGrid[r][c].toUpperCase()) {
          return false;
        }
      }
    }
  }
  return true;
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

interface CellProps {
  row: number;
  col: number;
  value: string;
  isBlocked: boolean;
  number?: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onChange: (row: number, col: number, value: string) => void;
  onSelect: (row: number, col: number) => void;
  onKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
}

function Cell({
  row,
  col,
  value,
  isBlocked,
  number,
  isSelected,
  isHighlighted,
  onChange,
  onSelect,
  onKeyDown,
}: CellProps) {
  if (isBlocked) {
    return <div className="cw-cell cw-cell--blocked" aria-hidden="true" />;
  }

  const cellClass = `cw-cell${isSelected ? ' cw-cell--selected' : ''}${isHighlighted ? ' cw-cell--highlighted' : ''}`;

  return (
    <div className={cellClass} onClick={() => onSelect(row, col)}>
      {number && <span className="cw-cell-number">{number}</span>}
      <input
        className="cw-cell-input"
        type="text"
        maxLength={1}
        value={value}
        onChange={(e) => onChange(row, col, e.target.value)}
        onKeyDown={(e) => onKeyDown(e, row, col)}
        onFocus={() => onSelect(row, col)}
        aria-label={`Cell ${row + 1}, ${col + 1}${number ? `, clue ${number}` : ''}`}
      />
    </div>
  );
}

interface GridProps {
  grid: string[][];
  selectedCell: { row: number; col: number } | null;
  highlightedCells: Set<string>;
  onCellChange: (row: number, col: number, value: string) => void;
  onCellSelect: (row: number, col: number) => void;
  onKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
}

function Grid({ grid, selectedCell, highlightedCells, onCellChange, onCellSelect, onKeyDown }: GridProps) {
  return (
    <div className="cw-grid" role="grid" aria-label="Crossword puzzle grid">
      {grid.map((row, rowIdx) => (
        <div key={rowIdx} className="cw-row" role="row">
          {row.map((cell, colIdx) => (
            <Cell
              key={`${rowIdx}-${colIdx}`}
              row={rowIdx}
              col={colIdx}
              value={cell === '#' ? '' : cell}
              isBlocked={isBlocked(rowIdx, colIdx)}
              number={getCellNumber(rowIdx, colIdx)}
              isSelected={selectedCell?.row === rowIdx && selectedCell?.col === colIdx}
              isHighlighted={highlightedCells.has(`${rowIdx}-${colIdx}`)}
              onChange={onCellChange}
              onSelect={onCellSelect}
              onKeyDown={onKeyDown}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ClueListProps {
  title: string;
  clues: ClueData[];
  selectedClue: number | null;
  onClueClick: (clue: ClueData) => void;
}

function ClueList({ title, clues, selectedClue, onClueClick }: ClueListProps) {
  return (
    <div className="cw-clue-section">
      <h3 className="cw-clue-title">{title}</h3>
      <ul className="cw-clue-list">
        {clues.map((clue) => (
          <li
            key={`${clue.direction}-${clue.number}`}
            className={`cw-clue-item${selectedClue === clue.number ? ' cw-clue-item--selected' : ''}`}
            onClick={() => onClueClick(clue)}
          >
            <span className="cw-clue-number">{clue.number}.</span>
            <span className="cw-clue-text">{clue.clue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Page Component ─────────────────────────────────────────────────────────── */

export function CrosswordPage() {
  const [game, setGame] = useState<GameState>(() => ({
    grid: initializeGrid(),
    solved: false,
  }));
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [message, setMessage] = useState('');

  const solutionGrid = getSolutionGrid();

  const acrossClues = CLUES.filter((c) => c.direction === 'across').sort((a, b) => a.number - b.number);
  const downClues = CLUES.filter((c) => c.direction === 'down').sort((a, b) => a.number - b.number);

  // Get highlighted cells based on current selection and direction
  const getHighlightedCells = useCallback((): Set<string> => {
    const cells = new Set<string>();
    if (!selectedCell) return cells;

    const { row, col } = selectedCell;

    // Find the clue that contains this cell
    const relevantClue = CLUES.find((clue) => {
      if (clue.direction !== direction) return false;
      const { row: clueRow, col: clueCol, answer } = clue;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === 'across' ? clueRow : clueRow + i;
        const c = direction === 'across' ? clueCol + i : clueCol;
        if (r === row && c === col) return true;
      }
      return false;
    });

    if (relevantClue) {
      const { row: clueRow, col: clueCol, answer } = relevantClue;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === 'across' ? clueRow : clueRow + i;
        const c = direction === 'across' ? clueCol + i : clueCol;
        cells.add(`${r}-${c}`);
      }
    }

    return cells;
  }, [selectedCell, direction]);

  const handleCellChange = useCallback(
    (row: number, col: number, value: string) => {
      if (game.solved) return;

      const letter = value.toUpperCase().replace(/[^A-Z]/g, '');
      const newGrid = game.grid.map((r, rIdx) => r.map((c, cIdx) => (rIdx === row && cIdx === col ? letter : c)));

      setGame((prev) => ({ ...prev, grid: newGrid }));
      setMessage('');

      // Auto-advance to next cell
      if (letter) {
        const nextCell = getNextCell(row, col, direction);
        if (nextCell) {
          setSelectedCell(nextCell);
          // Focus the next input
          setTimeout(() => {
            const input = document.querySelector(
              `.cw-row:nth-child(${nextCell.row + 1}) .cw-cell:nth-child(${nextCell.col + 1}) input`
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
      }
    },
    [game.grid, game.solved, direction]
  );

  const getNextCell = (row: number, col: number, dir: 'across' | 'down'): { row: number; col: number } | null => {
    let nextRow = row;
    let nextCol = col;

    if (dir === 'across') {
      nextCol++;
      while (nextCol < 10 && isBlocked(nextRow, nextCol)) {
        nextCol++;
      }
      if (nextCol >= 10) return null;
    } else {
      nextRow++;
      while (nextRow < 10 && isBlocked(nextRow, nextCol)) {
        nextRow++;
      }
      if (nextRow >= 10) return null;
    }

    return { row: nextRow, col: nextCol };
  };

  const getPrevCell = (row: number, col: number, dir: 'across' | 'down'): { row: number; col: number } | null => {
    let prevRow = row;
    let prevCol = col;

    if (dir === 'across') {
      prevCol--;
      while (prevCol >= 0 && isBlocked(prevRow, prevCol)) {
        prevCol--;
      }
      if (prevCol < 0) return null;
    } else {
      prevRow--;
      while (prevRow >= 0 && isBlocked(prevRow, prevCol)) {
        prevRow--;
      }
      if (prevRow < 0) return null;
    }

    return { row: prevRow, col: prevCol };
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (game.solved) return;

      if (e.key === 'Backspace' && !game.grid[row][col]) {
        e.preventDefault();
        const prevCell = getPrevCell(row, col, direction);
        if (prevCell) {
          setSelectedCell(prevCell);
          const newGrid = game.grid.map((r, rIdx) =>
            r.map((c, cIdx) => (rIdx === prevCell.row && cIdx === prevCell.col ? '' : c))
          );
          setGame((prev) => ({ ...prev, grid: newGrid }));
          setTimeout(() => {
            const input = document.querySelector(
              `.cw-row:nth-child(${prevCell.row + 1}) .cw-cell:nth-child(${prevCell.col + 1}) input`
            ) as HTMLInputElement;
            input?.focus();
          }, 0);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = getNextCell(row, col, 'across');
        if (next) {
          setSelectedCell(next);
          setDirection('across');
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = getPrevCell(row, col, 'across');
        if (prev) {
          setSelectedCell(prev);
          setDirection('across');
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = getNextCell(row, col, 'down');
        if (next) {
          setSelectedCell(next);
          setDirection('down');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = getPrevCell(row, col, 'down');
        if (prev) {
          setSelectedCell(prev);
          setDirection('down');
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        setDirection((d) => (d === 'across' ? 'down' : 'across'));
      }
    },
    [game.grid, game.solved, direction]
  );

  const handleCellSelect = useCallback(
    (row: number, col: number) => {
      if (selectedCell?.row === row && selectedCell?.col === col) {
        // Toggle direction on same cell click
        setDirection((d) => (d === 'across' ? 'down' : 'across'));
      } else {
        setSelectedCell({ row, col });
      }
    },
    [selectedCell]
  );

  const handleClueClick = useCallback((clue: ClueData) => {
    setSelectedCell({ row: clue.row, col: clue.col });
    setDirection(clue.direction);
    setTimeout(() => {
      const input = document.querySelector(
        `.cw-row:nth-child(${clue.row + 1}) .cw-cell:nth-child(${clue.col + 1}) input`
      ) as HTMLInputElement;
      input?.focus();
    }, 0);
  }, []);

  const handleCheckAnswers = useCallback(() => {
    const isSolved = checkSolution(game.grid, solutionGrid);
    if (isSolved) {
      setGame((prev) => ({ ...prev, solved: true }));
      setMessage('🎉 Congratulations! You solved the puzzle!');
    } else {
      setMessage('❌ Some answers are incorrect. Keep trying!');
    }
  }, [game.grid, solutionGrid]);

  const handleRevealPuzzle = useCallback(() => {
    setGame({ grid: solutionGrid, solved: true });
    setMessage('Puzzle revealed! Try again for a fresh challenge.');
  }, [solutionGrid]);

  const handleReset = useCallback(() => {
    setGame({ grid: initializeGrid(), solved: false });
    setSelectedCell(null);
    setMessage('');
  }, []);

  const highlightedCells = getHighlightedCells();

  // Find current clue number for display
  const getCurrentClueNumber = (): number | null => {
    if (!selectedCell) return null;
    const clue = CLUES.find((c) => {
      if (c.direction !== direction) return false;
      const { row: clueRow, col: clueCol, answer } = c;
      for (let i = 0; i < answer.length; i++) {
        const r = direction === 'across' ? clueRow : clueRow + i;
        const col = direction === 'across' ? clueCol + i : clueCol;
        if (r === selectedCell.row && col === selectedCell.col) return true;
      }
      return false;
    });
    return clue?.number ?? null;
  };

  return (
    <main className="cw-page">
      <h1 className="cw-title">🏆 Sports Crossword</h1>
      <p className="cw-subtitle">Test your sports knowledge!</p>

      <div className="cw-direction-indicator">
        Direction: <strong>{direction.toUpperCase()}</strong>
        <span className="cw-direction-hint">(Press Tab or click same cell to switch)</span>
      </div>

      <div className="cw-container">
        <div className="cw-grid-wrapper">
          <Grid
            grid={game.grid}
            selectedCell={selectedCell}
            highlightedCells={highlightedCells}
            onCellChange={handleCellChange}
            onCellSelect={handleCellSelect}
            onKeyDown={handleKeyDown}
          />

          <div className="cw-actions">
            <button className="cw-btn cw-btn--primary" onClick={handleCheckAnswers} disabled={game.solved}>
              Check Answers
            </button>
            <button className="cw-btn cw-btn--secondary" onClick={handleRevealPuzzle} disabled={game.solved}>
              Reveal Puzzle
            </button>
            <button className="cw-btn cw-btn--secondary" onClick={handleReset}>
              Reset
            </button>
          </div>

          {message && (
            <div className="cw-message" role="status" aria-live="polite">
              {message}
            </div>
          )}
        </div>

        <div className="cw-clues">
          <ClueList
            title="Across"
            clues={acrossClues}
            selectedClue={direction === 'across' ? getCurrentClueNumber() : null}
            onClueClick={handleClueClick}
          />
          <ClueList
            title="Down"
            clues={downClues}
            selectedClue={direction === 'down' ? getCurrentClueNumber() : null}
            onClueClick={handleClueClick}
          />
        </div>
      </div>
    </main>
  );
}
