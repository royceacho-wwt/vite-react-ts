import './SpreadsheetPage.css';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { recalculateCells } from './spreadsheet/formulaEngine';
import { CellData, CellPosition, colToLetter, positionToCellId, SpreadsheetState } from './spreadsheet/types';

const STORAGE_KEY = 'spreadsheet-data';
const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 10;
const MIN_ROWS = 5;
const MIN_COLS = 3;
const MAX_ROWS = 100;
const MAX_COLS = 26;

function loadFromStorage(): SpreadsheetState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

function saveToStorage(state: SpreadsheetState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

function createInitialState(): SpreadsheetState {
  const saved = loadFromStorage();
  if (saved) {
    return saved;
  }
  return {
    cells: {},
    numRows: DEFAULT_ROWS,
    numCols: DEFAULT_COLS,
  };
}

export function SpreadsheetPage() {
  const [state, setState] = useState<SpreadsheetState>(createInitialState);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const getCellId = useCallback((row: number, col: number): string => {
    return positionToCellId(row, col);
  }, []);

  const getCellData = useCallback(
    (row: number, col: number): CellData | undefined => {
      return state.cells[getCellId(row, col)];
    },
    [state.cells, getCellId]
  );

  const updateCell = useCallback(
    (row: number, col: number, value: string) => {
      const cellId = getCellId(row, col);
      const trimmedValue = value.trim();

      setState((prev) => {
        let newCells = { ...prev.cells };

        if (trimmedValue === '') {
          // Remove empty cells
          delete newCells[cellId];
        } else {
          // Parse the value
          let computed: string | number = trimmedValue;
          if (!trimmedValue.startsWith('=')) {
            const num = parseFloat(trimmedValue);
            if (!isNaN(num)) {
              computed = num;
            }
          }

          newCells[cellId] = {
            raw: trimmedValue,
            computed,
          };
        }

        // Recalculate dependent cells
        newCells = recalculateCells(newCells, cellId);

        return {
          ...prev,
          cells: newCells,
        };
      });
    },
    [getCellId]
  );

  const startEditing = useCallback(
    (row: number, col: number) => {
      const cellData = getCellData(row, col);
      setEditingCell({ row, col });
      setEditValue(cellData?.raw || '');
    },
    [getCellData]
  );

  const stopEditing = useCallback(
    (save = true) => {
      if (editingCell && save) {
        updateCell(editingCell.row, editingCell.col, editValue);
      }
      setEditingCell(null);
      setEditValue('');
    },
    [editingCell, editValue, updateCell]
  );

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (editingCell) {
        stopEditing();
      }
      setSelectedCell({ row, col });
    },
    [editingCell, stopEditing]
  );

  const handleCellDoubleClick = useCallback(
    (row: number, col: number) => {
      setSelectedCell({ row, col });
      startEditing(row, col);
    },
    [startEditing]
  );

  const moveSelection = useCallback(
    (dRow: number, dCol: number) => {
      setSelectedCell((prev) => {
        if (!prev) return { row: 0, col: 0 };
        const newRow = Math.max(0, Math.min(state.numRows - 1, prev.row + dRow));
        const newCol = Math.max(0, Math.min(state.numCols - 1, prev.col + dCol));
        return { row: newRow, col: newCol };
      });
    },
    [state.numRows, state.numCols]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (editingCell) {
        // Editing mode
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            stopEditing(true);
            moveSelection(1, 0);
            break;
          case 'Tab':
            e.preventDefault();
            stopEditing(true);
            moveSelection(0, e.shiftKey ? -1 : 1);
            break;
          case 'Escape':
            e.preventDefault();
            stopEditing(false);
            break;
        }
      } else if (selectedCell) {
        // Navigation mode
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            moveSelection(-1, 0);
            break;
          case 'ArrowDown':
            e.preventDefault();
            moveSelection(1, 0);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            moveSelection(0, -1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            moveSelection(0, 1);
            break;
          case 'Enter':
            e.preventDefault();
            startEditing(selectedCell.row, selectedCell.col);
            break;
          case 'Tab':
            e.preventDefault();
            moveSelection(0, e.shiftKey ? -1 : 1);
            break;
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            updateCell(selectedCell.row, selectedCell.col, '');
            break;
          default:
            // Start editing on any printable character
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
              startEditing(selectedCell.row, selectedCell.col);
              setEditValue(e.key);
            }
        }
      }
    },
    [editingCell, selectedCell, stopEditing, moveSelection, startEditing, updateCell]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    stopEditing(true);
  }, [stopEditing]);

  const handleResize = useCallback((newRows: number, newCols: number) => {
    setState((prev) => ({
      ...prev,
      numRows: Math.max(MIN_ROWS, Math.min(MAX_ROWS, newRows)),
      numCols: Math.max(MIN_COLS, Math.min(MAX_COLS, newCols)),
    }));
  }, []);

  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      setState({
        cells: {},
        numRows: DEFAULT_ROWS,
        numCols: DEFAULT_COLS,
      });
    }
  }, []);

  const formatCellValue = (cellData: CellData | undefined): string => {
    if (!cellData) return '';
    if (cellData.error) return cellData.error;
    if (typeof cellData.computed === 'number') {
      // Format numbers nicely
      if (Number.isInteger(cellData.computed)) {
        return cellData.computed.toString();
      }
      return cellData.computed.toFixed(2);
    }
    return String(cellData.computed);
  };

  const renderCell = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    const cellData = getCellData(row, col);
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isEditing = editingCell?.row === row && editingCell?.col === col;
    const hasError = cellData?.error !== undefined;

    return (
      <div
        key={cellId}
        className={`spreadsheet-cell ${isSelected ? 'selected' : ''} ${hasError ? 'error' : ''}`}
        onClick={() => handleCellClick(row, col)}
        onDoubleClick={() => handleCellDoubleClick(row, col)}
        data-testid={`cell-${cellId}`}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="cell-input"
            value={editValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            data-testid={`input-${cellId}`}
          />
        ) : (
          <span className="cell-value">{formatCellValue(cellData)}</span>
        )}
      </div>
    );
  };

  const renderRow = (row: number) => {
    return (
      <React.Fragment key={`row-${row}`}>
        {/* Row header */}
        <div className="header-cell row-header">{row + 1}</div>
        {/* Cells */}
        {Array.from({ length: state.numCols }, (_, col) => renderCell(row, col))}
      </React.Fragment>
    );
  };

  const selectedCellId = selectedCell ? getCellId(selectedCell.row, selectedCell.col) : null;
  const selectedCellData = selectedCell ? getCellData(selectedCell.row, selectedCell.col) : null;

  return (
    <div className="spreadsheet-page" onKeyDown={handleKeyDown} tabIndex={0} data-testid="spreadsheet-page">
      <h1>📊 Spreadsheet</h1>

      <div className="spreadsheet-toolbar">
        <div className="cell-info">
          <span className="cell-address">{selectedCellId || '-'}</span>
          <input
            type="text"
            className="formula-bar"
            value={editingCell ? editValue : selectedCellData?.raw || ''}
            onChange={(e) => {
              if (selectedCell && !editingCell) {
                startEditing(selectedCell.row, selectedCell.col);
              }
              setEditValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editingCell) {
                stopEditing(true);
              }
            }}
            placeholder="Enter value or formula (e.g., =SUM(A1:A5))"
            data-testid="formula-bar"
          />
        </div>
        <div className="toolbar-actions">
          <label>
            Rows:
            <input
              type="number"
              min={MIN_ROWS}
              max={MAX_ROWS}
              value={state.numRows}
              onChange={(e) => handleResize(parseInt(e.target.value) || DEFAULT_ROWS, state.numCols)}
              data-testid="rows-input"
            />
          </label>
          <label>
            Cols:
            <input
              type="number"
              min={MIN_COLS}
              max={MAX_COLS}
              value={state.numCols}
              onChange={(e) => handleResize(state.numRows, parseInt(e.target.value) || DEFAULT_COLS)}
              data-testid="cols-input"
            />
          </label>
          <button onClick={handleClear} className="clear-btn" data-testid="clear-btn">
            Clear All
          </button>
        </div>
      </div>

      <div className="spreadsheet-container">
        <div
          ref={gridRef}
          className="spreadsheet-grid"
          style={{
            gridTemplateColumns: `50px repeat(${state.numCols}, 100px)`,
            gridTemplateRows: `30px repeat(${state.numRows}, 30px)`,
          }}
        >
          {/* Corner cell */}
          <div className="header-cell corner"></div>

          {/* Column headers */}
          {Array.from({ length: state.numCols }, (_, col) => (
            <div key={`col-${col}`} className="header-cell col-header">
              {colToLetter(col)}
            </div>
          ))}

          {/* Rows */}
          {Array.from({ length: state.numRows }, (_, row) => renderRow(row))}
        </div>
      </div>

      <div className="spreadsheet-help">
        <h3>Quick Reference</h3>
        <ul>
          <li>
            <strong>Formulas:</strong> Start with <code>=</code> (e.g., <code>=A1+B1</code>)
          </li>
          <li>
            <strong>Functions:</strong> <code>SUM</code>, <code>AVERAGE</code>, <code>MIN</code>, <code>MAX</code>,{' '}
            <code>COUNT</code>
          </li>
          <li>
            <strong>Ranges:</strong> <code>=SUM(A1:B3)</code>
          </li>
          <li>
            <strong>Navigation:</strong> Arrow keys, Tab, Enter
          </li>
          <li>
            <strong>Edit:</strong> Double-click or press Enter on selected cell
          </li>
        </ul>
      </div>
    </div>
  );
}
