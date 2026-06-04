import { describe, expect, it } from 'vitest';

import { applyMove, hasWon, isLost, slideRow, spawnTile } from '@/hooks/use2048';

/* ── slideRow ────────────────────────────────────────────────────────────────── */

describe('slideRow', () => {
  it('[2,0,0,2] → [4,0,0,0], score 4', () => {
    const { row, score } = slideRow([2, 0, 0, 2]);
    expect(row).toEqual([4, 0, 0, 0]);
    expect(score).toBe(4);
  });

  it('[2,2,0,0] → [4,0,0,0], score 4', () => {
    const { row, score } = slideRow([2, 2, 0, 0]);
    expect(row).toEqual([4, 0, 0, 0]);
    expect(score).toBe(4);
  });

  it('[2,2,2,2] → [4,4,0,0], score 8 (each tile merges at most once)', () => {
    const { row, score } = slideRow([2, 2, 2, 2]);
    expect(row).toEqual([4, 4, 0, 0]);
    expect(score).toBe(8);
  });

  it('[2,2,4,0] → [4,4,0,0], score 4 (merged 4 does not re-merge with existing 4)', () => {
    const { row, score } = slideRow([2, 2, 4, 0]);
    expect(row).toEqual([4, 4, 0, 0]);
    expect(score).toBe(4);
  });

  it('[2,4,2,4] → [2,4,2,4], score 0 (no equal adjacent tiles)', () => {
    const { row, score } = slideRow([2, 4, 2, 4]);
    expect(row).toEqual([2, 4, 2, 4]);
    expect(score).toBe(0);
  });

  it('[0,0,2,2] → [4,0,0,0], score 4 (slide then merge)', () => {
    const { row, score } = slideRow([0, 0, 2, 2]);
    expect(row).toEqual([4, 0, 0, 0]);
    expect(score).toBe(4);
  });

  it('[0,0,0,0] → [0,0,0,0], score 0', () => {
    const { row, score } = slideRow([0, 0, 0, 0]);
    expect(row).toEqual([0, 0, 0, 0]);
    expect(score).toBe(0);
  });

  it('[4,0,0,4] → [8,0,0,0], score 8', () => {
    const { row, score } = slideRow([4, 0, 0, 4]);
    expect(row).toEqual([8, 0, 0, 0]);
    expect(score).toBe(8);
  });

  it('[2,0,2,4] → [4,4,0,0], score 4', () => {
    const { row, score } = slideRow([2, 0, 2, 4]);
    expect(row).toEqual([4, 4, 0, 0]);
    expect(score).toBe(4);
  });
});

/* ── applyMove ───────────────────────────────────────────────────────────────── */

describe('applyMove – left', () => {
  it('slides every row leftward', () => {
    const board = [
      [2, 0, 0, 2],
      [0, 4, 4, 0],
      [2, 2, 2, 2],
      [0, 0, 0, 0],
    ];
    const { board: result, score, changed } = applyMove(board, 'left');
    expect(result[0]).toEqual([4, 0, 0, 0]);
    expect(result[1]).toEqual([8, 0, 0, 0]);
    expect(result[2]).toEqual([4, 4, 0, 0]);
    expect(result[3]).toEqual([0, 0, 0, 0]);
    expect(score).toBe(4 + 8 + 8);
    expect(changed).toBe(true);
  });

  it('returns changed=false when the board is unchanged', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    const { changed } = applyMove(board, 'left');
    expect(changed).toBe(false);
  });
});

