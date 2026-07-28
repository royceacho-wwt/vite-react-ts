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

/* ── Constants ─────────────────────────────────────────────────────────────── */

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PLAYER_SIZE = 12;
const STAR_SIZE = 10;
const PLAYER_SPEED = 5;
const BASE_STAR_SPEED = 2;
const INITIAL_SPAWN_INTERVAL = 1500; // ms
const MIN_SPAWN_INTERVAL = 300; // ms
const DIFFICULTY_INCREASE_RATE = 0.95; // multiplier per second

/* ── Helper functions ──────────────────────────────────────────────────────── */

function checkCollision(player: Position, star: Star): boolean {
  const dx = player.x - star.x;
  const dy = player.y - star.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const collisionDistance = (PLAYER_SIZE + STAR_SIZE) / 2;
  return distance < collisionDistance;
}

function createStar(id: number, elapsedSeconds: number): Star {
  // Stars spawn from edges and move toward the center area
  const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
  let x: number, y: number, vx: number, vy: number;

  // Speed increases with time
  const speedMultiplier = 1 + elapsedSeconds * 0.05;
  const speed = BASE_STAR_SPEED * speedMultiplier;

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

  const keysPressed = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number | null>(null);
  const spawnTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const starIdRef = useRef(0);
  const spawnIntervalRef = useRef(INITIAL_SPAWN_INTERVAL);
  const isPlayingRef = useRef(false);

  /* ── Keyboard handlers ───────────────────────────────────────────────────── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key)) {
        e.preventDefault();
        keysPressed.current.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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

      if (keys.has('arrowup') || keys.has('w')) y -= PLAYER_SPEED;
      if (keys.has('arrowdown') || keys.has('s')) y += PLAYER_SPEED;
      if (keys.has('arrowleft') || keys.has('a')) x -= PLAYER_SPEED;
      if (keys.has('arrowright') || keys.has('d')) x += PLAYER_SPEED;

      // Clamp to bounds
      x = Math.max(PLAYER_SIZE / 2, Math.min(GAME_WIDTH - PLAYER_SIZE / 2, x));
      y = Math.max(PLAYER_SIZE / 2, Math.min(GAME_HEIGHT - PLAYER_SIZE / 2, y));

      return { x, y };
    });

    // Update stars
    setStars((prevStars) => {
      return prevStars
        .map((star) => ({
          ...star,
          x: star.x + star.vx,
          y: star.y + star.vy,
        }))
        .filter((star) => !isStarOutOfBounds(star));
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

  /* ── Star spawning ───────────────────────────────────────────────────────── */
  const spawnStar = useCallback(() => {
    // Use ref to check if game is still playing (avoids stale closure issues)
    if (!isPlayingRef.current) return;

    const elapsedSeconds = (performance.now() - startTimeRef.current) / 1000;
    const newStar = createStar(starIdRef.current++, elapsedSeconds);
    setStars((prev) => [...prev, newStar]);

    // Decrease spawn interval over time (difficulty increase)
    spawnIntervalRef.current = Math.max(MIN_SPAWN_INTERVAL, spawnIntervalRef.current * DIFFICULTY_INCREASE_RATE);

    spawnTimerRef.current = window.setTimeout(spawnStar, spawnIntervalRef.current);
  }, []);

  /* ── Start/stop game ─────────────────────────────────────────────────────── */
  const startGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setStars([]);
    setPlayerPos({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
    starIdRef.current = 0;
    spawnIntervalRef.current = INITIAL_SPAWN_INTERVAL;
    startTimeRef.current = performance.now();
    lastFrameTimeRef.current = 0;
    isPlayingRef.current = true;

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    spawnTimerRef.current = window.setTimeout(spawnStar, spawnIntervalRef.current);
  }, [gameLoop, spawnStar]);

  const stopGame = useCallback(() => {
    isPlayingRef.current = false;
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    if (spawnTimerRef.current) {
      clearTimeout(spawnTimerRef.current);
      spawnTimerRef.current = null;
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
            <p>Press Start to begin!</p>
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
            <button className="shooting-stars-btn" onClick={startGame}>
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
                aria-hidden="true"
              />
            ))}
          </>
        )}
      </div>

      <div className="shooting-stars-instructions">
        <p>🎮 Controls: Arrow keys or WASD</p>
        <p>⚠️ Difficulty increases over time!</p>
      </div>
    </main>
  );
}
