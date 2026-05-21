import './NavBar.css';

export type Page = 'home' | 'weather';

interface NavBarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function NavBar({ currentPage, onNavigate }: NavBarProps) {
  return (
    <nav className="navbar" aria-label="Main navigation">
      <span className="navbar-brand">🌤️ MyApp</span>
      <button
        type="button"
        className={`navbar-link${currentPage === 'home' ? ' active' : ''}`}
        aria-current={currentPage === 'home' ? 'page' : undefined}
        onClick={() => onNavigate('home')}
      >
        🏠 Home
      </button>
      <button
        type="button"
        className={`navbar-link${currentPage === 'weather' ? ' active' : ''}`}
        aria-current={currentPage === 'weather' ? 'page' : undefined}
        onClick={() => onNavigate('weather')}
      >
        🌦️ Weather
      </button>
    </nav>
  );
}
