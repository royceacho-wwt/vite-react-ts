import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NavBar } from '@/components/NavBar';

const defaultProps = {
  currentPath: '/',
  onNavigate: vi.fn(),
  isDark: false,
  onToggleTheme: vi.fn(),
};

// Every internal navigation link: [readable name pattern, active path, expected target path]
const NAV_LINKS: [string, string, string][] = [
  ['home', '/', '/'],
  ['weather', '/weather', '/weather'],
  ['time zones', '/timezones', '/timezones'],
  ['tic tac toe', '/tictactoe', '/tictactoe'],
  ['contact', '/contact', '/contact'],
];

describe('NavBar', () => {
  it('renders the brand name', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText(/MyApp/i)).toBeDefined();
  });

  it('renders all navigation links', () => {
    render(<NavBar {...defaultProps} />);
    NAV_LINKS.forEach(([name]) => {
      expect(screen.getByRole('link', { name: new RegExp(name, 'i') })).toBeDefined();
    });
  });

  it.each(NAV_LINKS)('marks the %s link as active when its path is current', (name, activePath) => {
    render(<NavBar {...defaultProps} currentPath={activePath} />);
    const link = screen.getByRole('link', { name: new RegExp(name, 'i') });
    expect(link.className).toContain('navbar-link--active');
  });

  it.each(NAV_LINKS)('calls onNavigate with "%s" when its link is clicked', (name, _activePath, targetPath) => {
    const onNavigate = vi.fn();
    render(<NavBar {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('link', { name: new RegExp(name, 'i') }));
    expect(onNavigate).toHaveBeenCalledWith(targetPath);
  });

  it('renders the theme toggle button', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByRole('button', { name: /switch to (dark|light) mode/i })).toBeDefined();
  });

  it('calls onToggleTheme when theme button is clicked', () => {
    const onToggleTheme = vi.fn();
    render(<NavBar {...defaultProps} onToggleTheme={onToggleTheme} />);
    fireEvent.click(screen.getByRole('button', { name: /switch to (dark|light) mode/i }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);
  });
});