describe('applyMove – right', () => {
  it('slides every row rightward (mirrors left by reversing)', () => {
    const board = [
      [2, 0, 0, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result, score } = applyMove(board, 'right');
    expect(result[0]).toEqual([0, 0, 0, 4]);
    expect(score).toBe(4);
  });

  it('[2,2,2,2] right → [0,0,4,4]', () => {
    const board = [
      [2, 2, 2, 2],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result } = applyMove(board, 'right');
    expect(result[0]).toEqual([0, 0, 4, 4]);
  });
});

describe('applyMove – up', () => {
  it('slides tiles upward using an asymmetric board', () => {
    // Column 0: [2,0,0,2] → slide up → [4,0,0,0]
    // Column 1: [4,4,0,0] → slide up → [8,0,0,0]
    const board = [
      [2, 4, 0, 0],
      [0, 4, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ];
    const { board: result, score } = applyMove(board, 'up');
    expect(result[0][0]).toBe(4);
    expect(result[1][0]).toBe(0);
    expect(result[2][0]).toBe(0);
    expect(result[3][0]).toBe(0);
    expect(result[0][1]).toBe(8);
    expect(result[1][1]).toBe(0);
    expect(score).toBe(4 + 8);
  });

  it('does not mix rows and columns (axis correctness)', () => {
    // Only column 0 has values; after up, they should stay in column 0
    const board = [
      [0, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result } = applyMove(board, 'up');
    expect(result[0][0]).toBe(2);
    expect(result[1][0]).toBe(0);
    // No bleed into other columns
    for (let c = 1; c < 4; c++) {
      expect(result[0][c]).toBe(0);
    }
  });
});

describe('applyMove – down', () => {
  it('slides tiles downward using an asymmetric board', () => {
    // Column 0: [2,0,0,2] → slide down → [0,0,0,4]
    const board = [
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [2, 0, 0, 0],
    ];
    const { board: result, score } = applyMove(board, 'down');
    expect(result[3][0]).toBe(4);
    expect(result[0][0]).toBe(0);
    expect(score).toBe(4);
  });

  it('does not mix rows and columns (axis correctness)', () => {
    const board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [4, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { board: result } = applyMove(board, 'down');
    expect(result[3][0]).toBe(4);
    expect(result[2][0]).toBe(0);
    for (let c = 1; c < 4; c++) {
      expect(result[3][c]).toBe(0);
    }
  });
});

describe('applyMove – score accumulation', () => {
  it('two merges in one move both add to the score', () => {
    const board = [
      [2, 2, 4, 4],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const { score } = applyMove(board, 'left');
    // 2+2=4 (score+4) and 4+4=8 (score+8) → total 12
    expect(score).toBe(12);
  });
});

/* ── spawnTile ───────────────────────────────────────────────────────────────── */

describe('spawnTile', () => {
  it('places a tile in the only empty cell', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 0], // cell [3][3] is the only empty cell
    ];
    // rand always < 0.9 → value 2
    const result = spawnTile(board, () => 0.5);
    expect(result[3][3]).toBe(2);
  });

  it('spawns value 4 when rand() >= 0.9 on the second call', () => {
    const board = [
      [0, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 2],
    ];
    // First rand() → pick index 0 (only empty cell); second rand() → 0.95 ≥ 0.9 → value 4
    let call = 0;
    const rand = () => (call++ === 0 ? 0 : 0.95);
    const result = spawnTile(board, rand);
    expect(result[0][0]).toBe(4);
  });

  it('returns the board unchanged when there are no empty cells', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 2],
    ];
    const result = spawnTile(board, Math.random);
    expect(result).toEqual(board);
  });

  it('spawned value is always 2 or 4', () => {
    const board = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (let i = 0; i < 20; i++) {
      const result = spawnTile(board, Math.random);
      const nonZero = result.flat().filter((v) => v !== 0);
      expect(nonZero).toHaveLength(1);
      expect([2, 4]).toContain(nonZero[0]);
    }
  });
});

/* ── hasWon ──────────────────────────────────────────────────────────────────── */

describe('hasWon', () => {
  it('returns true when any cell contains 2048', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2048, 4],
      [8, 16, 32, 2],
    ];
    expect(hasWon(board)).toBe(true);
  });

  it('returns false when no cell contains 2048', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 4, 2],
      [8, 16, 32, 2],
    ];
    expect(hasWon(board)).toBe(false);
  });

  it('returns false on an empty board', () => {
    const board = Array.from({ length: 4 }, () => Array(4).fill(0));
    expect(hasWon(board)).toBe(false);
  });
});

/* ── isLost ──────────────────────────────────────────────────────────────────── */

describe('isLost', () => {
  it('returns true when board is full and no adjacent pairs exist', () => {
    // Classic checkerboard of values with no equal neighbours
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 2],
    ];
    expect(isLost(board)).toBe(true);
  });

  it('returns false when board is full but one horizontal adjacent pair exists', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [4, 2, 4, 4], // last two cells are equal
    ];
    expect(isLost(board)).toBe(false);
  });

  it('returns false when board is full but one vertical adjacent pair exists', () => {
    const board = [
      [2, 4, 2, 4],
      [4, 2, 4, 2],
      [2, 4, 2, 4],
      [2, 8, 16, 32], // row[3][0] === row[2][0] → vertical pair
    ];
    expect(isLost(board)).toBe(false);
  });

  it('returns false when board has empty cells', () => {
    const board = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 0, 4],
      [8, 16, 32, 2],
    ];
    expect(isLost(board)).toBe(false);
  });

  it('returns false on a completely empty board', () => {
    const board = Array.from({ length: 4 }, () => Array(4).fill(0));
    expect(isLost(board)).toBe(false);
  });
});
