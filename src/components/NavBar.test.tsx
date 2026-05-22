import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NavBar } from '@/components/NavBar';

const defaultProps = {
  currentPath: '/',
  onNavigate: vi.fn(),
  isDark: false,
  onToggleTheme: vi.fn(),
};

describe('NavBar', () => {
  it('renders the brand name and all navigation links', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText(/MyApp/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /home/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /weather/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /time zones/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /tic tac toe/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /contact/i })).toBeDefined();
  });

  it.each([
    ['/', /home/i],
    ['/weather', /weather/i],
    ['/timezones', /time zones/i],
    ['/tictactoe', /tic tac toe/i],
    ['/contact', /contact/i],
  ])('marks the correct link as active for path "%s"', (path, linkName) => {
    render(<NavBar {...defaultProps} currentPath={path} />);
    const activeLink = screen.getByRole('link', { name: linkName });
    expect(activeLink.className).toContain('navbar-link--active');
    expect(activeLink.getAttribute('aria-current')).toBe('page');
  });

  it.each([
    [/home/i, '/'],
    [/weather/i, '/weather'],
    [/time zones/i, '/timezones'],
    [/tic tac toe/i, '/tictactoe'],
    [/contact/i, '/contact'],
  ])('calls onNavigate with the correct path when "%s" link is clicked', (linkName, expectedPath) => {
    const onNavigate = vi.fn();
    render(<NavBar {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('link', { name: linkName }));
    expect(onNavigate).toHaveBeenCalledWith(expectedPath);
  });

  it('renders the theme toggle and calls onToggleTheme when clicked', () => {
    const onToggleTheme = vi.fn();
    render(<NavBar {...defaultProps} onToggleTheme={onToggleTheme} />);
    const toggle = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
    expect(toggle).toBeDefined();
    fireEvent.click(toggle);
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
