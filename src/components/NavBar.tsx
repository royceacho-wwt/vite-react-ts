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
            href="#/tictactoe"
            className={`navbar-link${currentPath === '/tictactoe' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/tictactoe')}
            aria-current={currentPath === '/tictactoe' ? 'page' : undefined}
          >
            ⭕ Tic Tac Toe
          </a>
        </li>
        <li>
          <a
            href="#/wordgame"
            className={`navbar-link${currentPath === '/wordgame' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/wordgame')}
            aria-current={currentPath === '/wordgame' ? 'page' : undefined}
          >
            🟩 Word Game
          </a>
        </li>
        <li>
          <a
            href="#/2048"
            className={`navbar-link${currentPath === '/2048' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/2048')}
            aria-current={currentPath === '/2048' ? 'page' : undefined}
          >
            🎲 2048
          </a>
        </li>
        <li>
          <a
            href="#/crossword"
            className={`navbar-link${currentPath === '/crossword' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/crossword')}
            aria-current={currentPath === '/crossword' ? 'page' : undefined}
          >
            🏆 Crossword
          </a>
        </li>
        <li>
          <a
            href="#/shooting-stars"
            className={`navbar-link${currentPath === '/shooting-stars' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/shooting-stars')}
            aria-current={currentPath === '/shooting-stars' ? 'page' : undefined}
          >
            ⭐ Shooting Stars
          </a>
        </li>
        <li>
          <a
            href="#/state-capitals"
            className={`navbar-link${currentPath === '/state-capitals' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/state-capitals')}
            aria-current={currentPath === '/state-capitals' ? 'page' : undefined}
          >
            🏛️ State Capitals
          </a>
        </li>
        <li>
          <a
            href="#/contact"
            className={`navbar-link${currentPath === '/contact' ? ' navbar-link--active' : ''}`}
            onClick={(e) => handleClick(e, '/contact')}
            aria-current={currentPath === '/contact' ? 'page' : undefined}
          >
            📬 Contact
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
