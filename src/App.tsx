import './App.css';

import { useState } from 'react';

import logo from '@/assets/logo.svg';
import { NavBar, Page } from '@/components/NavBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useDarkMode } from '@/hooks/useDarkMode';
import { WeatherPage } from '@/pages/WeatherPage';

function HomePage() {
  const [count, setCount] = useState(0);

  return (
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <p>Hello, Royce!</p>
      <p>
        <button type="button" onClick={() => setCount((count) => count + 1)}>
          Count is: {count}
        </button>
      </p>
      <p>
        Edit <code>App.tsx</code> and save to test HMR updates.
      </p>
      <p>
        <a className="App-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
          Learn React
        </a>
        {' | '}
        <a className="App-link" href="https://vitejs.dev/guide/features.html" target="_blank" rel="noopener noreferrer">
          Vite Docs
        </a>
      </p>
    </header>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isDark, toggleTheme] = useDarkMode();

  return (
    <div className="App">
      <NavBar currentPage={currentPage} onNavigate={setCurrentPage} />
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      {currentPage === 'home' && <HomePage />}
      {currentPage === 'weather' && <WeatherPage />}
    </div>
  );
}

export default App;
