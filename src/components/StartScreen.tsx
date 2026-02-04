import { useState, useEffect } from 'react';

interface StartScreenProps {
  onStart: () => void;
  highScore: number;
}

export default function StartScreen({ onStart, highScore }: StartScreenProps) {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 100);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center px-4 py-8">
      {/* Animated background grid */}
      <div className="fixed inset-0 z-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 247, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 247, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
        }} />
      </div>

      {/* Title */}
      <div className="relative z-10 mb-8 md:mb-12">
        <h1
          className={`font-bold text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-2 transition-all duration-100 ${glitch ? 'translate-x-1' : ''}`}
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: glitch
              ? '-3px 0 #ff0080, 3px 0 #00fff7'
              : '0 0 30px rgba(0, 255, 247, 0.5), 0 0 60px rgba(0, 255, 247, 0.3)',
            color: '#00fff7',
          }}
        >
          SPACE
        </h1>
        <h1
          className={`font-bold text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tighter transition-all duration-100 ${glitch ? '-translate-x-1' : ''}`}
          style={{
            fontFamily: "'Orbitron', sans-serif",
            textShadow: glitch
              ? '3px 0 #00fff7, -3px 0 #ff0080'
              : '0 0 30px rgba(255, 0, 128, 0.5), 0 0 60px rgba(255, 0, 128, 0.3)',
            color: '#ff0080',
          }}
        >
          INVADERS
        </h1>
        <div className="text-cyan-400 text-xs md:text-sm tracking-[0.3em] md:tracking-[0.5em] mt-4 font-mono opacity-70">
          3D EDITION
        </div>
      </div>

      {/* Alien preview */}
      <div className="relative z-10 flex justify-center gap-4 md:gap-8 mb-8 md:mb-12">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-8 h-8 md:w-12 md:h-12"
            style={{
              animation: `float ${1.5 + i * 0.2}s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                d="M4 8h2v2H4V8zm14 0h2v2h-2V8zm-2 2h2v2h-2v-2zm-8 0h2v2H8v-2zm2 2h4v2h-4v-2zm-4 2h2v2H6v-2zm10 0h2v2h-2v-2zm-8 2h2v2H8v-2zm6 0h2v2h-2v-2z"
                fill={i % 2 === 0 ? '#00fff7' : '#ff0080'}
                style={{
                  filter: `drop-shadow(0 0 8px ${i % 2 === 0 ? '#00fff7' : '#ff0080'})`,
                }}
              />
            </svg>
          </div>
        ))}
      </div>

      {/* High Score */}
      {highScore > 0 && (
        <div className="relative z-10 mb-6 md:mb-8">
          <div className="text-yellow-400 font-mono text-sm md:text-lg tracking-wider">
            HIGH SCORE: <span className="text-yellow-300">{highScore.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={onStart}
        className="relative z-10 group px-8 py-4 md:px-12 md:py-5 text-lg md:text-xl font-bold tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          background: 'linear-gradient(135deg, rgba(0, 255, 247, 0.1), rgba(255, 0, 128, 0.1))',
          border: '2px solid rgba(0, 255, 247, 0.5)',
          color: '#00fff7',
          boxShadow: '0 0 20px rgba(0, 255, 247, 0.3), inset 0 0 20px rgba(0, 255, 247, 0.1)',
        }}
      >
        <span className="relative z-10">START GAME</span>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>

      {/* Controls hint */}
      <div className="relative z-10 mt-8 md:mt-12 text-gray-500 text-xs md:text-sm font-mono space-y-2">
        <p className="hidden md:block">ARROWS or A/D to move · SPACE to shoot</p>
        <p className="md:hidden">TOUCH LEFT/RIGHT to move · TAP CENTER to shoot</p>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
