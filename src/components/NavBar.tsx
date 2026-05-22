import './NavBar.css';

import { ThemeToggle } from '@/components/ThemeToggle';

interface NavBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function NavBar({ currentPath, onNavigate, isDark, onToggleTheme }: NavBarProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    e.preventDefault();
    onNavigate(to);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-brand">🌤️ MyApp</div>
      <ul className="navbar-links">
        <li>
          <a
            href="#/"
            className={`navbar-link${currentPath === '/' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/')}
            aria-current={currentPath === '/' ? 'page' : undefined}
          >
            🏠 Home
          </a>
        </li>
        <li>
          <a
            href="#/weather"
            className={`navbar-link${currentPath === '/weather' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/weather')}
            aria-current={currentPath === '/weather' ? 'page' : undefined}
          >
            🌦️ Weather
          </a>
        </li>
        <li>
          <a
            href="#/timezones"
            className={`navbar-link${currentPath === '/timezones' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/timezones')}
            aria-current={currentPath === '/timezones' ? 'page' : undefined}
          >
            🕐 Time Zones
          </a>
        </li>
        <li>
          <a
            href="https://mattvanslyke-wwt.aine-cohort-calm-fox.net/"
            className="navbar-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            👨‍💻 Matt&apos;s Page
          </a>
        </li>
      </ul>
      <div className="navbar-actions">
        <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
      </div>
    </nav>
  );
}
