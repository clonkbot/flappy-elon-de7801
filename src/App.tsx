import { useState, useEffect, useCallback, useRef } from 'react';
import './styles.css';

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

const GRAVITY = 0.6;
const JUMP_FORCE = -10;
const PIPE_WIDTH = 80;
const PIPE_GAP = 180;
const PIPE_SPEED = 4;
const BIRD_SIZE = 50;
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

export default function App() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [birdRotation, setBirdRotation] = useState(0);
  const gameLoopRef = useRef<number>();
  const lastPipeRef = useRef(0);

  const jump = useCallback(() => {
    if (gameState === 'idle') {
      setGameState('playing');
      setBirdVelocity(JUMP_FORCE);
    } else if (gameState === 'playing') {
      setBirdVelocity(JUMP_FORCE);
    } else if (gameState === 'dead') {
      // Reset game
      setBirdY(GAME_HEIGHT / 2);
      setBirdVelocity(0);
      setPipes([]);
      setScore(0);
      setBirdRotation(0);
      setGameState('idle');
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      setBirdVelocity(v => v + GRAVITY);
      setBirdY(y => {
        const newY = y + birdVelocity;
        return Math.max(0, Math.min(GAME_HEIGHT - BIRD_SIZE, newY));
      });

      // Update rotation based on velocity
      setBirdRotation(Math.min(90, Math.max(-30, birdVelocity * 3)));

      setPipes(currentPipes => {
        let newPipes = currentPipes.map(pipe => ({
          ...pipe,
          x: pipe.x - PIPE_SPEED
        })).filter(pipe => pipe.x > -PIPE_WIDTH);

        // Add new pipe
        lastPipeRef.current += PIPE_SPEED;
        if (lastPipeRef.current > 200) {
          lastPipeRef.current = 0;
          const gapY = Math.random() * (GAME_HEIGHT - PIPE_GAP - 150) + 75;
          newPipes.push({ x: GAME_WIDTH, gapY, passed: false });
        }

        return newPipes;
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, birdVelocity]);

  // Collision detection and scoring
  useEffect(() => {
    if (gameState !== 'playing') return;

    const birdLeft = 80;
    const birdRight = birdLeft + BIRD_SIZE;
    const birdTop = birdY;
    const birdBottom = birdY + BIRD_SIZE;

    // Ground/ceiling collision
    if (birdTop <= 0 || birdBottom >= GAME_HEIGHT) {
      setGameState('dead');
      if (score > highScore) setHighScore(score);
      return;
    }

    // Pipe collision
    for (const pipe of pipes) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;

      if (birdRight > pipeLeft && birdLeft < pipeRight) {
        if (birdTop < pipe.gapY || birdBottom > pipe.gapY + PIPE_GAP) {
          setGameState('dead');
          if (score > highScore) setHighScore(score);
          return;
        }
      }

      // Score
      if (!pipe.passed && pipe.x + PIPE_WIDTH < birdLeft) {
        pipe.passed = true;
        setScore(s => s + 1);
      }
    }
  }, [birdY, pipes, gameState, score, highScore]);

  return (
    <div className="app-container">
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      <h1 className="title">
        <span className="title-flappy">FLAPPY</span>
        <span className="title-elon">ELON</span>
      </h1>

      <div className="score-display">
        <div className="current-score">
          <span className="score-label">SCORE</span>
          <span className="score-value">{score}</span>
        </div>
        <div className="high-score">
          <span className="score-label">BEST</span>
          <span className="score-value">{highScore}</span>
        </div>
      </div>

      <div
        className={`game-container ${gameState === 'dead' ? 'glitch' : ''}`}
        onClick={jump}
      >
        <div className="scanlines"></div>

        {/* Mars surface at bottom */}
        <div className="mars-surface"></div>

        {/* Pipes - Cybertrucks */}
        {pipes.map((pipe, i) => (
          <div key={i}>
            {/* Top pipe */}
            <div
              className="pipe pipe-top"
              style={{
                left: pipe.x,
                height: pipe.gapY,
              }}
            >
              <div className="cybertruck top">
                <div className="ct-body"></div>
                <div className="ct-window"></div>
              </div>
            </div>
            {/* Bottom pipe */}
            <div
              className="pipe pipe-bottom"
              style={{
                left: pipe.x,
                top: pipe.gapY + PIPE_GAP,
                height: GAME_HEIGHT - pipe.gapY - PIPE_GAP,
              }}
            >
              <div className="cybertruck bottom">
                <div className="ct-body"></div>
                <div className="ct-window"></div>
              </div>
            </div>
          </div>
        ))}

        {/* Elon Bird */}
        <div
          className="bird"
          style={{
            top: birdY,
            transform: `rotate(${birdRotation}deg)`,
          }}
        >
          <div className="elon-head">
            <div className="elon-hair"></div>
            <div className="elon-face">
              <div className="elon-eye left"></div>
              <div className="elon-eye right"></div>
              <div className="elon-smirk"></div>
            </div>
          </div>
          <div className="elon-body">
            <div className="x-logo">X</div>
          </div>
          <div className={`elon-cape ${gameState === 'playing' ? 'flapping' : ''}`}></div>
        </div>

        {/* Game states */}
        {gameState === 'idle' && (
          <div className="overlay">
            <div className="start-text">
              <p className="tap-text">TAP OR PRESS SPACE</p>
              <p className="subtext">TO LAUNCH ELON</p>
              <div className="rocket-icon">🚀</div>
            </div>
          </div>
        )}

        {gameState === 'dead' && (
          <div className="overlay death-overlay">
            <div className="death-text">
              <p className="game-over">MISSION FAILED</p>
              <p className="death-score">You reached {score} pipes</p>
              <p className="retry-text">TAP TO RETRY</p>
              <div className="death-emojis">💀 🔥 📉</div>
            </div>
          </div>
        )}
      </div>

      <div className="instructions">
        <span className="key">SPACE</span> or <span className="key">CLICK</span> to fly
      </div>

      <footer className="footer">
        Requested by <a href="https://twitter.com/amk0x" target="_blank" rel="noopener noreferrer">@amk0x</a> · Built by <a href="https://twitter.com/clonkbot" target="_blank" rel="noopener noreferrer">@clonkbot</a>
      </footer>
    </div>
  );
}