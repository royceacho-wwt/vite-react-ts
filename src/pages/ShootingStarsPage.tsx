import './ShootingStarsPage.css';

import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Position {
  x: number;
  y: number;
}

interface Star {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface DifficultySettings {
  starCount: number;
  maxSpeed: number;
  playerSpeed: number;
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_SIZE = 12;
const STAR_SIZE = 10;
const KEY_RELEASE_DELAY = 150; // ms - delay before key release takes effect (creates momentum)

// Default difficulty settings
const DEFAULT_STAR_COUNT = 5;
const DEFAULT_MAX_SPEED = 4;
const DEFAULT_PLAYER_SPEED = 3;
const MIN_STAR_COUNT = 1;
const MAX_STAR_COUNT = 100;
const MIN_SPEED = 1;
const MAX_SPEED = 10;
const MIN_PLAYER_SPEED = 1;
const MAX_PLAYER_SPEED = 10;

// Speed scaling factor - makes speed value of 1 slower
// At speed 1, actual speed is 0.5 pixels per frame
// At speed 10, actual speed is 5 pixels per frame
const STAR_SPEED_SCALE = 0.5;
const PLAYER_SPEED_SCALE = 1.0;

/* ── Helper functions ──────────────────────────────────────────────────────── */

function checkCollision(player: Position, star: Star): boolean {
  const dx = player.x - star.x;
  const dy = player.y - star.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const collisionDistance = (PLAYER_SIZE + STAR_SIZE) / 2;
  return distance < collisionDistance;
}

function createStar(id: number, maxSpeed: number): Star {
  // Stars spawn from edges and move toward the center area
  const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
  let x: number, y: number, vx: number, vy: number;

  // Random speed between 1 and maxSpeed, scaled for slower base speed
  const baseSpeed = 1 + Math.random() * (maxSpeed - 1);
  const speed = baseSpeed * STAR_SPEED_SCALE;

  switch (edge) {
    case 0: // top
      x = Math.random() * GAME_WIDTH;
      y = -STAR_SIZE;
      vx = (Math.random() - 0.5) * speed;
      vy = speed * (0.5 + Math.random() * 0.5);
      break;
    case 1: // right
      x = GAME_WIDTH + STAR_SIZE;
      y = Math.random() * GAME_HEIGHT;
      vx = -speed * (0.5 + Math.random() * 0.5);
      vy = (Math.random() - 0.5) * speed;
      break;
    case 2: // bottom
      x = Math.random() * GAME_WIDTH;
      y = GAME_HEIGHT + STAR_SIZE;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed * (0.5 + Math.random() * 0.5);
      break;
    default: // left
      x = -STAR_SIZE;
      y = Math.random() * GAME_HEIGHT;
      vx = speed * (0.5 + Math.random() * 0.5);
      vy = (Math.random() - 0.5) * speed;
      break;
  }

  return { id, x, y, vx, vy };
}

function isStarOutOfBounds(star: Star): boolean {
  const margin = STAR_SIZE * 2;
  return star.x < -margin || star.x > GAME_WIDTH + margin || star.y < -margin || star.y > GAME_HEIGHT + margin;
}

/* ── Game component ────────────────────────────────────────────────────────── */

export function ShootingStarsPage() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('shootingStarsHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [playerPos, setPlayerPos] = useState<Position>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const [stars, setStars] = useState<Star[]>([]);
  const [settings, setSettings] = useState<DifficultySettings>({
    starCount: DEFAULT_STAR_COUNT,
    maxSpeed: DEFAULT_MAX_SPEED,
    playerSpeed: DEFAULT_PLAYER_SPEED,
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const keyReleaseTimers = useRef<Map<string, number>>(new Map()); // Tracks pending key release timers
  const gameLoopRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const starIdRef = useRef(0);
  const isPlayingRef = useRef(false);
  const settingsRef = useRef(settings);

  // Keep settingsRef in sync with settings state
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  /* ── Keyboard handlers ───────────────────────────────────────────────────── */
  useEffect(() => {
    // Capture ref values at effect setup time for cleanup
    const timersRef = keyReleaseTimers.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        const key = e.key.toLowerCase();

        // If there's a pending release timer for this key, cancel it
        const existingTimer = keyReleaseTimers.current.get(key);
        if (existingTimer !== undefined) {
          clearTimeout(existingTimer);
          keyReleaseTimers.current.delete(key);
        }

        keysPressed.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Instead of immediately removing the key, set a delayed removal
      // This creates the "momentum" effect where movement continues briefly
      if (keysPressed.current.has(key)) {
        // Clear any existing timer for this key
        const existingTimer = keyReleaseTimers.current.get(key);
        if (existingTimer !== undefined) {
          clearTimeout(existingTimer);
        }

        // Set a new delayed removal
        const timerId = window.setTimeout(() => {
          keysPressed.current.delete(key);
          keyReleaseTimers.current.delete(key);
        }, KEY_RELEASE_DELAY);

        keyReleaseTimers.current.set(key, timerId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Clean up any pending timers using captured ref
      timersRef.forEach((timerId) => clearTimeout(timerId));
      timersRef.clear();
    };
  }, []);

  /* ── Game loop ───────────────────────────────────────────────────────────── */
  const gameLoop = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current === 0) {
      lastFrameTimeRef.current = timestamp;
    }
    lastFrameTimeRef.current = timestamp;

    // Update score (seconds survived)
    const elapsedSeconds = Math.floor((timestamp - startTimeRef.current) / 1000);
    setScore(elapsedSeconds);

    // Update player position based on keys pressed
    setPlayerPos((prev) => {
      let { x, y } = prev;
      const keys = keysPressed.current;
      const actualPlayerSpeed = settingsRef.current.playerSpeed * PLAYER_SPEED_SCALE;

      if (keys.has('arrowup') || keys.has('w')) y -= actualPlayerSpeed;
      if (keys.has('arrowdown') || keys.has('s')) y += actualPlayerSpeed;
      if (keys.has('arrowleft') || keys.has('a')) x -= actualPlayerSpeed;
      if (keys.has('arrowright') || keys.has('d')) x += actualPlayerSpeed;

      // Clamp to bounds
      x = Math.max(PLAYER_SIZE / 2, Math.min(GAME_WIDTH - PLAYER_SIZE / 2, x));
      y = Math.max(PLAYER_SIZE / 2, Math.min(GAME_HEIGHT - PLAYER_SIZE / 2, y));

      return { x, y };
    });

    // Update stars and maintain constant count
    setStars((prevStars) => {
      // Move existing stars and filter out-of-bounds ones
      const updatedStars = prevStars
        .map((star) => ({
          ...star,
          x: star.x + star.vx,
          y: star.y + star.vy,
        }))
        .filter((star) => !isStarOutOfBounds(star));

      // Spawn new stars to maintain the target count
      const { starCount, maxSpeed } = settingsRef.current;
      const starsToSpawn = starCount - updatedStars.length;

      for (let i = 0; i < starsToSpawn; i++) {
        updatedStars.push(createStar(starIdRef.current++, maxSpeed));
      }

      return updatedStars;
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, []);

  /* ── Collision detection (separate effect to access latest state) ────────── */
  useEffect(() => {
    if (gameState !== 'playing') return;

    for (const star of stars) {
      if (checkCollision(playerPos, star)) {
        // Game over
        setGameState('gameover');
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('shootingStarsHighScore', score.toString());
        }
        return;
      }
    }
  }, [playerPos, stars, gameState, score, highScore]);

  /* ── Start/stop game ─────────────────────────────────────────────────────── */
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setStars([]);
    setPlayerPos({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
    starIdRef.current = 0;
    startTimeRef.current = performance.now();
    lastFrameTimeRef.current = 0;
    isPlayingRef.current = true;

    // Clear any lingering key states and timers from previous game
    keysPressed.current.clear();
    keyReleaseTimers.current.forEach((timerId) => clearTimeout(timerId));
    keyReleaseTimers.current.clear();

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const stopGame = useCallback(() => {
    isPlayingRef.current = false;
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (gameState === 'gameover') {
      stopGame();
    }
  }, [gameState, stopGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGame();
    };
  }, [stopGame]);

  /* ── Settings handlers ───────────────────────────────────────────────────── */
  const handleStarCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setSettings((prev) => ({
        ...prev,
        starCount: Math.max(MIN_STAR_COUNT, Math.min(MAX_STAR_COUNT, value)),
      }));
    }
  };

  const handleMaxSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setSettings((prev) => ({
        ...prev,
        maxSpeed: Math.max(MIN_SPEED, Math.min(MAX_SPEED, value)),
      }));
    }
  };

