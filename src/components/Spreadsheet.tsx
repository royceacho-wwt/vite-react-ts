import './Spreadsheet.css';

import { useEffect, useRef, useState } from 'react';

import { SpreadsheetCell } from '@/components/SpreadsheetCell';
import {
  CellData,
  SpreadsheetData,
  cellRefToKey,
  columnNumberToLetter,
  recalculateAll,
} from '@/data/formulaEngine';

const ROWS = 20;
const COLS = 10;
const STORAGE_KEY = 'spreadsheet_data';

export function Spreadsheet() {
  const [data, setData] = useState<SpreadsheetData>(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse errors
    }
    return {};
  });

  const [selectedCell, setSelectedCell] = useState<{ col: number; row: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ col: number; row: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const getCellKey = (col: number, row: number): string => cellRefToKey(col, row);

  const getCellData = (col: number, row: number): CellData => {
    const key = getCellKey(col, row);
    return data[key] || { formula: '', value: null, error: null };
  };

  const handleCellClick = (col: number, row: number) => {
    setSelectedCell({ col, row });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (col: number, row: number) => {
    const cellData = getCellData(col, row);
    setSelectedCell({ col, row });
    setEditingCell({ col, row });
    setEditValue(cellData.formula);
  };

  const handleCellChange = (value: string) => {
    setEditValue(value);
  };

  const handleCellBlur = () => {
    if (editingCell) {
      saveCellValue(editingCell.col, editingCell.row, editValue);
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      saveCellValue(editingCell.col, editingCell.row, editValue);
      setEditingCell(null);
      // Move down
      const newRow = Math.min(editingCell.row + 1, ROWS - 1);
      setSelectedCell({ col: editingCell.col, row: newRow });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveCellValue(editingCell.col, editingCell.row, editValue);
      setEditingCell(null);
      // Move right
      const newCol = Math.min(editingCell.col + 1, COLS - 1);
      setSelectedCell({ col: newCol, row: editingCell.row });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditingCell(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!selectedCell || editingCell) return;

    const { col, row } = selectedCell;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedCell({ col, row: Math.max(row - 1, 0) });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedCell({ col, row: Math.min(row + 1, ROWS - 1) });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setSelectedCell({ col: Math.max(col - 1, 0), row });
        break;
      case 'ArrowRight':
        e.preventDefault();
        setSelectedCell({ col: Math.min(col + 1, COLS - 1), row });
        break;
      case 'Enter':
        e.preventDefault();
        setEditingCell({ col, row });
        setEditValue(getCellData(col, row).formula);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        saveCellValue(col, row, '');
        break;
      default:
        // Start editing if a printable character is pressed
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          setEditingCell({ col, row });
          setEditValue(e.key);
        }
        break;
    }
  };

  const saveCellValue = (col: number, row: number, value: string) => {
    const key = getCellKey(col, row);
    const newData = { ...data };

    if (value.trim() === '') {
      delete newData[key];
    } else {
      newData[key] = {
        formula: value,
        value: null,
        error: null,
      };
    }

    // Recalculate all cells
    const recalculated = recalculateAll(newData);
    setData(recalculated);
  };

  const handleClear = () => {
    if (confirm('Clear all cells? This cannot be undone.')) {
      setData({});
      setSelectedCell(null);
      setEditingCell(null);
    }
  };

  return (
    <div className="spreadsheet-container">
      <div className="spreadsheet-toolbar">
        <button onClick={handleClear} className="spreadsheet-button">
          Clear All
        </button>
      </div>

      <div
        className="spreadsheet-grid"
        ref={gridRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="grid"
        aria-label="Spreadsheet grid"
      >
        {/* Column headers */}
        <div className="spreadsheet-header-row">
          <div className="spreadsheet-corner"></div>
          {Array.from({ length: COLS }).map((_, col) => (
            <div key={`header-${col}`} className="spreadsheet-header-cell">
              {columnNumberToLetter(col)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: ROWS }).map((_, row) => (
          <div key={`row-${row}`} className="spreadsheet-row">
            <div className="spreadsheet-row-header">{row + 1}</div>
            {Array.from({ length: COLS }).map((_, col) => {
              const cellData = getCellData(col, row);
              const isSelected = selectedCell?.col === col && selectedCell?.row === row;
              const isEditing = editingCell?.col === col && editingCell?.row === row;

              return (
                <SpreadsheetCell
                  key={`cell-${col}-${row}`}
                  col={col}
                  row={row}
                  data={cellData}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  editValue={editValue}
                  onCellClick={handleCellClick}
                  onCellDoubleClick={handleCellDoubleClick}
                  onCellChange={handleCellChange}
                  onCellBlur={handleCellBlur}
                  onCellKeyDown={handleCellKeyDown}
                  inputRef={inputRef}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="spreadsheet-info">
        <p>
          <strong>Instructions:</strong> Click to select, double-click or press Enter to edit. Use arrow keys to
          navigate. Press Tab to move right, Enter to move down. Formulas start with <code>=</code>. Supports cell
          references (A1), ranges (A1:B3), arithmetic (+, -, *, /, ()), and functions (SUM, AVERAGE, MIN, MAX, COUNT).
        </p>
      </div>
    </div>
  );
}
