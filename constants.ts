
import { BubbleColor } from './types';

// Visuals
export const BUBBLE_RADIUS = 24;
export const ROW_HEIGHT = BUBBLE_RADIUS * Math.sqrt(3);
export const GRID_COLS = 9; // Number of bubbles horizontally
export const GAME_WIDTH = GRID_COLS * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS; // Padding
export const GAME_HEIGHT = 800;
export const LAUNCHER_Y = GAME_HEIGHT - 60;

// Physics
export const PROJECTILE_SPEED = 15;
export const SNAP_DISTANCE = BUBBLE_RADIUS * 1.5;

// Gameplay
export const POINTS_PER_POP = 10;
export const POINTS_PER_DROP = 20;
export const ROWS_TO_START = 5;

// All available colors
export const ALL_COLORS = [
  BubbleColor.RED,
  BubbleColor.BLUE,
  BubbleColor.GREEN,
  BubbleColor.YELLOW,
  BubbleColor.PURPLE,
  BubbleColor.CYAN,
  BubbleColor.ORANGE
];

export const INITIAL_LEVEL = 1;

export const ACHIEVEMENTS_LIST = [
  { id: 'first_blood', title: 'First Pop', description: 'Clear your first level', icon: 'Award' },
  { id: 'combo_master', title: 'Combo Master', description: 'Pop 10+ bubbles in one shot', icon: 'Flame' },
  { id: 'sharpshooter', title: 'Sharpshooter', description: 'Clear a level without missing', icon: 'Target' },
  { id: 'explorer', title: 'Explorer', description: 'Reach Level 5', icon: 'Compass' },
  { id: 'daily_hero', title: 'Daily Hero', description: 'Complete a Daily Challenge', icon: 'Calendar' }
];
