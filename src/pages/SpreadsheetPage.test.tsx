import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpreadsheetPage } from '@/pages/SpreadsheetPage';

describe('SpreadsheetPage', () => {
  it('renders the spreadsheet page', () => {
    render(<SpreadsheetPage />);
    expect(screen.getByText('📊 Spreadsheet')).toBeInTheDocument();
  });

  it('displays instructions', () => {
    render(<SpreadsheetPage />);
    expect(screen.getByText(/Click to select/)).toBeInTheDocument();
  });
});
