import './App.css';

import { useState } from 'react';

import { NavBar } from '@/components/NavBar';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useRouter } from '@/hooks/useRouter';
import { ContactPage } from '@/pages/ContactPage';
import { HomePage } from '@/pages/HomePage';
import { MattPage } from '@/pages/MattPage';
import { TimeZonePage } from '@/pages/TimeZonePage';
import { WeatherPage } from '@/pages/WeatherPage';

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
