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

  // Toggle should be present (label depends on initial theme; both labels are valid)
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

test('renders the current date widget', () => {
  render(<App />);

  const widget = screen.getByLabelText('current date');
  expect(widget).toBeDefined();
  expect(widget.textContent).toContain(new Date().getFullYear().toString());
});
