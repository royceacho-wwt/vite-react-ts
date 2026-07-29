import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SpreadsheetPage } from '@/pages/SpreadsheetPage';

describe('SpreadsheetPage', () => {
  it('renders the spreadsheet page', async () => {
    render(<SpreadsheetPage />);
    await waitFor(() => {
      expect(screen.getByText('📊 Spreadsheet')).toBeInTheDocument();
    });
  });

  it('displays instructions', async () => {
    render(<SpreadsheetPage />);
    await waitFor(() => {
      expect(screen.getByText(/Click to select/)).toBeInTheDocument();
    });
  });
});
