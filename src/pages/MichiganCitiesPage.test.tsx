import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MichiganCitiesPage } from '@/pages/MichiganCitiesPage';

/* ── Rendering tests ───────────────────────────────────────────────────────── */

describe('MichiganCitiesPage – rendering', () => {
  it('renders the page title', () => {
    render(<MichiganCitiesPage />);
    expect(screen.getByRole('heading', { name: /michigan cities map/i })).toBeDefined();
  });

  it('renders the subtitle', () => {
    render(<MichiganCitiesPage />);
    expect(screen.getByText(/click a city dot/i)).toBeDefined();
  });

  it('renders 5 city buttons on the map', () => {
    render(<MichiganCitiesPage />);
    const cityButtons = screen.getAllByRole('button', { name: /— click for fun facts/i });
    expect(cityButtons).toHaveLength(5);
  });

  it('renders the legend with 5 items', () => {
    render(<MichiganCitiesPage />);
    const legendList = screen.getByRole('list', { name: /city list/i });
    expect(within(legendList).getAllByRole('listitem')).toHaveLength(5);
  });

  it('does not show a popup initially', () => {
    render(<MichiganCitiesPage />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the legend title', () => {
    render(<MichiganCitiesPage />);
    expect(screen.getByText(/top 5 cities by population/i)).toBeDefined();
  });

  it('renders all 5 expected cities', () => {
    render(<MichiganCitiesPage />);
    expect(screen.getByRole('button', { name: /detroit — click for fun facts/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /grand rapids — click for fun facts/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /warren — click for fun facts/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /sterling heights — click for fun facts/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /ann arbor — click for fun facts/i })).toBeDefined();
  });
});

/* ── Popup interaction tests ───────────────────────────────────────────────── */

describe('MichiganCitiesPage – popup interactions', () => {
  it('shows a popup when a city dot is clicked', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('popup shows the city name', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /detroit/i })).toBeDefined();
  });

  it('popup shows exactly 3 fun facts', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    const factsList = screen.getByRole('list', { name: /fun facts/i });
    expect(within(factsList).getAllByRole('listitem')).toHaveLength(3);
  });

  it('popup shows the population', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/population:/i)).toBeDefined();
  });

  it('popup has a close button', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    expect(screen.getByRole('button', { name: /close detroit popup/i })).toBeDefined();
  });

  it('closes the popup when the close button is clicked', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /close detroit popup/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('only one popup is shown at a time', () => {
    render(<MichiganCitiesPage />);

    // Open Detroit popup
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    // Click Grand Rapids — Detroit popup should close, Grand Rapids popup should open
    fireEvent.click(screen.getByRole('button', { name: /grand rapids — click for fun facts/i }));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /grand rapids/i })).toBeDefined();
  });

  it('clicking the same city again closes the popup (toggle)', () => {
    render(<MichiganCitiesPage />);
    const detroitBtn = screen.getByRole('button', { name: /detroit — click for fun facts/i });

    fireEvent.click(detroitBtn);
    expect(screen.getByRole('dialog')).toBeDefined();

    fireEvent.click(detroitBtn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('legend button opens the popup for that city', () => {
    render(<MichiganCitiesPage />);
    const legendList = screen.getByRole('list', { name: /city list/i });
    const legendButtons = within(legendList).getAllByRole('button');
    // Click the first legend button (Detroit — highest population)
    fireEvent.click(legendButtons[0]);
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('popup shows different content for different cities', () => {
    render(<MichiganCitiesPage />);

    fireEvent.click(screen.getByRole('button', { name: /ann arbor — click for fun facts/i }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: /ann arbor/i })).toBeDefined();
  });
});

/* ── Accessibility tests ───────────────────────────────────────────────────── */

describe('MichiganCitiesPage – accessibility', () => {
  it('city dots have aria-label describing their purpose', () => {
    render(<MichiganCitiesPage />);
    const cityBtns = screen.getAllByRole('button', { name: /— click for fun facts/i });
    cityBtns.forEach((btn) => {
      expect(btn.getAttribute('aria-label')).toMatch(/— click for fun facts/i);
    });
  });

  it('city dots have aria-pressed=false when not active', () => {
    render(<MichiganCitiesPage />);
    const cityBtns = screen.getAllByRole('button', { name: /— click for fun facts/i });
    cityBtns.forEach((btn) => {
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    });
  });

  it('active city dot has aria-pressed=true', () => {
    render(<MichiganCitiesPage />);
    const detroitBtn = screen.getByRole('button', { name: /detroit — click for fun facts/i });
    fireEvent.click(detroitBtn);
    expect(detroitBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('popup has role=dialog with aria-label', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toMatch(/fun facts about detroit/i);
  });

  it('map region has aria-label', () => {
    render(<MichiganCitiesPage />);
    expect(screen.getByRole('region', { name: /interactive map of michigan cities/i })).toBeDefined();
  });

  it('close button has descriptive aria-label', () => {
    render(<MichiganCitiesPage />);
    fireEvent.click(screen.getByRole('button', { name: /detroit — click for fun facts/i }));
    const closeBtn = screen.getByRole('button', { name: /close detroit popup/i });
    expect(closeBtn.getAttribute('aria-label')).toMatch(/close detroit popup/i);
  });
});
