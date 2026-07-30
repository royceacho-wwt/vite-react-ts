import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CaliforniaCitiesPage } from '@/pages/CaliforniaCitiesPage';

/* ── Rendering tests ───────────────────────────────────────────────────────── */

describe('CaliforniaCitiesPage – rendering', () => {
  it('renders the page title', () => {
    render(<CaliforniaCitiesPage />);
    expect(screen.getByRole('heading', { name: /california cities map/i })).toBeDefined();
  });

  it('renders the subtitle', () => {
    render(<CaliforniaCitiesPage />);
    expect(screen.getByText(/click a city dot/i)).toBeDefined();
  });

  it('renders 5 city buttons on the map', () => {
    render(<CaliforniaCitiesPage />);
    const cityButtons = screen.getAllByRole('button', { name: /— click for fun facts/i });
    expect(cityButtons).toHaveLength(5);
  });

  it('renders all 5 California cities on the map', () => {
    render(<CaliforniaCitiesPage />);

    expect(screen.getByTestId('city-los-angeles')).toBeDefined();
    expect(screen.getByTestId('city-san-diego')).toBeDefined();
    expect(screen.getByTestId('city-san-jose')).toBeDefined();
    expect(screen.getByTestId('city-san-francisco')).toBeDefined();
    expect(screen.getByTestId('city-fresno')).toBeDefined();
  });

  it('renders the legend with all cities', () => {
    render(<CaliforniaCitiesPage />);

    expect(screen.getByTestId('legend-los-angeles')).toBeDefined();
    expect(screen.getByTestId('legend-san-diego')).toBeDefined();
    expect(screen.getByTestId('legend-san-jose')).toBeDefined();
    expect(screen.getByTestId('legend-san-francisco')).toBeDefined();
    expect(screen.getByTestId('legend-fresno')).toBeDefined();
  });

  it('does not show a popup initially', () => {
    render(<CaliforniaCitiesPage />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders the legend title', () => {
    render(<CaliforniaCitiesPage />);
    expect(screen.getByText(/top 5 california cities by population/i)).toBeDefined();
  });
});

/* ── Popup interaction tests ───────────────────────────────────────────────── */

describe('CaliforniaCitiesPage – popup interactions', () => {
  it('shows popup when clicking a city dot', () => {
    render(<CaliforniaCitiesPage />);

    // Click Los Angeles
    fireEvent.click(screen.getByTestId('city-los-angeles'));

    // Popup should appear
    const popup = screen.getByRole('dialog');
    expect(popup).toBeDefined();

    // Check popup title
    const popupTitle = within(popup).getByRole('heading', { level: 2 });
    expect(popupTitle.textContent).toBe('Los Angeles');

    // Check population
    expect(within(popup).getByText(/population: 3,898,747/i)).toBeDefined();
  });

  it('shows popup when clicking a legend item', () => {
    render(<CaliforniaCitiesPage />);

    // Click San Francisco in legend
    fireEvent.click(screen.getByTestId('legend-san-francisco'));

    // Popup should appear with San Francisco info
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-label')).toBe('Fun facts about San Francisco');
  });

  it('closes popup when clicking close button', () => {
    render(<CaliforniaCitiesPage />);

    // Open popup
    fireEvent.click(screen.getByTestId('city-san-diego'));
    expect(screen.getByRole('dialog')).toBeDefined();

    // Close popup
    fireEvent.click(screen.getByTestId('close-popup'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('only shows one popup at a time', () => {
    render(<CaliforniaCitiesPage />);

    // Open Los Angeles popup
    fireEvent.click(screen.getByTestId('city-los-angeles'));
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('Fun facts about Los Angeles');

    // Click San Jose - should switch to San Jose popup
    fireEvent.click(screen.getByTestId('city-san-jose'));
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('Fun facts about San Jose');

    // Should only be one popup
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('closes popup when clicking the same city again', () => {
    render(<CaliforniaCitiesPage />);

    // Open Fresno popup
    fireEvent.click(screen.getByTestId('city-fresno'));
    expect(screen.getByRole('dialog')).toBeDefined();

    // Click Fresno again - should close
    fireEvent.click(screen.getByTestId('city-fresno'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('displays 3 fun facts in the popup', () => {
    render(<CaliforniaCitiesPage />);

    // Open San Diego popup
    fireEvent.click(screen.getByTestId('city-san-diego'));

    // Get the popup and check facts within it
    const popup = screen.getByRole('dialog');
    const factsList = within(popup).getByRole('list');
    const facts = within(factsList).getAllByRole('listitem');
    expect(facts).toHaveLength(3);

    // Check fact numbers are displayed
    expect(within(popup).getByText('1')).toBeDefined();
    expect(within(popup).getByText('2')).toBeDefined();
    expect(within(popup).getByText('3')).toBeDefined();
  });
});

/* ── Accessibility tests ───────────────────────────────────────────────────── */

describe('CaliforniaCitiesPage – accessibility', () => {
  it('has accessible city buttons with proper aria labels', () => {
    render(<CaliforniaCitiesPage />);

    const laButton = screen.getByTestId('city-los-angeles');
    expect(laButton.getAttribute('role')).toBe('button');
    expect(laButton.getAttribute('aria-label')).toBe('Los Angeles — click for fun facts');
    expect(laButton.getAttribute('tabindex')).toBe('0');
  });

  it('supports keyboard navigation on city dots', () => {
    render(<CaliforniaCitiesPage />);

    const sfButton = screen.getByTestId('city-san-francisco');

    // Press Enter to open popup
    fireEvent.keyDown(sfButton, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeDefined();

    // Press Space to close popup
    fireEvent.keyDown(sfButton, { key: ' ' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('city dots have aria-pressed=false when not active', () => {
    render(<CaliforniaCitiesPage />);
    const cityBtns = screen.getAllByRole('button', { name: /— click for fun facts/i });
    cityBtns.forEach((btn) => {
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    });
  });

  it('active city dot has aria-pressed=true', () => {
    render(<CaliforniaCitiesPage />);
    const laBtn = screen.getByTestId('city-los-angeles');
    fireEvent.click(laBtn);
    expect(laBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('popup has role=dialog with aria-label', () => {
    render(<CaliforniaCitiesPage />);
    fireEvent.click(screen.getByTestId('city-los-angeles'));
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-label')).toMatch(/fun facts about los angeles/i);
  });

  it('map region has aria-label', () => {
    render(<CaliforniaCitiesPage />);
    expect(screen.getByRole('region', { name: /interactive map of california cities/i })).toBeDefined();
  });
});
