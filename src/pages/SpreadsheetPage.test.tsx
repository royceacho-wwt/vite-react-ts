import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SpreadsheetPage } from './SpreadsheetPage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SpreadsheetPage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('renders the spreadsheet page', () => {
    render(<SpreadsheetPage />);
    expect(screen.getByText('📊 Spreadsheet')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<SpreadsheetPage />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders row headers', () => {
    render(<SpreadsheetPage />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('selects a cell on click', () => {
    render(<SpreadsheetPage />);
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.click(cellA1);
    expect(cellA1).toHaveClass('selected');
  });

  it('enters edit mode on double click', () => {
    render(<SpreadsheetPage />);
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    expect(screen.getByTestId('input-A1')).toBeInTheDocument();
  });

  it('enters a literal value', () => {
    render(<SpreadsheetPage />);
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);

    const input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A1')).toHaveTextContent('42');
  });

  it('enters a text value', () => {
    render(<SpreadsheetPage />);
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);

    const input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A1')).toHaveTextContent('Hello');
  });

  it('evaluates a simple formula', () => {
    render(<SpreadsheetPage />);

    // Enter 10 in A1
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter 20 in A2
    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter formula in A3
    const cellA3 = screen.getByTestId('cell-A3');
    fireEvent.doubleClick(cellA3);
    input = screen.getByTestId('input-A3');
    fireEvent.change(input, { target: { value: '=A1+A2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A3')).toHaveTextContent('30');
  });

  it('evaluates SUM function', () => {
    render(<SpreadsheetPage />);

    // Enter values
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA3 = screen.getByTestId('cell-A3');
    fireEvent.doubleClick(cellA3);
    input = screen.getByTestId('input-A3');
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter SUM formula
    const cellA4 = screen.getByTestId('cell-A4');
    fireEvent.doubleClick(cellA4);
    input = screen.getByTestId('input-A4');
    fireEvent.change(input, { target: { value: '=SUM(A1:A3)' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A4')).toHaveTextContent('30');
  });

  it('evaluates AVERAGE function', () => {
    render(<SpreadsheetPage />);

    // Enter values
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter AVERAGE formula
    const cellA3 = screen.getByTestId('cell-A3');
    fireEvent.doubleClick(cellA3);
    input = screen.getByTestId('input-A3');
    fireEvent.change(input, { target: { value: '=AVERAGE(A1:A2)' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A3')).toHaveTextContent('15');
  });

  it('evaluates MIN function', () => {
    render(<SpreadsheetPage />);

    // Enter values
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA3 = screen.getByTestId('cell-A3');
    fireEvent.doubleClick(cellA3);
    input = screen.getByTestId('input-A3');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter MIN formula
    const cellA4 = screen.getByTestId('cell-A4');
    fireEvent.doubleClick(cellA4);
    input = screen.getByTestId('input-A4');
    fireEvent.change(input, { target: { value: '=MIN(A1:A3)' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A4')).toHaveTextContent('3');
  });

  it('evaluates MAX function', () => {
    render(<SpreadsheetPage />);

    // Enter values
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA3 = screen.getByTestId('cell-A3');
    fireEvent.doubleClick(cellA3);
    input = screen.getByTestId('input-A3');
    fireEvent.change(input, { target: { value: '8' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter MAX formula
    const cellA4 = screen.getByTestId('cell-A4');
    fireEvent.doubleClick(cellA4);
    input = screen.getByTestId('input-A4');
    fireEvent.change(input, { target: { value: '=MAX(A1:A3)' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A4')).toHaveTextContent('8');
  });

  it('evaluates COUNT function', () => {
    render(<SpreadsheetPage />);

    // Enter values
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '3' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter COUNT formula
    const cellA3 = screen.getByTestId('cell-A3');
    fireEvent.doubleClick(cellA3);
    input = screen.getByTestId('input-A3');
    fireEvent.change(input, { target: { value: '=COUNT(A1:A2)' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A3')).toHaveTextContent('2');
  });

  it('shows #ERR! for invalid formulas', () => {
    render(<SpreadsheetPage />);

    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    const input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '=INVALID()' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A1')).toHaveTextContent('#ERR!');
  });

  it('shows #DIV/0! for division by zero', () => {
    render(<SpreadsheetPage />);

    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    const input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '=10/0' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A1')).toHaveTextContent('#DIV/0!');
  });

  it('detects circular references', () => {
    render(<SpreadsheetPage />);

    // A1 = =A2
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '=A2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // A2 = =A1 (creates circular reference)
    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '=A1' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A1')).toHaveTextContent('#CIRC!');
    expect(screen.getByTestId('cell-A2')).toHaveTextContent('#CIRC!');
  });

  it('navigates with arrow keys', () => {
    render(<SpreadsheetPage />);

    const page = screen.getByTestId('spreadsheet-page');

    // Select A1
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.click(cellA1);
    expect(cellA1).toHaveClass('selected');

    // Press right arrow
    fireEvent.keyDown(page, { key: 'ArrowRight' });
    expect(screen.getByTestId('cell-B1')).toHaveClass('selected');

    // Press down arrow
    fireEvent.keyDown(page, { key: 'ArrowDown' });
    expect(screen.getByTestId('cell-B2')).toHaveClass('selected');

    // Press left arrow
    fireEvent.keyDown(page, { key: 'ArrowLeft' });
    expect(screen.getByTestId('cell-A2')).toHaveClass('selected');

    // Press up arrow
    fireEvent.keyDown(page, { key: 'ArrowUp' });
    expect(screen.getByTestId('cell-A1')).toHaveClass('selected');
  });

  it('navigates with Tab key', () => {
    render(<SpreadsheetPage />);

    const page = screen.getByTestId('spreadsheet-page');

    // Select A1
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.click(cellA1);

    // Press Tab
    fireEvent.keyDown(page, { key: 'Tab' });
    expect(screen.getByTestId('cell-B1')).toHaveClass('selected');

    // Press Shift+Tab
    fireEvent.keyDown(page, { key: 'Tab', shiftKey: true });
    expect(screen.getByTestId('cell-A1')).toHaveClass('selected');
  });

  it('enters edit mode with Enter key', () => {
    render(<SpreadsheetPage />);

    const page = screen.getByTestId('spreadsheet-page');

    // Select A1
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.click(cellA1);

    // Press Enter to edit
    fireEvent.keyDown(page, { key: 'Enter' });
    expect(screen.getByTestId('input-A1')).toBeInTheDocument();
  });

  it('cancels editing with Escape', () => {
    render(<SpreadsheetPage />);

    // Enter a value first
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Start editing again
    fireEvent.doubleClick(cellA1);
    input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '200' } });

    // Press Escape to cancel
    fireEvent.keyDown(input, { key: 'Escape' });

    // Value should remain 100
    expect(screen.getByTestId('cell-A1')).toHaveTextContent('100');
  });

  it('shows formula in formula bar when cell is selected', () => {
    render(<SpreadsheetPage />);

    // Enter a formula
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    const input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '=10+20' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Cell should show computed value
    expect(screen.getByTestId('cell-A1')).toHaveTextContent('30');

    // Select the cell
    fireEvent.click(cellA1);

    // Formula bar should show the formula
    const formulaBar = screen.getByTestId('formula-bar');
    expect(formulaBar).toHaveValue('=10+20');
  });

  it('recalculates dependent cells when a cell changes', () => {
    render(<SpreadsheetPage />);

    // Enter 10 in A1
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Enter formula in A2
    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '=A1*2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A2')).toHaveTextContent('20');

    // Change A1 to 20
    fireEvent.doubleClick(cellA1);
    input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // A2 should update to 40
    expect(screen.getByTestId('cell-A2')).toHaveTextContent('40');
  });

  it('handles arithmetic operations', () => {
    render(<SpreadsheetPage />);

    // Test multiplication
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    let input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '=5*3' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('cell-A1')).toHaveTextContent('15');

    // Test subtraction
    const cellA2 = screen.getByTestId('cell-A2');
    fireEvent.doubleClick(cellA2);
    input = screen.getByTestId('input-A2');
    fireEvent.change(input, { target: { value: '=10-3' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('cell-A2')).toHaveTextContent('7');

    // Test division
    const cellA3 = screen.getByTestId('cell-A3');
    fireEvent.doubleClick(cellA3);
    input = screen.getByTestId('input-A3');
    fireEvent.change(input, { target: { value: '=20/4' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('cell-A3')).toHaveTextContent('5');

    // Test parentheses
    const cellA4 = screen.getByTestId('cell-A4');
    fireEvent.doubleClick(cellA4);
    input = screen.getByTestId('input-A4');
    fireEvent.change(input, { target: { value: '=(2+3)*4' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('cell-A4')).toHaveTextContent('20');
  });

  it('deletes cell content with Delete key', () => {
    render(<SpreadsheetPage />);

    const page = screen.getByTestId('spreadsheet-page');

    // Enter a value
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    const input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '100' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByTestId('cell-A1')).toHaveTextContent('100');

    // Select and delete
    fireEvent.click(cellA1);
    fireEvent.keyDown(page, { key: 'Delete' });

    expect(screen.getByTestId('cell-A1')).toHaveTextContent('');
  });

  it('persists data to localStorage', () => {
    render(<SpreadsheetPage />);

    // Enter a value
    const cellA1 = screen.getByTestId('cell-A1');
    fireEvent.doubleClick(cellA1);
    const input = screen.getByTestId('input-A1');
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Check localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
