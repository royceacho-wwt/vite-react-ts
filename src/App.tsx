import './App.css';

import { useState } from 'react';

import { NavBar } from '@/components/NavBar';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useRouter } from '@/hooks/useRouter';
import { ColoradoCitiesPage } from '@/pages/ColoradoCitiesPage';
import { ContactPage } from '@/pages/ContactPage';
import { CrosswordPage } from '@/pages/CrosswordPage';
import { Game2048Page } from '@/pages/Game2048Page';
import { HomePage } from '@/pages/HomePage';
import { MattPage } from '@/pages/MattPage';
import { ShootingStarsPage } from '@/pages/ShootingStarsPage';
import { SpreadsheetPage } from '@/pages/SpreadsheetPage';
import { StateCapitalsPage } from '@/pages/StateCapitalsPage';
import { TicTacToePage } from '@/pages/TicTacToePage';
import { TimeZonePage } from '@/pages/TimeZonePage';
import { WeatherPage } from '@/pages/WeatherPage';
import { WordGamePage } from '@/pages/WordGamePage';

function App() {
  const [count, setCount] = useState(0);
  const [isDark, toggleTheme] = useDarkMode();
  const [path, navigate] = useRouter();

  const renderPage = () => {
    switch (path) {
      case '/weather':
        return <WeatherPage />;
      case '/timezones':
        return <TimeZonePage />;
      case '/tictactoe':
        return <TicTacToePage />;
      case '/wordgame':
        return <WordGamePage />;
      case '/2048':
        return <Game2048Page />;
      case '/crossword':
        return <CrosswordPage />;
      case '/shooting-stars':
        return <ShootingStarsPage />;
      case '/state-capitals':
        return <StateCapitalsPage />;
      case '/spreadsheet':
        return <SpreadsheetPage />;
      case '/colorado-cities':
        return <ColoradoCitiesPage />;
      case '/matt':
        return <MattPage />;
      case '/contact':
        return <ContactPage />;
      case '/':
      default:
        return <HomePage count={count} onIncrement={() => setCount((c) => c + 1)} />;
    }
  };

  return (
    <div className="App">
      <NavBar currentPath={path} onNavigate={navigate} isDark={isDark} onToggleTheme={toggleTheme} />
      {renderPage()}
    </div>
  );
}

export default App;
