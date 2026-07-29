/**
 * Formula parser and evaluator for spreadsheet cells
 */

export interface CellReference {
  col: number;
  row: number;
}

export interface RangeReference {
  startCol: number;
  startRow: number;
  endCol: number;
  endRow: number;
}

export type CellValue = number | string | null;

export interface CellData {
  formula: string;
  value: CellValue;
  error: string | null;
}

export interface SpreadsheetData {
  [key: string]: CellData;
}

/**
 * Convert column letter(s) to number (A=0, B=1, ..., Z=25, AA=26, etc.)
 */
export function columnLetterToNumber(letter: string): number {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result - 1;
}

/**
 * Convert column number to letter(s) (0=A, 1=B, ..., 25=Z, 26=AA, etc.)
 */
export function columnNumberToLetter(num: number): string {
  let result = '';
  num += 1;
  while (num > 0) {
    num -= 1;
    result = String.fromCharCode((num % 26) + 'A'.charCodeAt(0)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

/**
 * Parse cell reference like "A1" to { col: 0, row: 0 }
 */
export function parseCellReference(ref: string): CellReference | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    col: columnLetterToNumber(match[1]),
    row: parseInt(match[2], 10) - 1,
  };
}

/**
 * Convert cell reference to key for storage
 */
export function cellRefToKey(col: number, row: number): string {
  return `${columnNumberToLetter(col)}${row + 1}`;
}

/**
 * Parse range reference like "A1:B3"
 */
export function parseRangeReference(ref: string): RangeReference | null {
  const parts = ref.split(':');
  if (parts.length !== 2) return null;

  const start = parseCellReference(parts[0].trim());
  const end = parseCellReference(parts[1].trim());

  if (!start || !end) return null;

  return {
    startCol: Math.min(start.col, end.col),
    startRow: Math.min(start.row, end.row),
    endCol: Math.max(start.col, end.col),
    endRow: Math.max(start.row, end.row),
  };
}

/**
 * Get all cell keys in a range
 */
export function getRangeKeys(range: RangeReference): string[] {
  const keys: string[] = [];
  for (let row = range.startRow; row <= range.endRow; row++) {
    for (let col = range.startCol; col <= range.endCol; col++) {
      keys.push(cellRefToKey(col, row));
    }
  }
  return keys;
}

/**
 * Extract all cell references and ranges from a formula
 */
export function extractReferences(formula: string): string[] {
  const references: string[] = [];
  // Match cell references (A1, B2, etc.) and ranges (A1:B3)
  const pattern = /([A-Z]+\d+(?::[A-Z]+\d+)?)/g;
  let match;
  while ((match = pattern.exec(formula)) !== null) {
    references.push(match[1]);
  }
  return references;
}

/**
 * Detect circular references using DFS
 */
export function hasCircularReference(
  cellKey: string,
  data: SpreadsheetData,
  visited: Set<string> = new Set(),
  recursionStack: Set<string> = new Set(),
): boolean {
  visited.add(cellKey);
  recursionStack.add(cellKey);

  const cell = data[cellKey];
  if (!cell || !cell.formula.startsWith('=')) {
    recursionStack.delete(cellKey);
    return false;
  }

  const refs = extractReferences(cell.formula);
  for (const ref of refs) {
    let refKeys: string[] = [];
    if (ref.includes(':')) {
      const range = parseRangeReference(ref);
      if (range) {
        refKeys = getRangeKeys(range);
      }
    } else {
      refKeys = [ref];
    }

    for (const refKey of refKeys) {
      if (!visited.has(refKey)) {
        if (hasCircularReference(refKey, data, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(refKey)) {
        return true;
      }
    }
  }

  recursionStack.delete(cellKey);
  return false;
}

/**
 * Topologically sort cells for evaluation
 */
export function topologicalSort(data: SpreadsheetData): string[] {
  const visited = new Set<string>();
  const stack: string[] = [];

  function visit(key: string) {
    if (visited.has(key)) return;
    visited.add(key);

    const cell = data[key];
    if (cell && cell.formula.startsWith('=')) {
      const refs = extractReferences(cell.formula);
      for (const ref of refs) {
        if (ref.includes(':')) {
          const range = parseRangeReference(ref);
          if (range) {
            const rangeKeys = getRangeKeys(range);
            for (const rangeKey of rangeKeys) {
              visit(rangeKey);
            }
          }
        } else {
          visit(ref);
        }
      }
    }

    stack.push(key);
  }

  for (const key of Object.keys(data)) {
    visit(key);
  }

  return stack;
}

/**
 * Get numeric values from a range
 */
function getRangeValues(range: RangeReference, data: SpreadsheetData, evaluatedCache: Map<string, CellValue>): number[] {
  const values: number[] = [];
  for (const key of getRangeKeys(range)) {
    const val = evaluatedCache.get(key) ?? data[key]?.value ?? 0;
    const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
    values.push(num);
  }
  return values;
}

/**
 * Evaluate a formula
 */
export function evaluateFormula(
  formula: string,
  data: SpreadsheetData,
  evaluatedCache: Map<string, CellValue> = new Map(),
): CellValue {
  if (!formula.startsWith('=')) {
    // It's a literal value
    const num = parseFloat(formula);
    return isNaN(num) ? formula : num;
  }

  try {
    let expression = formula.substring(1).trim();

    // Handle function calls: SUM, AVERAGE, MIN, MAX, COUNT
    // Replace SUM(A1:B3) with the sum of values
    expression = expression.replace(/SUM\s*\(\s*([A-Z]+\d+:[A-Z]+\d+)\s*\)/gi, (_match, rangeStr) => {
      const range = parseRangeReference(rangeStr);
      if (!range) return '0';
      const values = getRangeValues(range, data, evaluatedCache);
      return String(values.reduce((a, b) => a + b, 0));
    });

    // Replace AVERAGE(A1:B3)
    expression = expression.replace(/AVERAGE\s*\(\s*([A-Z]+\d+:[A-Z]+\d+)\s*\)/gi, (_match, rangeStr) => {
      const range = parseRangeReference(rangeStr);
      if (!range) return '0';
      const values = getRangeValues(range, data, evaluatedCache);
      return String(values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0);
    });

    // Replace MIN(A1:B3)
    expression = expression.replace(/MIN\s*\(\s*([A-Z]+\d+:[A-Z]+\d+)\s*\)/gi, (_match, rangeStr) => {
      const range = parseRangeReference(rangeStr);
      if (!range) return '0';
      const values = getRangeValues(range, data, evaluatedCache);
      return String(values.length > 0 ? Math.min(...values) : 0);
    });

    // Replace MAX(A1:B3)
    expression = expression.replace(/MAX\s*\(\s*([A-Z]+\d+:[A-Z]+\d+)\s*\)/gi, (_match, rangeStr) => {
      const range = parseRangeReference(rangeStr);
      if (!range) return '0';
      const values = getRangeValues(range, data, evaluatedCache);
      return String(values.length > 0 ? Math.max(...values) : 0);
    });

    // Replace COUNT(A1:B3)
    expression = expression.replace(/COUNT\s*\(\s*([A-Z]+\d+:[A-Z]+\d+)\s*\)/gi, (_match, rangeStr) => {
      const range = parseRangeReference(rangeStr);
      if (!range) return '0';
      const values = getRangeValues(range, data, evaluatedCache);
      return String(values.length);
    });

    // Replace cell references with their values
    expression = expression.replace(/([A-Z]+\d+)/g, (match) => {
      const val = evaluatedCache.get(match) ?? data[match]?.value ?? 0;
      const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
      return String(num);
    });

    // Evaluate the expression safely
    // eslint-disable-next-line no-eval
    const result = Function('"use strict"; return (' + expression + ')')();

    if (typeof result === 'number' && !isNaN(result)) {
      return result;
    }
    return 0;
  } catch {
    return null; // Error in formula
  }
}

/**
 * Recalculate all cells in the spreadsheet
 */
export function recalculateAll(data: SpreadsheetData): SpreadsheetData {
  const result = { ...data };
  const evaluatedCache = new Map<string, CellValue>();

  // Check for circular references
  for (const key of Object.keys(result)) {
    if (hasCircularReference(key, result)) {
      result[key] = {
        ...result[key],
        value: null,
        error: '#CIRC!',
      };
    }
  }

  // Topologically sort and evaluate
  const sorted = topologicalSort(result);
  for (const key of sorted) {
    const cell = result[key];
    if (!cell) continue;

    if (cell.error === '#CIRC!') {
      // Skip circular references
      continue;
    }

    try {
      const value = evaluateFormula(cell.formula, result, evaluatedCache);
      evaluatedCache.set(key, value);
      result[key] = {
        ...cell,
        value,
        error: value === null ? '#ERR!' : null,
      };
    } catch {
      result[key] = {
        ...cell,
        value: null,
        error: '#ERR!',
      };
    }
  }

  return result;
}
