import { useEffect, useRef, useState, useCallback } from 'react';

interface GameProps {
  onGameOver: (score: number) => void;
}

interface Alien {
  id: number;
  x: number;
  y: number;
  z: number;
  type: number;
  alive: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  z: number;
  isPlayer: boolean;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  z: number;
  frame: number;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 8;
const BULLET_SPEED = 12;
const ALIEN_BULLET_SPEED = 5;
const ALIEN_ROWS = 4;
const ALIEN_COLS = 8;
const ALIEN_SPACING_X = 70;
const ALIEN_SPACING_Z = 50;
const ALIEN_DESCENT_SPEED = 0.3;

export default function Game({ onGameOver }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<{
    player: { x: number; lives: number };
    aliens: Alien[];
    bullets: Bullet[];
    explosions: Explosion[];
    score: number;
    wave: number;
    alienDirection: number;
    alienSpeed: number;
    lastShot: number;
    lastAlienShot: number;
    keys: { [key: string]: boolean };
    bulletId: number;
    explosionId: number;
    gameLoop: number | null;
  }>({
    player: { x: 0, lives: 3 },
    aliens: [],
    bullets: [],
    explosions: [],
    score: 0,
    wave: 1,
    alienDirection: 1,
    alienSpeed: 1,
    lastShot: 0,
    lastAlienShot: 0,
    keys: {},
    bulletId: 0,
    explosionId: 0,
    gameLoop: null,
  });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT });

  const initAliens = useCallback((waveNum: number) => {
    const aliens: Alien[] = [];
    let id = 0;
    for (let row = 0; row < ALIEN_ROWS; row++) {
      for (let col = 0; col < ALIEN_COLS; col++) {
        aliens.push({
          id: id++,
          x: (col - ALIEN_COLS / 2 + 0.5) * ALIEN_SPACING_X,
          y: 0,
          z: -200 - row * ALIEN_SPACING_Z,
          type: row % 3,
          alive: true,
        });
      }
    }
    return aliens;
  }, []);

  const project = useCallback((x: number, y: number, z: number, width: number, height: number) => {
    const fov = 500;
    const scale = fov / (fov - z);
    return {
      x: width / 2 + x * scale,
      y: height / 2 + y * scale - 100 * scale,
      scale,
    };
  }, []);

  const drawAlien = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, type: number, time: number) => {
    const size = 30 * scale;
    const colors = ['#00fff7', '#ff0080', '#8b5cf6'];
    const color = colors[type];

    ctx.save();
    ctx.translate(x, y);

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 15 * scale;

    // Body
    ctx.fillStyle = color;
    const wobble = Math.sin(time / 200 + x / 50) * 2 * scale;

    if (type === 0) {
      // Squid type
      ctx.fillRect(-size / 2, -size / 3 + wobble, size, size / 2);
      ctx.fillRect(-size / 3, -size / 2 + wobble, size / 1.5, size);
      ctx.fillRect(-size / 2 - size / 4, size / 4 + wobble, size / 4, size / 3);
      ctx.fillRect(size / 2, size / 4 + wobble, size / 4, size / 3);
    } else if (type === 1) {
      // Crab type
      ctx.fillRect(-size / 2, -size / 4 + wobble, size, size / 2);
      ctx.fillRect(-size / 3, -size / 2 + wobble, size / 1.5, size);
      ctx.fillRect(-size / 2 - size / 3, -size / 4 + wobble, size / 3, size / 4);
      ctx.fillRect(size / 2, -size / 4 + wobble, size / 3, size / 4);
    } else {
      // Octopus type
      ctx.beginPath();
      ctx.arc(0, wobble, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-size / 4, size / 3 + wobble, size / 6, size / 3);
      ctx.fillRect(size / 4 - size / 6, size / 3 + wobble, size / 6, size / 3);
    }

    // Eyes
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(-size / 4, -size / 6 + wobble, size / 6, size / 6);
    ctx.fillRect(size / 4 - size / 6, -size / 6 + wobble, size / 6, size / 6);

    ctx.restore();
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, x: number, width: number, height: number, time: number) => {
    const projected = project(x, 100, 100, width, height);
    const size = 40 * projected.scale;

    ctx.save();
    ctx.translate(projected.x, projected.y);

    // Engine glow
    ctx.shadowColor = '#00fff7';
    ctx.shadowBlur = 20;

    // Ship body
    const gradient = ctx.createLinearGradient(0, -size, 0, size);
    gradient.addColorStop(0, '#00fff7');
    gradient.addColorStop(1, '#0066aa');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size / 2, size / 2);
    ctx.lineTo(-size / 4, size / 2);
    ctx.lineTo(-size / 4, size);
    ctx.lineTo(size / 4, size);
    ctx.lineTo(size / 4, size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.closePath();
    ctx.fill();

    // Cockpit
    ctx.fillStyle = '#ff0080';
    ctx.shadowColor = '#ff0080';
    ctx.beginPath();
    ctx.ellipse(0, 0, size / 6, size / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Engine flame
    const flameSize = (Math.sin(time / 50) * 0.3 + 0.7) * size / 2;
    const flameGradient = ctx.createLinearGradient(0, size, 0, size + flameSize);
    flameGradient.addColorStop(0, '#ff0080');
    flameGradient.addColorStop(0.5, '#fbbf24');
    flameGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGradient;
    ctx.shadowColor = '#ff0080';
    ctx.beginPath();
    ctx.moveTo(-size / 6, size);
    ctx.lineTo(0, size + flameSize);
    ctx.lineTo(size / 6, size);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, [project]);

  const drawBullet = useCallback((ctx: CanvasRenderingContext2D, bullet: Bullet, width: number, height: number) => {
    const projected = project(bullet.x, bullet.y, bullet.z, width, height);
    const size = bullet.isPlayer ? 8 * projected.scale : 6 * projected.scale;
    const color = bullet.isPlayer ? '#00fff7' : '#ff0080';

    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    const gradient = ctx.createRadialGradient(
      projected.x, projected.y, 0,
      projected.x, projected.y, size
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(projected.x, projected.y, size / 2, size * 2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [project]);

  const drawExplosion = useCallback((ctx: CanvasRenderingContext2D, explosion: Explosion, width: number, height: number) => {
    const projected = project(explosion.x, explosion.y, explosion.z, width, height);
    const progress = explosion.frame / 20;
    const size = (30 + progress * 40) * projected.scale;

    ctx.save();
    ctx.globalAlpha = 1 - progress;

    // Outer ring
    ctx.strokeStyle = '#ff0080';
    ctx.shadowColor = '#ff0080';
    ctx.shadowBlur = 20;
    ctx.lineWidth = 3 * projected.scale;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow
    const gradient = ctx.createRadialGradient(
      projected.x, projected.y, 0,
      projected.x, projected.y, size * 0.8
    );
    gradient.addColorStop(0, 'rgba(255, 0, 128, 0.8)');
    gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.4)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + progress * 2;
      const dist = size * 0.8 * progress;
      const px = projected.x + Math.cos(angle) * dist;
      const py = projected.y + Math.sin(angle) * dist;

      ctx.fillStyle = i % 2 === 0 ? '#00fff7' : '#ff0080';
      ctx.beginPath();
      ctx.arc(px, py, 4 * projected.scale * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [project]);

  const drawStars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.save();
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5 + time / 50) % width;
      const y = (i * 73.3) % height;
      const brightness = (Math.sin(time / 500 + i) + 1) / 2;
      const size = (i % 3) + 1;

      ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + brightness * 0.7})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const aspectRatio = GAME_WIDTH / GAME_HEIGHT;
      let width = rect.width;
      let height = rect.height;

      if (width / height > aspectRatio) {
        width = height * aspectRatio;
      } else {
        height = width / aspectRatio;
      }

      setContainerSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const game = gameRef.current;
    game.player = { x: 0, lives: 3 };
    game.aliens = initAliens(1);
    game.bullets = [];
    game.explosions = [];
    game.score = 0;
    game.wave = 1;
    game.alienDirection = 1;
    game.alienSpeed = 1;

    const handleKeyDown = (e: KeyboardEvent) => {
      game.keys[e.key.toLowerCase()] = true;
      if (e.key === ' ') e.preventDefault();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      game.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let lastTime = 0;

    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      const scaleX = containerSize.width / GAME_WIDTH;
      const width = containerSize.width;
      const height = containerSize.height;

      // Clear
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      // Draw stars
      drawStars(ctx, width, height, currentTime);

      // Player movement
      if (game.keys['arrowleft'] || game.keys['a']) {
        game.player.x = Math.max(-300, game.player.x - PLAYER_SPEED);
      }
      if (game.keys['arrowright'] || game.keys['d']) {
        game.player.x = Math.min(300, game.player.x + PLAYER_SPEED);
      }

      // Player shooting
      if (game.keys[' '] && currentTime - game.lastShot > 250) {
        game.bullets.push({
          id: game.bulletId++,
          x: game.player.x,
          y: 80,
          z: 100,
          isPlayer: true,
        });
        game.lastShot = currentTime;
      }

      // Update bullets
      game.bullets = game.bullets.filter((bullet) => {
        if (bullet.isPlayer) {
          bullet.z -= BULLET_SPEED;
          return bullet.z > -400;
        } else {
          bullet.z += ALIEN_BULLET_SPEED;

          // Check collision with player
          if (bullet.z > 80 && Math.abs(bullet.x - game.player.x) < 30) {
            game.player.lives--;
            setLives(game.player.lives);
            game.explosions.push({
              id: game.explosionId++,
              x: game.player.x,
              y: 100,
              z: 100,
              frame: 0,
            });
            if (game.player.lives <= 0) {
              onGameOver(game.score);
            }
            return false;
          }

          return bullet.z < 150;
        }
      });

      // Update aliens
      let shouldReverse = false;
      let allDead = true;

      game.aliens.forEach((alien) => {
        if (!alien.alive) return;
        allDead = false;

        alien.x += game.alienDirection * game.alienSpeed;
        alien.z += ALIEN_DESCENT_SPEED;

        if (Math.abs(alien.x) > 350) {
          shouldReverse = true;
        }

        // Check if aliens reached player
        if (alien.z > 50) {
          onGameOver(game.score);
        }

        // Check bullet collisions
        game.bullets = game.bullets.filter((bullet) => {
          if (!bullet.isPlayer) return true;

          const dx = Math.abs(bullet.x - alien.x);
          const dz = Math.abs(bullet.z - alien.z);

          if (dx < 30 && dz < 30) {
            alien.alive = false;
            game.explosions.push({
              id: game.explosionId++,
              x: alien.x,
              y: alien.y,
              z: alien.z,
              frame: 0,
            });
            game.score += (3 - alien.type) * 50 + 50;
            setScore(game.score);
            return false;
          }
          return true;
        });
      });

      if (shouldReverse) {
        game.alienDirection *= -1;
      }

      // Spawn new wave
      if (allDead) {
        game.wave++;
        setWave(game.wave);
        game.aliens = initAliens(game.wave);
        game.alienSpeed = 1 + game.wave * 0.3;
      }

      // Alien shooting
      const aliveAliens = game.aliens.filter((a) => a.alive);
      if (aliveAliens.length > 0 && currentTime - game.lastAlienShot > 1500 - game.wave * 100) {
        const shooter = aliveAliens[Math.floor(Math.random() * aliveAliens.length)];
        game.bullets.push({
          id: game.bulletId++,
          x: shooter.x,
          y: shooter.y,
          z: shooter.z,
          isPlayer: false,
        });
        game.lastAlienShot = currentTime;
      }

      // Update explosions
      game.explosions = game.explosions.filter((exp) => {
        exp.frame++;
        return exp.frame < 20;
      });

      // Draw aliens (sorted by z for proper depth)
      [...game.aliens]
        .filter((a) => a.alive)
        .sort((a, b) => a.z - b.z)
        .forEach((alien) => {
          const projected = project(alien.x, alien.y, alien.z, width, height);
          drawAlien(ctx, projected.x, projected.y, projected.scale, alien.type, currentTime);
        });

      // Draw bullets
      game.bullets.forEach((bullet) => {
        drawBullet(ctx, bullet, width, height);
      });

      // Draw explosions
      game.explosions.forEach((exp) => {
        drawExplosion(ctx, exp, width, height);
      });

      // Draw player
      drawPlayer(ctx, game.player.x, width, height, currentTime);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationId);
    };
  }, [containerSize.width, containerSize.height, initAliens, project, drawAlien, drawPlayer, drawBullet, drawExplosion, drawStars, onGameOver]);

  // Touch controls
  const handleTouch = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      gameRef.current.keys['arrowleft'] = true;
      gameRef.current.keys['arrowright'] = false;
    } else if (x > third * 2) {
      gameRef.current.keys['arrowright'] = true;
      gameRef.current.keys['arrowleft'] = false;
    } else {
      gameRef.current.keys[' '] = true;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    gameRef.current.keys['arrowleft'] = false;
    gameRef.current.keys['arrowright'] = false;
    gameRef.current.keys[' '] = false;
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 md:p-4">
      {/* HUD */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-2 md:mb-4 px-2 md:px-4">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-cyan-400 font-mono text-sm md:text-lg tracking-wider">SCORE</span>
          <span
            className="text-xl md:text-3xl font-bold"
            style={{ fontFamily: "'Orbitron', sans-serif", color: '#00fff7' }}
          >
            {score.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className="text-pink-400 font-mono text-sm md:text-lg tracking-wider">WAVE</span>
          <span
            className="text-xl md:text-3xl font-bold"
            style={{ fontFamily: "'Orbitron', sans-serif", color: '#ff0080' }}
          >
            {wave}
          </span>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 md:w-6 md:h-6 ${i < lives ? 'opacity-100' : 'opacity-20'}`}
            >
              <svg viewBox="0 0 24 24" fill={i < lives ? '#fbbf24' : '#333'}>
                <path d="M12 2L9 9H2L7.5 13.5L5.5 21L12 16.5L18.5 21L16.5 13.5L22 9H15L12 2Z" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Game Canvas */}
      <div
        className="relative w-full aspect-[4/3] max-w-4xl"
        style={{
          boxShadow: '0 0 40px rgba(0, 255, 247, 0.2), inset 0 0 60px rgba(0, 0, 0, 0.5)',
          border: '2px solid rgba(0, 255, 247, 0.3)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          width={containerSize.width}
          height={containerSize.height}
          className="w-full h-full"
          onTouchStart={handleTouch}
          onTouchMove={handleTouch}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        />

        {/* Touch zones indicator (mobile only) */}
        <div className="md:hidden absolute inset-0 flex pointer-events-none opacity-0 active:opacity-100 transition-opacity">
          <div className="flex-1 border-r border-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-500/50 text-2xl">&lt;</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-pink-500/50 text-xl">FIRE</span>
          </div>
          <div className="flex-1 border-l border-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-500/50 text-2xl">&gt;</span>
          </div>
        </div>
      </div>
    </div>
  );
}
