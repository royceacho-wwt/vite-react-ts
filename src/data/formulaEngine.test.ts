import { describe, expect, it } from 'vitest';

import {
  cellRefToKey,
  columnLetterToNumber,
  columnNumberToLetter,
  evaluateFormula,
  extractReferences,
  hasCircularReference,
  parseCellReference,
  parseRangeReference,
  recalculateAll,
} from '@/data/formulaEngine';

describe('formulaEngine', () => {
  describe('columnLetterToNumber', () => {
    it('converts A to 0', () => {
      expect(columnLetterToNumber('A')).toBe(0);
    });

    it('converts Z to 25', () => {
      expect(columnLetterToNumber('Z')).toBe(25);
    });

    it('converts AA to 26', () => {
      expect(columnLetterToNumber('AA')).toBe(26);
    });
  });

  describe('columnNumberToLetter', () => {
    it('converts 0 to A', () => {
      expect(columnNumberToLetter(0)).toBe('A');
    });

    it('converts 25 to Z', () => {
      expect(columnNumberToLetter(25)).toBe('Z');
    });

    it('converts 26 to AA', () => {
      expect(columnNumberToLetter(26)).toBe('AA');
    });
  });

  describe('cellRefToKey', () => {
    it('converts col 0, row 0 to A1', () => {
      expect(cellRefToKey(0, 0)).toBe('A1');
    });

    it('converts col 1, row 1 to B2', () => {
      expect(cellRefToKey(1, 1)).toBe('B2');
    });
  });

  describe('parseCellReference', () => {
    it('parses A1', () => {
      expect(parseCellReference('A1')).toEqual({ col: 0, row: 0 });
    });

    it('parses B2', () => {
      expect(parseCellReference('B2')).toEqual({ col: 1, row: 1 });
    });

    it('returns null for invalid reference', () => {
      expect(parseCellReference('invalid')).toBeNull();
    });
  });

  describe('parseRangeReference', () => {
    it('parses A1:B3', () => {
      const result = parseRangeReference('A1:B3');
      expect(result).toEqual({
        startCol: 0,
        startRow: 0,
        endCol: 1,
        endRow: 2,
      });
    });

    it('returns null for invalid range', () => {
      expect(parseRangeReference('invalid')).toBeNull();
    });
  });

  describe('extractReferences', () => {
    it('extracts cell references from formula', () => {
      const refs = extractReferences('=A1+B2');
      expect(refs).toContain('A1');
      expect(refs).toContain('B2');
    });

    it('extracts range references from formula', () => {
      const refs = extractReferences('=SUM(A1:B3)');
      expect(refs).toContain('A1:B3');
    });
  });

  describe('evaluateFormula', () => {
    it('evaluates literal numbers', () => {
      expect(evaluateFormula('42', {})).toBe(42);
    });

    it('evaluates literal strings', () => {
      expect(evaluateFormula('hello', {})).toBe('hello');
    });

    it('evaluates simple arithmetic', () => {
      expect(evaluateFormula('=2+3', {})).toBe(5);
    });

    it('evaluates cell references', () => {
      const data = {
        A1: { formula: '5', value: 5, error: null },
        B1: { formula: '3', value: 3, error: null },
      };
      expect(evaluateFormula('=A1+B1', data)).toBe(8);
    });

    it('evaluates SUM function', () => {
      const data = {
        A1: { formula: '1', value: 1, error: null },
        A2: { formula: '2', value: 2, error: null },
        A3: { formula: '3', value: 3, error: null },
      };
      expect(evaluateFormula('=SUM(A1:A3)', data)).toBe(6);
    });

    it('evaluates AVERAGE function', () => {
      const data = {
        A1: { formula: '2', value: 2, error: null },
        A2: { formula: '4', value: 4, error: null },
      };
      expect(evaluateFormula('=AVERAGE(A1:A2)', data)).toBe(3);
    });

    it('evaluates MIN function', () => {
      const data = {
        A1: { formula: '5', value: 5, error: null },
        A2: { formula: '2', value: 2, error: null },
        A3: { formula: '8', value: 8, error: null },
      };
      expect(evaluateFormula('=MIN(A1:A3)', data)).toBe(2);
    });

    it('evaluates MAX function', () => {
      const data = {
        A1: { formula: '5', value: 5, error: null },
        A2: { formula: '2', value: 2, error: null },
        A3: { formula: '8', value: 8, error: null },
      };
      expect(evaluateFormula('=MAX(A1:A3)', data)).toBe(8);
    });

    it('evaluates COUNT function', () => {
      const data = {
        A1: { formula: '1', value: 1, error: null },
        A2: { formula: '2', value: 2, error: null },
        A3: { formula: '3', value: 3, error: null },
      };
      expect(evaluateFormula('=COUNT(A1:A3)', data)).toBe(3);
    });

    it('returns null for invalid formula', () => {
      expect(evaluateFormula('=1/0', {})).toBe(null);
    });
  });

  describe('hasCircularReference', () => {
    it('detects direct circular reference', () => {
      const data = {
        A1: { formula: '=A1', value: null, error: null },
      };
      expect(hasCircularReference('A1', data)).toBe(true);
    });

    it('detects indirect circular reference', () => {
      const data = {
        A1: { formula: '=B1', value: null, error: null },
        B1: { formula: '=A1', value: null, error: null },
      };
      expect(hasCircularReference('A1', data)).toBe(true);
    });

    it('returns false for non-circular reference', () => {
      const data = {
        A1: { formula: '=B1', value: null, error: null },
        B1: { formula: '5', value: 5, error: null },
      };
      expect(hasCircularReference('A1', data)).toBe(false);
    });
  });

  describe('recalculateAll', () => {
    it('recalculates all cells', () => {
      const data = {
        A1: { formula: '5', value: null, error: null },
        B1: { formula: '3', value: null, error: null },
        C1: { formula: '=A1+B1', value: null, error: null },
      };
      const result = recalculateAll(data);
      expect(result.A1.value).toBe(5);
      expect(result.B1.value).toBe(3);
      expect(result.C1.value).toBe(8);
    });

    it('marks circular references with #CIRC!', () => {
      const data = {
        A1: { formula: '=A1', value: null, error: null },
      };
      const result = recalculateAll(data);
      expect(result.A1.error).toBe('#CIRC!');
    });

    it('marks bad formulas with #ERR!', () => {
      const data = {
        A1: { formula: '=1/0', value: null, error: null },
      };
      const result = recalculateAll(data);
      expect(result.A1.error).toBe('#ERR!');
    });
  });
});
