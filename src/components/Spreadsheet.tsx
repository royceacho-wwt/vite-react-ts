import './Spreadsheet.css';

import { useRef, useState } from 'react';

import { SpreadsheetCell } from '@/components/SpreadsheetCell';
import { SpreadsheetFormulaBar } from '@/components/SpreadsheetFormulaBar';
import { useSpreadsheetData } from '@/hooks/useSpreadsheetData';

const ROWS = 20;
const COLS = 10;

export interface CellData {
  value: string; // raw formula or literal
  computed: string | number; // computed result
}

export interface SpreadsheetData {
  [key: string]: CellData;
}

export function Spreadsheet() {
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [data, setData] = useSpreadsheetData();
  const gridRef = useRef<HTMLDivElement>(null);

  const getCellAddress = (row: number, col: number): string => {
    return String.fromCharCode(65 + col) + (row + 1);
  };

  const parseCellAddress = (address: string): [number, number] | null => {
    const match = address.match(/^([A-Z])(\d+)$/);
    if (!match) return null;
    const col = match[1].charCodeAt(0) - 65;
    const row = parseInt(match[2], 10) - 1;
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return [row, col];
  };

  const handleCellChange = (address: string, newValue: string) => {
    const newData = { ...data };
    newData[address] = { value: newValue, computed: '' };

    // Recalculate all cells
    const calculated = recalculateAll(newData);
    setData(calculated);
  };

  const recalculateAll = (spreadsheetData: SpreadsheetData): SpreadsheetData => {
    const result = { ...spreadsheetData };
    const visited = new Set<string>();

    const calculateCell = (address: string, recursionStack: Set<string>): string | number => {
      if (visited.has(address)) {
        return result[address]?.computed || '';
      }

      if (recursionStack.has(address)) {
        return '#CIRC!';
      }

      const cellData = result[address];
      if (!cellData) {
        return '';
      }

      const value = cellData.value.trim();

      try {
        if (value.startsWith('=')) {
          const formula = value.substring(1);
          const newStack = new Set(recursionStack);
          newStack.add(address);
          const computed = evaluateFormula(formula, result, newStack);
          result[address].computed = computed;
          visited.add(address);
          return computed;
        } else {
          const num = parseFloat(value);
          const computed = isNaN(num) ? value : num;
          result[address].computed = computed;
          visited.add(address);
          return computed;
        }
      } catch (error) {
        result[address].computed = '#ERR!';
        visited.add(address);
        return '#ERR!';
      }
    };

    // Calculate all cells
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const address = getCellAddress(row, col);
        if (result[address]) {
          calculateCell(address, new Set());
        }
      }
    }

    return result;
  };

  const evaluateFormula = (
    formula: string,
    spreadsheetData: SpreadsheetData,
    recursionStack: Set<string>
  ): string | number => {
    let processedFormula = formula;

    // First, handle function calls with ranges
    // Match patterns like SUM(A1:B3), AVERAGE(A1:B3), etc.
    processedFormula = processedFormula.replace(
      /\b(SUM|AVERAGE|MIN|MAX|COUNT)\s*\(\s*([A-Z]\d+):([A-Z]\d+)\s*\)/gi,
      (_match, func, start, end) => {
        const range = getRangeValues(start, end, spreadsheetData, recursionStack);
        const result = applyFunction(func.toUpperCase(), range);
        return String(result);
      }
    );

    // Handle single cell references (A1)
    processedFormula = processedFormula.replace(/([A-Z]\d+)/g, (match) => {
      if (recursionStack.has(match)) {
        throw new Error('Circular reference');
      }
      const cellData = spreadsheetData[match];
      if (!cellData) return '0';

      const cellValue = cellData.value.trim();
      if (cellValue.startsWith('=')) {
        const innerFormula = cellValue.substring(1);
        const newStack = new Set(recursionStack);
        newStack.add(match);
        const computed = evaluateFormula(innerFormula, spreadsheetData, newStack);
        if (computed === '#CIRC!' || computed === '#ERR!') {
          throw new Error(String(computed));
        }
        return String(computed);
      } else {
        const num = parseFloat(cellValue);
        return isNaN(num) ? '0' : String(num);
      }
    });

    // Evaluate the expression
    try {
      // eslint-disable-next-line no-eval
      const result = Function('"use strict"; return (' + processedFormula + ')')();
      return result;
    } catch (error) {
      throw new Error('Invalid formula');
    }
  };

  const applyFunction = (func: string, values: (string | number)[]): number => {
    const nums = values.map((v) => {
      const num = parseFloat(String(v));
      return isNaN(num) ? 0 : num;
    });

    switch (func) {
      case 'SUM':
        return nums.reduce((a, b) => a + b, 0);
      case 'AVERAGE':
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'MIN':
        return nums.length > 0 ? Math.min(...nums) : 0;
      case 'MAX':
        return nums.length > 0 ? Math.max(...nums) : 0;
      case 'COUNT':
        return nums.length;
      default:
        return 0;
    }
  };

  const getRangeValues = (
    start: string,
    end: string,
    spreadsheetData: SpreadsheetData,
    recursionStack: Set<string>
  ): (string | number)[] => {
    const startCoords = parseCellAddress(start);
    const endCoords = parseCellAddress(end);

    if (!startCoords || !endCoords) return [];

    const [startRow, startCol] = startCoords;
    const [endRow, endCol] = endCoords;

    const values: (string | number)[] = [];

    for (let row = Math.min(startRow, endRow); row <= Math.max(startRow, endRow); row++) {
      for (let col = Math.min(startCol, endCol); col <= Math.max(startCol, endCol); col++) {
        const address = getCellAddress(row, col);
        const cellData = spreadsheetData[address];

        if (cellData) {
          const cellValue = cellData.value.trim();
          if (cellValue.startsWith('=')) {
            const innerFormula = cellValue.substring(1);
            const newStack = new Set(recursionStack);
            newStack.add(address);
            try {
              const computed = evaluateFormula(innerFormula, spreadsheetData, newStack);
              if (computed !== '#CIRC!' && computed !== '#ERR!') {
                values.push(computed);
              }
            } catch {
              // Skip on error
            }
          } else {
            const num = parseFloat(cellValue);
            if (!isNaN(num)) {
              values.push(num);
            }
          }
        }
      }
    }

    return values;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const coords = parseCellAddress(selectedCell);
    if (!coords) return;

    const [row, col] = coords;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(ROWS - 1, row + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(COLS - 1, col + 1);
        break;
      case 'Tab':
        e.preventDefault();
        newCol = e.shiftKey ? Math.max(0, col - 1) : Math.min(COLS - 1, col + 1);
        break;
      default:
        return;
    }

    setSelectedCell(getCellAddress(newRow, newCol));
  };

  const currentCellData = data[selectedCell];
  const currentValue = currentCellData?.value || '';

  return (
    <div className="spreadsheet-container" onKeyDown={handleKeyDown} tabIndex={0} role="presentation">
      <SpreadsheetFormulaBar cellAddress={selectedCell} value={currentValue} />

      <div className="spreadsheet-grid" ref={gridRef}>
        {/* Column headers */}
        <div className="spreadsheet-header-row">
          <div className="spreadsheet-row-header"></div>
          {Array.from({ length: COLS }).map((_, col) => (
            <div key={`header-${col}`} className="spreadsheet-col-header">
              {String.fromCharCode(65 + col)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: ROWS }).map((_, row) => (
          <div key={`row-${row}`} className="spreadsheet-row">
            <div className="spreadsheet-row-header">{row + 1}</div>
            {Array.from({ length: COLS }).map((_, col) => {
              const address = getCellAddress(row, col);
              const cellData = data[address];
              const isSelected = selectedCell === address;

              return (
                <SpreadsheetCell
                  key={address}
                  address={address}
                  data={cellData}
                  isSelected={isSelected}
                  onChange={handleCellChange}
                  onSelect={() => setSelectedCell(address)}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
