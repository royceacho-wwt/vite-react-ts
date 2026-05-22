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
  it('renders the brand name', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByText(/MyApp/i)).toBeDefined();
  });

  it('renders Home, Weather, and Time Zones links', () => {
    render(<NavBar {...defaultProps} />);
    expect(screen.getByRole('link', { name: /home/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /weather/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /time zones/i })).toBeDefined();
  });

  it('marks the Home link as active when path is "/"', () => {
    render(<NavBar {...defaultProps} currentPath="/" />);
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink.className).toContain('navbar-link--active');
  });

  it('marks the Weather link as active when path is "/weather"', () => {
    render(<NavBar {...defaultProps} currentPath="/weather" />);
    const weatherLink = screen.getByRole('link', { name: /weather/i });
    expect(weatherLink.className).toContain('navbar-link--active');
  });

  it('marks the Time Zones link as active when path is "/timezones"', () => {
    render(<NavBar {...defaultProps} currentPath="/timezones" />);
    const tzLink = screen.getByRole('link', { name: /time zones/i });
    expect(tzLink.className).toContain('navbar-link--active');
  });

  it('calls onNavigate with "/" when Home link is clicked', () => {
    const onNavigate = vi.fn();
    render(<NavBar {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('link', { name: /home/i }));
    expect(onNavigate).toHaveBeenCalledWith('/');
  });

  it('calls onNavigate with "/weather" when Weather link is clicked', () => {
    const onNavigate = vi.fn();
    render(<NavBar {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('link', { name: /weather/i }));
    expect(onNavigate).toHaveBeenCalledWith('/weather');
  });

  it('calls onNavigate with "/timezones" when Time Zones link is clicked', () => {
    const onNavigate = vi.fn();
    render(<NavBar {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole('link', { name: /time zones/i }));
    expect(onNavigate).toHaveBeenCalledWith('/timezones');
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
