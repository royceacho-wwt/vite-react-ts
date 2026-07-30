import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ColoradoCitiesPage } from '@/pages/ColoradoCitiesPage';

/* ── Rendering tests ───────────────────────────────────────────────────────── */

describe('ColoradoCitiesPage – rendering', () => {
  it('renders the page title', () => {
    render(<ColoradoCitiesPage />);
    expect(screen.getByRole('heading', { name: /colorado cities map/i })).toBeDefined();
  });

  it('renders the subtitle', () => {
    render(<ColoradoCitiesPage />);
    expect(screen.getByText(/click a city dot/i)).toBeDefined();
  });

  it('renders 10 city buttons on the map', () => {
    render(<ColoradoCitiesPage />);
    const cityButtons = screen.getAllByRole('button', { name: /— click for fun facts/i });
    expect(cityButtons).toHaveLength(10);
  });

  it('renders the legend with 10 items', () => {
    render(<ColoradoCitiesPage />);
    const legendList = screen.getByRole('list', { name: /city list/i });
    expect(within(legendList).getAllByRole('listitem')).toHaveLength(10);
  });

  it('does not show a popup initially', () => {
    render(<ColoradoCitiesPage />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the legend title', () => {
    render(<ColoradoCitiesPage />);
    expect(screen.getByText(/top 10 cities by population/i)).toBeDefined();
  });
});

/* ── Popup interaction tests ───────────────────────────────────────────────── */

describe('ColoradoCitiesPage – popup interactions', () => {
  it('shows a popup when a city dot is clicked', () => {
    render(<ColoradoCitiesPage />);
    const denverBtn = screen.getByRole('button', { name: /denver — click for fun facts/i });
    fireEvent.click(denverBtn);
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('popup shows the city name', () => {
    render(<ColoradoCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /denver — click for fun facts/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /denver/i })).toBeDefined();
  });

  it('popup shows 3 fun facts', () => {
    render(<ColoradoCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /denver — click for fun facts/i }));
    const factsList = screen.getByRole('list', { name: /fun facts/i });
    expect(within(factsList).getAllByRole('listitem')).toHaveLength(3);
  });

  it('popup shows the population', () => {
    render(<ColoradoCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /denver — click for fun facts/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/population:/i)).toBeDefined();
  });

  it('popup has a close button', () => {
    render(<ColoradoCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /denver — click for fun facts/i }));
    expect(screen.getByRole('button', { name: /close denver popup/i })).toBeDefined();
  });

  it('closes the popup when the close button is clicked', () => {
    render(<ColoradoCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /denver — click for fun facts/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /close denver popup/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('only one popup is shown at a time', () => {
    render(<ColoradoCitiesPage />);

    // Open Denver popup
    fireEvent.click(screen.getByRole('button', { name: /denver — click for fun facts/i }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    // Click Pueblo — Denver popup should close, Pueblo popup should open
    fireEvent.click(screen.getByRole('button', { name: /pueblo — click for fun facts/i }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /pueblo/i })).toBeDefined();
  });

  it('clicking the same city again closes the popup (toggle)', () => {
    render(<ColoradoCitiesPage />);
    const denverBtn = screen.getByRole('button', { name: /denver — click for fun facts/i });

    fireEvent.click(denverBtn);
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(denverBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('legend button opens the popup for that city', () => {
    render(<ColoradoCitiesPage />);
    const legendList = screen.getByRole('list', { name: /city list/i });
    const legendButtons = within(legendList).getAllByRole('button');
    // Click the first legend button (Denver — highest population)
    fireEvent.click(legendButtons[0]);
    expect(screen.getByRole('dialog')).toBeDefined();
  });
});

/* ── Accessibility tests ───────────────────────────────────────────────────── */

describe('ColoradoCitiesPage – accessibility', () => {
  it('city dots have aria-label describing their purpose', () => {
    render(<ColoradoCitiesPage />);
    const cityBtns = screen.getAllByRole('button', { name: /— click for fun facts/i });
    cityBtns.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toMatch(/— click for fun facts/i);
    });
  });

  it('city dots have aria-pressed=false when not active', () => {
    render(<ColoradoCitiesPage />);
    const cityBtns = screen.getAllByRole('button', { name: /— click for fun facts/i });
    cityBtns.forEach((btn) => {
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    });
  });

  it('active city dot has aria-pressed=true', () => {
    render(<ColoradoCitiesPage />);
    const denverBtn = screen.getByRole('button', { name: /denver — click for fun facts/i });
    fireEvent.click(denverBtn);
    expect(denverBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('popup has role=dialog with aria-label', () => {
    render(<ColoradoCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /denver — click for fun facts/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toMatch(/fun facts about denver/i);
  });

  it('map region has aria-label', () => {
    render(<ColoradoCitiesPage />);
    expect(screen.getByRole('region', { name: /interactive map of colorado cities/i })).toBeDefined();
  });
});
