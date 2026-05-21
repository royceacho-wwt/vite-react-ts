import { render, screen } from '@testing-library/react';

import { CurrentDate } from '@/components/CurrentDate';

test('renders the current date widget', () => {
  render(<CurrentDate />);
  const widget = screen.getByLabelText('current date');
  expect(widget).toBeDefined();
});

test('displays a non-empty date string', () => {
  render(<CurrentDate />);
  const widget = screen.getByLabelText('current date');
  expect(widget.textContent?.trim().length).toBeGreaterThan(0);
});

test('displays a date that includes the current year', () => {
  render(<CurrentDate />);
  const widget = screen.getByLabelText('current date');
  const currentYear = new Date().getFullYear().toString();
  expect(widget.textContent).toContain(currentYear);
});
