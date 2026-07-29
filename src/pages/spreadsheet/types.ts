export interface CellData {
  raw: string; // The raw input (formula or literal)
  computed: string | number; // The computed value
  error?: string; // Error message if any
}

export interface SpreadsheetState {
  cells: Record<string, CellData>;
  numRows: number;
  numCols: number;
}

export interface CellPosition {
  row: number;
  col: number;
}

export type CellValue = string | number;

export const ERRORS = {
  CIRCULAR: '#CIRC!',
  ERROR: '#ERR!',
  REF: '#REF!',
  DIV_ZERO: '#DIV/0!',
} as const;

// Convert column index (0-based) to letter (A, B, C, ..., Z, AA, AB, ...)
export function colToLetter(col: number): string {
  let result = '';
  let c = col;
  while (c >= 0) {
    result = String.fromCharCode((c % 26) + 65) + result;
    c = Math.floor(c / 26) - 1;
  }
  return result;
}

// Convert letter to column index (0-based)
export function letterToCol(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 64);
  }
  return result - 1;
}

// Convert cell ID (e.g., "A1") to position
export function cellIdToPosition(cellId: string): CellPosition | null {
  const match = cellId.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  const col = letterToCol(match[1].toUpperCase());
  const row = parseInt(match[2], 10) - 1;
  return { row, col };
}

// Convert position to cell ID
export function positionToCellId(row: number, col: number): string {
  return `${colToLetter(col)}${row + 1}`;
}
