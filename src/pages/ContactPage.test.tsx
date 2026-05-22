import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ContactPage } from '@/pages/ContactPage';

describe('ContactPage', () => {
  it('renders the Contact heading', () => {
    render(<ContactPage />);
    expect(screen.getByRole('heading', { name: /contact/i })).toBeDefined();
  });

  it('renders the contact message', () => {
    render(<ContactPage />);
    expect(screen.getByText(/you can reach me at yo mama's house!/i)).toBeDefined();
  });
});
