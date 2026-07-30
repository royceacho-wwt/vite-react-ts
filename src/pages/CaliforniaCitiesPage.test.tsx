import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CaliforniaCitiesPage } from './CaliforniaCitiesPage';

describe('CaliforniaCitiesPage', () => {
  it('renders the page title and subtitle', () => {
    render(<CaliforniaCitiesPage />);

    expect(screen.getByText('🌴 California Cities Map')).toBeInTheDocument();
    expect(screen.getByText('Click a city dot to discover fun facts about it.')).toBeInTheDocument();
  });

  it('renders all 5 California cities on the map', () => {
    render(<CaliforniaCitiesPage />);

    expect(screen.getByTestId('city-los-angeles')).toBeInTheDocument();
    expect(screen.getByTestId('city-san-diego')).toBeInTheDocument();
    expect(screen.getByTestId('city-san-jose')).toBeInTheDocument();
    expect(screen.getByTestId('city-san-francisco')).toBeInTheDocument();
    expect(screen.getByTestId('city-fresno')).toBeInTheDocument();
  });

  it('renders the legend with all cities', () => {
    render(<CaliforniaCitiesPage />);

    expect(screen.getByTestId('legend-los-angeles')).toBeInTheDocument();
    expect(screen.getByTestId('legend-san-diego')).toBeInTheDocument();
    expect(screen.getByTestId('legend-san-jose')).toBeInTheDocument();
    expect(screen.getByTestId('legend-san-francisco')).toBeInTheDocument();
    expect(screen.getByTestId('legend-fresno')).toBeInTheDocument();
  });

  it('shows popup when clicking a city dot', () => {
    render(<CaliforniaCitiesPage />);

    // Initially no popup
    expect(screen.queryByTestId('city-popup')).not.toBeInTheDocument();

    // Click Los Angeles
    fireEvent.click(screen.getByTestId('city-los-angeles'));

    // Popup should appear
    const popup = screen.getByTestId('city-popup');
    expect(popup).toBeInTheDocument();

    // Check popup title
    const popupTitle = within(popup).getByRole('heading', { level: 2 });
    expect(popupTitle).toHaveTextContent('Los Angeles');

    // Check population
    expect(within(popup).getByText('Population: 3,898,747')).toBeInTheDocument();
  });

  it('shows popup when clicking a legend item', () => {
    render(<CaliforniaCitiesPage />);

    // Click San Francisco in legend
    fireEvent.click(screen.getByTestId('legend-san-francisco'));

    // Popup should appear with San Francisco info
    expect(screen.getByTestId('city-popup')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Fun facts about San Francisco');
  });

  it('closes popup when clicking close button', () => {
    render(<CaliforniaCitiesPage />);

    // Open popup
    fireEvent.click(screen.getByTestId('city-san-diego'));
    expect(screen.getByTestId('city-popup')).toBeInTheDocument();

    // Close popup
    fireEvent.click(screen.getByTestId('close-popup'));
    expect(screen.queryByTestId('city-popup')).not.toBeInTheDocument();
  });

  it('only shows one popup at a time', () => {
    render(<CaliforniaCitiesPage />);

    // Open Los Angeles popup
    fireEvent.click(screen.getByTestId('city-los-angeles'));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Fun facts about Los Angeles');

    // Click San Jose - should switch to San Jose popup
    fireEvent.click(screen.getByTestId('city-san-jose'));
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Fun facts about San Jose');

    // Should only be one popup
    expect(screen.getAllByTestId('city-popup')).toHaveLength(1);
  });

  it('closes popup when clicking the same city again', () => {
    render(<CaliforniaCitiesPage />);

    // Open Fresno popup
    fireEvent.click(screen.getByTestId('city-fresno'));
    expect(screen.getByTestId('city-popup')).toBeInTheDocument();

    // Click Fresno again - should close
    fireEvent.click(screen.getByTestId('city-fresno'));
    expect(screen.queryByTestId('city-popup')).not.toBeInTheDocument();
  });

  it('displays 3 fun facts in the popup', () => {
    render(<CaliforniaCitiesPage />);

    // Open San Diego popup
    fireEvent.click(screen.getByTestId('city-san-diego'));

    // Get the popup and check facts within it
    const popup = screen.getByTestId('city-popup');
    const factsList = within(popup).getByRole('list');
    const facts = within(factsList).getAllByRole('listitem');
    expect(facts).toHaveLength(3);

    // Check fact numbers are displayed
    expect(within(popup).getByText('1')).toBeInTheDocument();
    expect(within(popup).getByText('2')).toBeInTheDocument();
    expect(within(popup).getByText('3')).toBeInTheDocument();
  });

  it('has accessible city buttons with proper aria labels', () => {
    render(<CaliforniaCitiesPage />);

    const laButton = screen.getByTestId('city-los-angeles');
    expect(laButton).toHaveAttribute('role', 'button');
    expect(laButton).toHaveAttribute('aria-label', 'Los Angeles — click for fun facts');
    expect(laButton).toHaveAttribute('tabindex', '0');
  });

  it('supports keyboard navigation on city dots', () => {
    render(<CaliforniaCitiesPage />);

    const sfButton = screen.getByTestId('city-san-francisco');

    // Press Enter to open popup
    fireEvent.keyDown(sfButton, { key: 'Enter' });
    expect(screen.getByTestId('city-popup')).toBeInTheDocument();

    // Press Space to close popup
    fireEvent.keyDown(sfButton, { key: ' ' });
    expect(screen.queryByTestId('city-popup')).not.toBeInTheDocument();
  });

  it('renders the legend title', () => {
    render(<CaliforniaCitiesPage />);

    expect(screen.getByText('Top 5 California Cities by Population')).toBeInTheDocument();
  });
});
