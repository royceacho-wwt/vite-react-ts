import { fireEvent, render, screen } from '@testing-library/react';

import { NavBar } from '@/components/NavBar';

test('renders Home and Weather nav links', () => {
  render(<NavBar currentPage="home" onNavigate={() => undefined} />);
  expect(screen.getByRole('button', { name: /home/i })).toBeDefined();
  expect(screen.getByRole('button', { name: /weather/i })).toBeDefined();
});

test('marks Home as active when currentPage is home', () => {
  render(<NavBar currentPage="home" onNavigate={() => undefined} />);
  const homeBtn = screen.getByRole('button', { name: /home/i });
  expect(homeBtn.getAttribute('aria-current')).toBe('page');
  const weatherBtn = screen.getByRole('button', { name: /weather/i });
  expect(weatherBtn.getAttribute('aria-current')).toBeNull();
});

test('marks Weather as active when currentPage is weather', () => {
  render(<NavBar currentPage="weather" onNavigate={() => undefined} />);
  const weatherBtn = screen.getByRole('button', { name: /weather/i });
  expect(weatherBtn.getAttribute('aria-current')).toBe('page');
  const homeBtn = screen.getByRole('button', { name: /home/i });
  expect(homeBtn.getAttribute('aria-current')).toBeNull();
});

test('calls onNavigate with "home" when Home is clicked', () => {
  const onNavigate = vi.fn();
  render(<NavBar currentPage="weather" onNavigate={onNavigate} />);
  fireEvent.click(screen.getByRole('button', { name: /home/i }));
  expect(onNavigate).toHaveBeenCalledWith('home');
});

test('calls onNavigate with "weather" when Weather is clicked', () => {
  const onNavigate = vi.fn();
  render(<NavBar currentPage="home" onNavigate={onNavigate} />);
  fireEvent.click(screen.getByRole('button', { name: /weather/i }));
  expect(onNavigate).toHaveBeenCalledWith('weather');
});
