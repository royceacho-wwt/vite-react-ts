import './AboutPage.css';

export function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-card">
        <h1 className="about-title">ℹ️ About</h1>
        <p className="about-description">
          Welcome to MyApp! This is a feature-rich React application built with Vite and TypeScript.
        </p>
        <section className="about-features">
          <h2 className="about-subtitle">Features</h2>
          <ul className="about-list">
            <li>
              🌦️ <strong>Weather</strong> – Check current weather conditions
            </li>
            <li>
              🕐 <strong>Time Zones</strong> – View times across different zones
            </li>
            <li>
              ⭕ <strong>Tic Tac Toe</strong> – Play the classic game
            </li>
            <li>
              🟩 <strong>Word Game</strong> – Test your vocabulary skills
            </li>
            <li>
              🎲 <strong>2048</strong> – Slide and merge tiles to reach 2048
            </li>
            <li>
              🏆 <strong>Crossword</strong> – Solve crossword puzzles
            </li>
          </ul>
        </section>
        <section className="about-tech">
          <h2 className="about-subtitle">Built With</h2>
          <p className="about-tech-list">React • TypeScript • Vite</p>
        </section>
      </div>
    </main>
  );
}