  const handlePlayerSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setSettings((prev) => ({
        ...prev,
        playerSpeed: Math.max(MIN_PLAYER_SPEED, Math.min(MAX_PLAYER_SPEED, value)),
      }));
    }
  };

  return (
    <main className="shooting-stars-page">
      <h1 className="shooting-stars-title">⭐ Shooting Stars</h1>
      <p className="shooting-stars-subtitle">Dodge the stars! Use arrow keys or WASD to move.</p>

      <div className="shooting-stars-scores">
        <div className="shooting-stars-score">
          <span className="shooting-stars-score-label">Score</span>
          <span className="shooting-stars-score-value">{score}s</span>
        </div>
        <div className="shooting-stars-score">
          <span className="shooting-stars-score-label">High Score</span>
          <span className="shooting-stars-score-value">{highScore}s</span>
        </div>
      </div>

      <div
        className="shooting-stars-arena"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        role="application"
        aria-label="Game arena"
      >
        {gameState === 'idle' && (
          <div className="shooting-stars-overlay">
            <p>Configure difficulty and press Start!</p>

            <div className="shooting-stars-settings">
              <div className="shooting-stars-setting">
                <label htmlFor="star-count">Stars on screen:</label>
                <input
                  id="star-count"
                  type="range"
                  min={MIN_STAR_COUNT}
                  max={MAX_STAR_COUNT}
                  value={settings.starCount}
                  onChange={handleStarCountChange}
                />
                <span className="shooting-stars-setting-value">{settings.starCount}</span>
              </div>

              <div className="shooting-stars-setting">
                <label htmlFor="max-speed">Max star speed:</label>
                <input
                  id="max-speed"
                  type="range"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  value={settings.maxSpeed}
                  onChange={handleMaxSpeedChange}
                />
                <span className="shooting-stars-setting-value">{settings.maxSpeed}</span>
              </div>

              <div className="shooting-stars-setting">
                <label htmlFor="player-speed">Player speed:</label>
                <input
                  id="player-speed"
                  type="range"
                  min={MIN_PLAYER_SPEED}
                  max={MAX_PLAYER_SPEED}
                  value={settings.playerSpeed}
                  onChange={handlePlayerSpeedChange}
                />
                <span className="shooting-stars-setting-value">{settings.playerSpeed}</span>
              </div>
            </div>

            <button className="shooting-stars-btn" onClick={startGame}>
              🚀 Start Game
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="shooting-stars-overlay">
            <p className="shooting-stars-gameover-text">Game Over!</p>
            <p>You survived for {score} seconds</p>
            {score === highScore && score > 0 && <p className="shooting-stars-new-record">🏆 New High Score!</p>}
            <button className="shooting-stars-btn" onClick={() => setGameState('idle')}>
              🔄 Play Again
            </button>
          </div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Player */}
            <div
              className="shooting-stars-player"
              style={{
                left: playerPos.x - PLAYER_SIZE / 2,
                top: playerPos.y - PLAYER_SIZE / 2,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
              }}
              aria-label="Player"
            />

            {/* Stars */}
            {stars.map((star) => (
              <div
                key={star.id}
                className="shooting-stars-star"
                style={{
                  left: star.x - STAR_SIZE / 2,
                  top: star.y - STAR_SIZE / 2,
                  width: STAR_SIZE,
                  height: STAR_SIZE,
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className="shooting-stars-instructions">
        <p>Use ↑ ↓ ← → or W A S D to move</p>
        <p>Avoid the red stars as long as you can!</p>
      </div>
    </main>
  );
}
