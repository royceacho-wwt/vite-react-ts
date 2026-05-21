import './HomePage.css';

import logo from '@/assets/logo.svg';

interface HomePageProps {
  count: number;
  onIncrement: () => void;
}

export function HomePage({ count, onIncrement }: HomePageProps) {
  return (
    <main className="home-page">
      <header className="home-header">
        <img src={logo} className="home-logo" alt="App logo" />
        <p>Hello, Royce!</p>
        <p>
          <button type="button" onClick={onIncrement}>
            Count is: {count}
          </button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a className="home-link" href="https://reactjs.org" target="_blank" rel="noopener noreferrer">
            Learn React
          </a>
          {' | '}
          <a
            className="home-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </main>
  );
}
