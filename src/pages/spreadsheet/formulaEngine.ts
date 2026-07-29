import { CellData, cellIdToPosition, CellValue, ERRORS, positionToCellId } from './types';

// Token types for the formula parser
type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'CELL_REF'
  | 'RANGE'
  | 'FUNCTION'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string | number;
}

// Tokenize a formula string
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    const char = formula[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers (including decimals)
    if (/\d/.test(char) || (char === '.' && /\d/.test(formula[i + 1] || ''))) {
      let num = '';
      while (i < formula.length && (/\d/.test(formula[i]) || formula[i] === '.')) {
        num += formula[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      continue;
    }

    // Cell references, ranges, or functions
    if (/[A-Za-z]/.test(char)) {
      let ident = '';
      while (i < formula.length && /[A-Za-z0-9]/.test(formula[i])) {
        ident += formula[i];
        i++;
      }

      // Check for range (e.g., A1:B3)
      if (formula[i] === ':') {
        i++; // skip ':'
        let endIdent = '';
        while (i < formula.length && /[A-Za-z0-9]/.test(formula[i])) {
          endIdent += formula[i];
          i++;
        }
        tokens.push({ type: 'RANGE', value: `${ident.toUpperCase()}:${endIdent.toUpperCase()}` });
        continue;
      }

      // Check if it's a function (followed by '(')
      const upperIdent = ident.toUpperCase();
      if (['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT'].includes(upperIdent)) {
        tokens.push({ type: 'FUNCTION', value: upperIdent });
      } else if (/^[A-Z]+\d+$/i.test(ident)) {
        // Cell reference
        tokens.push({ type: 'CELL_REF', value: ident.toUpperCase() });
      } else {
        throw new Error(`Unknown identifier: ${ident}`);
      }
      continue;
    }

    // Operators
    if (['+', '-', '*', '/'].includes(char)) {
      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    // Parentheses
    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // Comma
    if (char === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    // String literals (in quotes)
    if (char === '"' || char === "'") {
      const quote = char;
      i++;
      let str = '';
      while (i < formula.length && formula[i] !== quote) {
        str += formula[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// Parser class for recursive descent parsing
class FormulaParser {
  private tokens: Token[];
  private pos: number;
  private getCellValue: (cellId: string) => CellValue;

  constructor(tokens: Token[], getCellValue: (cellId: string) => CellValue) {
    this.tokens = tokens;
    this.pos = 0;
    this.getCellValue = getCellValue;
  }

  private current(): Token {
    return this.tokens[this.pos];
  }

  private consume(type?: TokenType): Token {
    const token = this.current();
    if (type && token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`);
    }
    this.pos++;
    return token;
  }

  parse(): CellValue {
    const result = this.parseExpression();
    if (this.current().type !== 'EOF') {
      throw new Error('Unexpected token after expression');
    }
    return result;
  }

  private parseExpression(): CellValue {
    return this.parseAdditive();
  }

  private parseAdditive(): CellValue {
    let left = this.parseMultiplicative();

    while (this.current().type === 'OPERATOR' && (this.current().value === '+' || this.current().value === '-')) {
      const op = this.consume().value as string;
      const right = this.parseMultiplicative();

      const leftNum = this.toNumber(left);
      const rightNum = this.toNumber(right);

      if (op === '+') {
        left = leftNum + rightNum;
      } else {
        left = leftNum - rightNum;
      }
    }

    return left;
  }

  private parseMultiplicative(): CellValue {
    let left = this.parseUnary();

    while (this.current().type === 'OPERATOR' && (this.current().value === '*' || this.current().value === '/')) {
      const op = this.consume().value as string;
      const right = this.parseUnary();

      const leftNum = this.toNumber(left);
      const rightNum = this.toNumber(right);

      if (op === '*') {
        left = leftNum * rightNum;
      } else {
        if (rightNum === 0) {
          throw new Error(ERRORS.DIV_ZERO);
        }
        left = leftNum / rightNum;
      }
    }

    return left;
  }

  private parseUnary(): CellValue {
    if (this.current().type === 'OPERATOR' && this.current().value === '-') {
      this.consume();
      const value = this.parsePrimary();
      return -this.toNumber(value);
    }
    if (this.current().type === 'OPERATOR' && this.current().value === '+') {
      this.consume();
      return this.parsePrimary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): CellValue {
    const token = this.current();

    if (token.type === 'NUMBER') {
      this.consume();
      return token.value as number;
    }

    if (token.type === 'STRING') {
      this.consume();
      return token.value as string;
    }

    if (token.type === 'CELL_REF') {
      this.consume();
      return this.getCellValue(token.value as string);
    }

    if (token.type === 'FUNCTION') {
      return this.parseFunction();
    }

    if (token.type === 'LPAREN') {
      this.consume();
      const result = this.parseExpression();
      this.consume('RPAREN');
      return result;
    }

    throw new Error(`Unexpected token: ${token.type}`);
  }

  private parseFunction(): CellValue {
    const funcName = this.consume('FUNCTION').value as string;
    this.consume('LPAREN');

    const args: CellValue[] = [];

    while (this.current().type !== 'RPAREN') {
      if (this.current().type === 'RANGE') {
        const rangeValues = this.expandRange(this.consume().value as string);
        args.push(...rangeValues);
      } else {
        args.push(this.parseExpression());
      }

      if (this.current().type === 'COMMA') {
        this.consume();
      }
    }

    this.consume('RPAREN');

    return this.evaluateFunction(funcName, args);
  }

  private expandRange(range: string): CellValue[] {
    const [start, end] = range.split(':');
    const startPos = cellIdToPosition(start);
    const endPos = cellIdToPosition(end);

    if (!startPos || !endPos) {
      throw new Error(ERRORS.REF);
    }

    const values: CellValue[] = [];
    const minRow = Math.min(startPos.row, endPos.row);
    const maxRow = Math.max(startPos.row, endPos.row);
    const minCol = Math.min(startPos.col, endPos.col);
    const maxCol = Math.max(startPos.col, endPos.col);

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const cellId = positionToCellId(row, col);
        values.push(this.getCellValue(cellId));
      }
    }

    return values;
  }

  private evaluateFunction(name: string, args: CellValue[]): CellValue {
    const numbers = args.map((v) => (typeof v === 'number' ? v : parseFloat(String(v)))).filter((n) => !isNaN(n));

    switch (name) {
      case 'SUM':
        return numbers.reduce((a, b) => a + b, 0);
      case 'AVERAGE':
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
      case 'MIN':
        if (numbers.length === 0) return 0;
        return Math.min(...numbers);
      case 'MAX':
        if (numbers.length === 0) return 0;
        return Math.max(...numbers);
      case 'COUNT':
        return numbers.length;
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  private toNumber(value: CellValue): number {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    return num;
  }
}

// Get all cell references from a formula
export function getCellReferences(formula: string): string[] {
  if (!formula.startsWith('=')) return [];

  const refs: string[] = [];
  const cellRefRegex = /([A-Z]+\d+)/gi;
  const rangeRegex = /([A-Z]+\d+):([A-Z]+\d+)/gi;

  // First, expand ranges
  let match;
  while ((match = rangeRegex.exec(formula)) !== null) {
    const [, start, end] = match;
    const startPos = cellIdToPosition(start);
    const endPos = cellIdToPosition(end);

    if (startPos && endPos) {
      const minRow = Math.min(startPos.row, endPos.row);
      const maxRow = Math.max(startPos.row, endPos.row);
      const minCol = Math.min(startPos.col, endPos.col);
      const maxCol = Math.max(startPos.col, endPos.col);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          refs.push(positionToCellId(row, col));
        }
      }
    }
  }

  // Then get individual cell references (excluding those in ranges)
  const formulaWithoutRanges = formula.replace(rangeRegex, '');
  while ((match = cellRefRegex.exec(formulaWithoutRanges)) !== null) {
    refs.push(match[1].toUpperCase());
  }

  return [...new Set(refs)];
}

// Build dependency graph and detect circular references
export function buildDependencyGraph(cells: Record<string, CellData>): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();

  for (const cellId of Object.keys(cells)) {
    const cell = cells[cellId];
    if (cell.raw.startsWith('=')) {
      const refs = getCellReferences(cell.raw);
      graph.set(cellId, new Set(refs));
    } else {
      graph.set(cellId, new Set());
    }
  }

  return graph;
}

// Topological sort with cycle detection
export function topologicalSort(
  cells: Record<string, CellData>,
  changedCell: string
): { order: string[]; cycles: Set<string> } {
  const graph = buildDependencyGraph(cells);
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const order: string[] = [];
  const cycles = new Set<string>();

  // Find all cells that depend on the changed cell (directly or indirectly)
  const dependents = new Map<string, Set<string>>();
  for (const [cellId, deps] of graph) {
    for (const dep of deps) {
      if (!dependents.has(dep)) {
        dependents.set(dep, new Set());
      }
      const depSet = dependents.get(dep);
      if (depSet) {
        depSet.add(cellId);
      }
    }
  }

  // Get all cells that need recalculation
  const toRecalc = new Set<string>();
  const queue = [changedCell];
  while (queue.length > 0) {
    const cell = queue.shift();
    if (!cell || toRecalc.has(cell)) continue;
    toRecalc.add(cell);
    const deps = dependents.get(cell) || new Set();
    for (const dep of deps) {
      queue.push(dep);
    }
  }

  function visit(cellId: string): boolean {
    if (inStack.has(cellId)) {
      return true; // Cycle detected
    }
    if (visited.has(cellId)) {
      return false;
    }

    inStack.add(cellId);
    visited.add(cellId);

    const deps = graph.get(cellId) || new Set();
    for (const dep of deps) {
      if (visit(dep)) {
        cycles.add(cellId);
        cycles.add(dep);
      }
    }

    inStack.delete(cellId);
    order.push(cellId);
    return false;
  }

  // Visit all cells that need recalculation
  for (const cellId of toRecalc) {
    if (!visited.has(cellId)) {
      visit(cellId);
    }
  }

  return { order, cycles };
}

// Evaluate a single formula
export function evaluateFormula(formula: string, getCellValue: (cellId: string) => CellValue): CellValue {
  if (!formula.startsWith('=')) {
    // Not a formula, return as literal
    const num = parseFloat(formula);
    if (!isNaN(num) && formula.trim() !== '') {
      return num;
    }
    return formula;
  }

  const formulaBody = formula.slice(1); // Remove '='
  const tokens = tokenize(formulaBody);
  const parser = new FormulaParser(tokens, getCellValue);
  return parser.parse();
}

// Recalculate all cells in the correct order
export function recalculateCells(cells: Record<string, CellData>, changedCell: string): Record<string, CellData> {
  const newCells = { ...cells };
  const { order, cycles } = topologicalSort(cells, changedCell);

  // Create a function to get cell values
  const getCellValue = (cellId: string): CellValue => {
    const cell = newCells[cellId];
    if (!cell) return 0;
    if (cell.error) {
      throw new Error(cell.error);
    }
    return cell.computed;
  };

  // Evaluate cells in topological order
  for (const cellId of order) {
    const cell = newCells[cellId];
    if (!cell) continue;

    if (cycles.has(cellId)) {
      newCells[cellId] = {
        ...cell,
        computed: ERRORS.CIRCULAR,
        error: ERRORS.CIRCULAR,
      };
      continue;
    }

    try {
      const computed = evaluateFormula(cell.raw, getCellValue);
      newCells[cellId] = {
        ...cell,
        computed,
        error: undefined,
      };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : ERRORS.ERROR;
      const displayError = errorMsg.startsWith('#') ? errorMsg : ERRORS.ERROR;
      newCells[cellId] = {
        ...cell,
        computed: displayError,
        error: displayError,
      };
    }
  }

  return newCells;
}
