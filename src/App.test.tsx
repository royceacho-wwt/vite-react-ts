import { fireEvent, render, screen } from '@testing-library/react';

import App from '@/App';

test('count is 0 at first', () => {
  render(<App />);
  expect(screen.getByText('Count is: 0')).toBeDefined();
});

test('increments count', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /count is/i }));
  expect(screen.getByText('Count is: 1')).toBeDefined();
});

test('renders theme toggle button', () => {
  render(<App />);
  const toggle = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
  expect(toggle).toBeDefined();
});

test('clicking theme toggle changes its label', () => {
  render(<App />);
  const toggle = screen.getByRole('button', { name: /switch to (dark|light) mode/i });
  const initialLabel = toggle.getAttribute('aria-label');
  fireEvent.click(toggle);
  const newLabel = screen.getByRole('button', { name: /switch to (dark|light) mode/i }).getAttribute('aria-label');
  expect(newLabel).not.toBe(initialLabel);
});

test('renders navbar with Home and Weather links', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /home/i })).toBeDefined();
  expect(screen.getByRole('button', { name: /weather/i })).toBeDefined();
});

test('navigates to Weather page when Weather nav link is clicked', () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /🌦️ weather/i }));
  expect(screen.getByText(/Weather Forecast/i)).toBeDefined();
});

test('navigates back to Home page when Home nav link is clicked', () => {
  render(<App />);
  // Go to weather first
  fireEvent.click(screen.getByRole('button', { name: /🌦️ weather/i }));
  // Go back home
  fireEvent.click(screen.getByRole('button', { name: /🏠 home/i }));
  expect(screen.getByText('Count is: 0')).toBeDefined();
});
