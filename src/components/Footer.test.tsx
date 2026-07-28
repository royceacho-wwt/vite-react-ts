import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Footer } from './Footer';

describe('Footer', () => {
  it('renders the footer with version', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('displays the version number', () => {
    render(<Footer />);
    const versionText = screen.getByText(/v\d+\.\d+\.\d+/);
    expect(versionText).toBeInTheDocument();
  });
});
