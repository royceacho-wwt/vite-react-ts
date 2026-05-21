import { fireEvent, render, screen } from '@testing-library/react';

import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
  test('shows "Dark mode" label when currently in light mode', () => {
    render(<ThemeToggle isDark={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeDefined();
    expect(screen.getByText(/dark mode/i)).toBeDefined();
  });

  test('shows "Light mode" label when currently in dark mode', () => {
    render(<ThemeToggle isDark={true} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeDefined();
    expect(screen.getByText(/light mode/i)).toBeDefined();
  });

  test('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<ThemeToggle isDark={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
