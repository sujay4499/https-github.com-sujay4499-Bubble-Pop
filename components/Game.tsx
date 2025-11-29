import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  BUBBLE_RADIUS, GAME_HEIGHT, GAME_WIDTH, LAUNCHER_Y, 
  PROJECTILE_SPEED, GRID_COLS, POINTS_PER_POP, POINTS_PER_DROP, ALL_COLORS 
} from '../constants';
import { Bubble, BubbleColor, GameState, Particle, Projectile, GameMode } from '../types';
import { getGridPosition, getGridCoords, getNeighbors, findCluster, findFloatingBubbles } from '../game/physics';
import { audioService } from '../services/audioService';

interface GameProps {
  gameState: GameState;
  gameMode: GameMode;
  setGameState: (state: GameState) => void;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  score: number;
  level: number;
  setLevel: React.Dispatch<React.SetStateAction<number>>;
  onUnlockAchievement: (id: string) => void;
  onDailyComplete: () => void;
  swapTrigger: number; // Prop to trigger swap from UI
}

const Game: React.FC<GameProps> = ({ 
  gameState, 
  gameMode, 
  setGameState, 
  setScore, 
  score, 
  level, 
  setLevel,
  onUnlockAchievement,
  onDailyComplete,
  swapTrigger
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game Objects State
  const bubblesRef = useRef<Bubble[]>([]);
  const projectileRef = useRef<Projectile | null>(null);
  const nextBubbleColorRef = useRef<BubbleColor>(BubbleColor.RED);
  const currentBubbleColorRef = useRef<BubbleColor>(BubbleColor.BLUE);
  const particlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef<{ x: number, y: number }>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 });
  const rngRef = useRef<() => number>(Math.random);

  // Level Stats for Achievements
  const shotsFiredRef = useRef(0);
  const missedShotsRef = useRef(0);

  // Helper for seeded random (LCG)
  const setupRNG = useCallback((seedStr: string) => {
    // Simple hash to integer
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
        seed = ((seed << 5) - seed) + seedStr.charCodeAt(i);
        seed |= 0;
    }
    // LCG
    let state = Math.abs(seed);
    rngRef.current = () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }, []);
  
  // Initialize Level
  const initLevel = useCallback((lvl: number, mode: GameMode) => {
    // Reset stats
    shotsFiredRef.current = 0;
    missedShotsRef.current = 0;

    // Setup RNG
    if (mode === GameMode.DAILY) {
        const d = new Date();
        const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        setupRNG(dateStr);
    } else {
        rngRef.current = Math.random;
    }

    const rand = rngRef.current;
    
    // Config based on level
    const colorCount = mode === GameMode.DAILY 
        ? 5 
        : Math.min(ALL_COLORS.length, 3 + Math.floor(lvl / 2));
        
    const colorsInLevel = ALL_COLORS.slice(0, colorCount);
    
    const rows = mode === GameMode.DAILY 
        ? 8 
        : 4 + Math.min(8, Math.floor(lvl / 3));
    
    const newBubbles: Bubble[] = [];
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        // Skip some bubbles to make patterns?
        // Simple random skipping for variety, less likely at top
        if (r > 0 && rand() > 0.9) continue;

        if (r % 2 !== 0 && c === GRID_COLS - 1) continue; 

        const pos = getGridPosition(c, r);
        newBubbles.push({
          id: `${c}-${r}-${rand()}`,
          gridX: c,
          gridY: r,
          x: pos.x,
          y: pos.y,
          color: colorsInLevel[Math.floor(rand() * colorsInLevel.length)],
          active: true,
          scale: 1,
          popping: false
        });
      }
    }
    bubblesRef.current = newBubbles;
    currentBubbleColorRef.current = colorsInLevel[Math.floor(rand() * colorsInLevel.length)];
    nextBubbleColorRef.current = colorsInLevel[Math.floor(rand() * colorsInLevel.length)];
    projectileRef.current = null;
    particlesRef.current = [];
  }, [setupRNG]);

  // Init on mount or level change
  useEffect(() => {
    if (gameState === GameState.PLAYING && bubblesRef.current.length === 0) {
      initLevel(level, gameMode);
    }
  }, [level, gameState, gameMode, initLevel]);

  // Handle Swap from Props
  useEffect(() => {
    if (swapTrigger > 0 && !projectileRef.current && gameState === GameState.PLAYING) {
        swapBubbles();
    }
  }, [swapTrigger]);

  const swapBubbles = () => {
      const temp = currentBubbleColorRef.current;
      currentBubbleColorRef.current = nextBubbleColorRef.current;
      nextBubbleColorRef.current = temp;
      audioService.playShoot(); // Small sound for swap
  };

  // Input Handlers
  const handleInput = useCallback((clientX: number, clientY: number) => {
    if (gameState !== GameState.PLAYING) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mousePosRef.current = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, [gameState]);

  const handleInteractionEnd = useCallback((clientX: number, clientY: number) => {
     if (gameState !== GameState.PLAYING) return;
     const canvas = canvasRef.current;
     if (!canvas) return;
     const rect = canvas.getBoundingClientRect();
     const scaleY = canvas.height / rect.height;
     const scaleX = canvas.width / rect.width;
     
     const y = (clientY - rect.top) * scaleY;
     const x = (clientX - rect.left) * scaleX;

     // Check if tap was on the launcher area (Swap logic)
     // Launcher is at LAUNCHER_Y, center x
     // Next bubble is at center x + 80
     const distToLauncher = Math.sqrt((x - GAME_WIDTH/2)**2 + (y - LAUNCHER_Y)**2);
     const distToNext = Math.sqrt((x - (GAME_WIDTH/2 + 80))**2 + (y - (LAUNCHER_Y + 10))**2);

     if (distToLauncher < BUBBLE_RADIUS * 2.5 || distToNext < BUBBLE_RADIUS * 2) {
         if (!projectileRef.current) {
             swapBubbles();
             return;
         }
     }

     shoot();
  }, [gameState]);

  const shoot = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;
    if (projectileRef.current) return;

    const dx = mousePosRef.current.x - GAME_WIDTH / 2;
    const dy = mousePosRef.current.y - LAUNCHER_Y;
    
    if (dy > -50) return; // Prevent shooting down

    const angle = Math.atan2(dy, dx);

    projectileRef.current = {
      x: GAME_WIDTH / 2,
      y: LAUNCHER_Y,
      velocity: {
        x: Math.cos(angle) * PROJECTILE_SPEED,
        y: Math.sin(angle) * PROJECTILE_SPEED
      },
      color: currentBubbleColorRef.current,
      active: true
    };
    audioService.playShoot();
    shotsFiredRef.current++;

    // Prepare next bubble
    const availableColors = new Set(bubblesRef.current.map(b => b.color));
    const validNextColors = Array.from(availableColors);
    
    currentBubbleColorRef.current = nextBubbleColorRef.current;
    
    const rand = rngRef.current;
    if (validNextColors.length > 0) {
       nextBubbleColorRef.current = validNextColors[Math.floor(rand() * validNextColors.length)];
    } else {
       nextBubbleColorRef.current = ALL_COLORS[0];
    }
  }, [gameState]);

  // Event Listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleInput(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleInput(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleInteractionEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };

    const onMouseDown = (e: MouseEvent) => {
      handleInput(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => {
        handleInput(e.clientX, e.clientY);
    };
    const onMouseUp = (e: MouseEvent) => {
        handleInteractionEnd(e.clientX, e.clientY);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleInput, handleInteractionEnd]);


  // Game Loop
  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    // 1. Update Projectile
    const proj = projectileRef.current;
    if (proj && proj.active) {
      proj.x += proj.velocity.x;
      proj.y += proj.velocity.y;

      // Wall bounce
      if (proj.x <= BUBBLE_RADIUS || proj.x >= GAME_WIDTH - BUBBLE_RADIUS) {
        proj.velocity.x *= -1;
        proj.x = Math.max(BUBBLE_RADIUS, Math.min(GAME_WIDTH - BUBBLE_RADIUS, proj.x));
        audioService.playBounce();
      }

      // Ceiling collision
      if (proj.y <= BUBBLE_RADIUS) {
        snapBubble(proj);
      } else {
        // Bubble collision
        for (const b of bubblesRef.current) {
          if (!b.active) continue;
          const dist = Math.sqrt((proj.x - b.x) ** 2 + (proj.y - b.y) ** 2);
          if (dist < BUBBLE_RADIUS * 2 - 4) { // Small buffer
            snapBubble(proj);
            break;
          }
        }
      }
    }

    // 2. Update Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // Gravity
      p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // 3. Popping Animation
    bubblesRef.current.forEach(b => {
      if (b.popping) {
        b.scale -= 0.1;
        if (b.scale <= 0) b.active = false;
      }
    });
    const activeCount = bubblesRef.current.filter(b => b.active || b.popping).length;
    bubblesRef.current = bubblesRef.current.filter(b => b.active || b.scale > 0);

    // Check Win/Loss
    if (activeCount === 0 && !proj) {
      setGameState(GameState.VICTORY);
      audioService.playWin();
      onUnlockAchievement('first_blood');
      if (missedShotsRef.current === 0) onUnlockAchievement('sharpshooter');
      if (gameMode === GameMode.DAILY) onDailyComplete();
      if (level >= 5) onUnlockAchievement('explorer');
    } else {
        const bottomBubble = bubblesRef.current.find(b => b.y + BUBBLE_RADIUS > LAUNCHER_Y - 50);
        if (bottomBubble) {
            setGameState(GameState.GAME_OVER);
            audioService.playGameOver();
        }
    }

  }, [gameState, setGameState, level, gameMode]);

  const snapBubble = (proj: Projectile) => {
    audioService.playBounce(); 
    const coords = getGridCoords(proj.x, proj.y);
    let col = Math.max(0, Math.min(GRID_COLS - 1, coords.col));
    let row = Math.max(0, coords.row);
    
    let occupied = bubblesRef.current.find(b => b.gridX === col && b.gridY === row && b.active);
    
    if (occupied) {
       const neighbors = getNeighbors(col, row);
       let bestN = null;
       let minD = 99999;
       for (const n of neighbors) {
           const p = getGridPosition(n.col, n.row);
           const d = Math.sqrt((p.x - proj.x)**2 + (p.y - proj.y)**2);
           if (!bubblesRef.current.find(b => b.gridX === n.col && b.gridY === n.row && b.active)) {
               if (d < minD) {
                   minD = d;
                   bestN = n;
               }
           }
       }
       if (bestN) {
           col = bestN.col;
           row = bestN.row;
       }
    }

    const newBubble: Bubble = {
      id: `${col}-${row}-${Date.now()}`,
      gridX: col,
      gridY: row,
      x: getGridPosition(col, row).x,
      y: getGridPosition(col, row).y,
      color: proj.color,
      active: true,
      scale: 1,
      popping: false
    };

    bubblesRef.current.push(newBubble);
    projectileRef.current = null; 

    // Matches
    const matches = findCluster(newBubble, bubblesRef.current, true);
    if (matches.length >= 3) {
      audioService.playPop();
      
      // Achievement Check: Combo
      if (matches.length >= 10) onUnlockAchievement('combo_master');

      matches.forEach(b => {
        b.popping = true;
        createParticles(b.x, b.y, b.color);
      });
      setScore(s => s + matches.length * POINTS_PER_POP);

      const activeBubbles = bubblesRef.current.filter(b => !b.popping);
      const floating = findFloatingBubbles(activeBubbles);
      
      floating.forEach(b => {
        const target = bubblesRef.current.find(orig => orig.id === b.id);
        if (target) {
            target.popping = true;
            createParticles(target.x, target.y, target.color, true);
        }
      });
      
      if (floating.length > 0) {
          setScore(s => s + floating.length * POINTS_PER_DROP);
      }
    } else {
        // Missed shot (didn't pop anything)
        missedShotsRef.current++;
    }
  };

  const createParticles = (x: number, y: number, color: string, heavy: boolean = false) => {
    const count = heavy ? 8 : 5;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color,
        size: Math.random() * 4 + 2
      });
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(1, '#312e81');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Danger Line
    ctx.beginPath();
    ctx.moveTo(0, LAUNCHER_Y - 50);
    ctx.lineTo(GAME_WIDTH, LAUNCHER_Y - 50);
    ctx.strokeStyle = '#ef4444';
    ctx.setLineDash([10, 10]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Aim Line
    if (gameState === GameState.PLAYING && !projectileRef.current) {
      ctx.beginPath();
      ctx.moveTo(GAME_WIDTH / 2, LAUNCHER_Y);
      const dx = mousePosRef.current.x - GAME_WIDTH / 2;
      const dy = mousePosRef.current.y - LAUNCHER_Y;
      
      if (dy < -20) {
          const angle = Math.atan2(dy, dx);
          const guideLen = 150;
          ctx.lineTo(GAME_WIDTH / 2 + Math.cos(angle) * guideLen, LAUNCHER_Y + Math.sin(angle) * guideLen);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 4;
          ctx.stroke();
      }
    }

    // Helper to draw bubble
    const drawBubble = (x: number, y: number, color: string, scale: number = 1) => {
      if (scale <= 0) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      
      const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, BUBBLE_RADIUS);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, shadeColor(color, -40));
      
      ctx.fillStyle = grad;
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      
      ctx.beginPath();
      ctx.arc(0, 0, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(-8, -8, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Draw Board Bubbles
    bubblesRef.current.forEach(b => drawBubble(b.x, b.y, b.color, b.scale));

    // Draw Projectile
    if (projectileRef.current) {
      drawBubble(projectileRef.current.x, projectileRef.current.y, projectileRef.current.color);
    }

    // Draw Launcher (Current + Next)
    if (gameState === GameState.PLAYING) {
        // Current
        if (!projectileRef.current) {
            drawBubble(GAME_WIDTH / 2, LAUNCHER_Y, currentBubbleColorRef.current);
            // Draw swap hint if user is hovering over it (optional, skipped for perf)
        }
        
        // Next Indicator
        const nextX = GAME_WIDTH / 2 + 80;
        const nextY = LAUNCHER_Y + 10;
        
        // Next Bubble Background
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(nextX, nextY, BUBBLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        drawBubble(nextX, nextY, nextBubbleColorRef.current, 0.7);
        
        // Text labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 12px Exo 2';
        ctx.textAlign = 'center';
        ctx.fillText('SWAP', GAME_WIDTH / 2, LAUNCHER_Y + 45);
        ctx.fillText('NEXT', nextX, nextY + 35);
    }

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

  }, [gameState]);

  // Animation Loop
  const tick = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  return (
    <div className="relative w-full h-full flex justify-center items-center bg-gray-900 overflow-hidden">
        <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="max-w-full max-h-full shadow-2xl cursor-crosshair"
            style={{ aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
        />
    </div>
  );
};

// Utility to darken color
function shadeColor(color: string, percent: number) {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);
    
    const RR = ((R.toString(16).length===1)?"0"+R.toString(16):R.toString(16));
    const GG = ((G.toString(16).length===1)?"0"+G.toString(16):G.toString(16));
    const BB = ((B.toString(16).length===1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

export default Game;