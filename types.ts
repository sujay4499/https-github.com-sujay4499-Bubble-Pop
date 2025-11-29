
export interface Vector2 {
  x: number;
  y: number;
}

export enum BubbleColor {
  RED = '#ef4444',
  BLUE = '#3b82f6',
  GREEN = '#22c55e',
  YELLOW = '#eab308',
  PURPLE = '#a855f7',
  CYAN = '#06b6d4',
  ORANGE = '#f97316'
}

export interface Bubble {
  id: string;
  gridX: number; // Column index
  gridY: number; // Row index
  x: number;     // Pixel X
  y: number;     // Pixel Y
  color: BubbleColor;
  active: boolean;
  scale: number; // Animation scale (0 to 1)
  popping: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  velocity: Vector2;
  color: BubbleColor;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
  VICTORY
}

export enum GameMode {
  CLASSIC,
  DAILY
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  unlocked: boolean;
}

export interface DailyChallengeState {
  lastPlayedDate: string | null;
  completed: boolean;
}

export interface LevelConfig {
  levelNumber: number;
  rows: number;
  colors: BubbleColor[];
  speedMultiplier: number;
}
