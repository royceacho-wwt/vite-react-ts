import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';

import { SpreadsheetPage } from '@/pages/SpreadsheetPage';

describe('SpreadsheetPage', () => {
  it('renders the spreadsheet page', () => {
    render(<SpreadsheetPage />);
    expect(screen.getByText('📊 Spreadsheet')).toBeInTheDocument();
  });

  it('renders the spreadsheet grid', () => {
    render(<SpreadsheetPage />);
    const grid = screen.getByRole('presentation', { hidden: true });
    expect(grid).toBeInTheDocument();
  });
});
