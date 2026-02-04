import { useState, useEffect, useCallback, useRef } from 'react';
import Game from './components/Game';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';

export type GameState = 'start' | 'playing' | 'gameover';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('spaceInvadersHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  const handleStart = useCallback(() => {
    setScore(0);
    setGameState('playing');
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('spaceInvadersHighScore', finalScore.toString());
    }
    setGameState('gameover');
  }, [highScore]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden">
      {/* Scanline overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 247, 0.1) 2px, rgba(0, 255, 247, 0.1) 4px)',
      }} />

      {/* Vignette effect */}
      <div className="pointer-events-none fixed inset-0 z-40" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)',
      }} />

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center relative z-10">
        {gameState === 'start' && (
          <StartScreen onStart={handleStart} highScore={highScore} />
        )}
        {gameState === 'playing' && (
          <Game onGameOver={handleGameOver} />
        )}
        {gameState === 'gameover' && (
          <GameOverScreen
            score={score}
            highScore={highScore}
            onRestart={handleStart}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 md:py-4 text-center">
        <p className="text-[10px] md:text-xs text-gray-600 tracking-wider font-mono">
          Requested by <span className="text-cyan-700">@OxPaulius</span> · Built by <span className="text-pink-700">@clonkbot</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
