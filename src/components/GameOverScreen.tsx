import { useEffect, useState } from 'react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
}

export default function GameOverScreen({ score, highScore, onRestart }: GameOverScreenProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const isNewHighScore = score === highScore && score > 0;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <div className="text-center px-4 py-8 animate-fadeIn">
      {/* Explosion particles background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 md:w-2 md:h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: i % 2 === 0 ? '#00fff7' : '#ff0080',
              animation: `particle ${2 + Math.random() * 3}s ease-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Game Over Title */}
      <div className="relative z-10 mb-8 md:mb-12">
        <h1
          className="font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight animate-pulse"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 30px rgba(255, 0, 128, 0.8), 0 0 60px rgba(255, 0, 128, 0.5)',
            color: '#ff0080',
          }}
        >
          GAME OVER
        </h1>
      </div>

      {/* Score Display */}
      <div className="relative z-10 mb-6 md:mb-8 space-y-4">
        <div className="text-cyan-400 font-mono text-base md:text-xl tracking-wider">
          FINAL SCORE
        </div>
        <div
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: '0 0 40px rgba(0, 255, 247, 0.8)',
            color: '#00fff7',
          }}
        >
          {displayScore.toLocaleString()}
        </div>

        {isNewHighScore && (
          <div
            className="text-yellow-400 text-lg md:text-2xl font-bold tracking-widest animate-bounce"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '0 0 20px rgba(251, 191, 36, 0.8)',
            }}
          >
            NEW HIGH SCORE!
          </div>
        )}

        {!isNewHighScore && highScore > 0 && (
          <div className="text-gray-500 font-mono text-sm md:text-base">
            HIGH SCORE: {highScore.toLocaleString()}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="relative z-10 flex justify-center gap-6 md:gap-12 mb-8 md:mb-12">
        <div className="text-center">
          <div className="text-pink-500 text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {Math.floor(score / 100)}
          </div>
          <div className="text-gray-500 text-xs md:text-sm font-mono tracking-wider">ALIENS</div>
        </div>
        <div className="text-center">
          <div className="text-purple-500 text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            {Math.floor(score / 500) + 1}
          </div>
          <div className="text-gray-500 text-xs md:text-sm font-mono tracking-wider">WAVES</div>
        </div>
      </div>

      {/* Restart Button */}
      <button
        onClick={onRestart}
        className="relative z-10 group px-8 py-4 md:px-12 md:py-5 text-lg md:text-xl font-bold tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          background: 'linear-gradient(135deg, rgba(255, 0, 128, 0.2), rgba(139, 92, 246, 0.2))',
          border: '2px solid rgba(255, 0, 128, 0.5)',
          color: '#ff0080',
          boxShadow: '0 0 20px rgba(255, 0, 128, 0.3), inset 0 0 20px rgba(255, 0, 128, 0.1)',
        }}
      >
        <span className="relative z-10">PLAY AGAIN</span>
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      <style>{`
        @keyframes particle {
          0% { transform: scale(1) translateY(0); opacity: 0.6; }
          100% { transform: scale(0) translateY(-100px); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
