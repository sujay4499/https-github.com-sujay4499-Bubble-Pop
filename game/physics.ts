import { BUBBLE_RADIUS, ROW_HEIGHT, GRID_COLS } from '../constants';
import { Vector2, Bubble, BubbleColor } from '../types';

// Helper to get pixel position from grid coordinates
export const getGridPosition = (col: number, row: number): Vector2 => {
  // Odd-r layout (shove odd rows right)
  // Even rows (0, 2, 4...) are normal
  // Odd rows (1, 3, 5...) are shifted by R
  const xOffset = (row % 2 === 0) ? 0 : BUBBLE_RADIUS;
  return {
    x: col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + xOffset,
    y: row * ROW_HEIGHT + BUBBLE_RADIUS
  };
};

// Helper to get grid coordinates from pixel position
export const getGridCoords = (x: number, y: number): { col: number; row: number } => {
  const row = Math.round((y - BUBBLE_RADIUS) / ROW_HEIGHT);
  const xOffset = (row % 2 === 0) ? 0 : BUBBLE_RADIUS;
  const col = Math.round((x - BUBBLE_RADIUS - xOffset) / (BUBBLE_RADIUS * 2));
  return { col, row };
};

// Find neighbors in a hex grid
export const getNeighbors = (col: number, row: number): { col: number; row: number }[] => {
  const directions = (row % 2 === 0)
    ? [ // Even row directions
        { c: -1, r: -1 }, { c: 0, r: -1 }, // Top Left, Top Right
        { c: -1, r: 0 },  { c: 1, r: 0 },  // Left, Right
        { c: -1, r: 1 },  { c: 0, r: 1 }   // Bottom Left, Bottom Right
      ]
    : [ // Odd row directions
        { c: 0, r: -1 }, { c: 1, r: -1 },  // Top Left, Top Right
        { c: -1, r: 0 }, { c: 1, r: 0 },   // Left, Right
        { c: 0, r: 1 },  { c: 1, r: 1 }    // Bottom Left, Bottom Right
      ];

  return directions.map(d => ({ col: col + d.c, row: row + d.r }));
};

// Find all connected bubbles of the same color
export const findCluster = (
  startBubble: Bubble,
  grid: Bubble[],
  matchColor: boolean = true
): Bubble[] => {
  const cluster: Bubble[] = [];
  const visited = new Set<string>();
  const queue: Bubble[] = [startBubble];

  visited.add(startBubble.id);
  cluster.push(startBubble);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = getNeighbors(current.gridX, current.gridY);

    for (const n of neighbors) {
      const neighborBubble = grid.find(b => b.gridX === n.col && b.gridY === n.row && b.active);
      if (neighborBubble && !visited.has(neighborBubble.id)) {
        if (!matchColor || neighborBubble.color === current.color) {
          visited.add(neighborBubble.id);
          cluster.push(neighborBubble);
          queue.push(neighborBubble);
        }
      }
    }
  }

  return cluster;
};

// Find floating bubbles (not connected to ceiling)
export const findFloatingBubbles = (grid: Bubble[]): Bubble[] => {
  const floating: Bubble[] = [];
  const visited = new Set<string>();
  const queue: Bubble[] = [];

  // Add all ceiling bubbles to queue
  const ceilingBubbles = grid.filter(b => b.gridY === 0 && b.active);
  ceilingBubbles.forEach(b => {
    visited.add(b.id);
    queue.push(b);
  });

  // Traverse from ceiling down
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = getNeighbors(current.gridX, current.gridY);

    for (const n of neighbors) {
      const neighbor = grid.find(b => b.gridX === n.col && b.gridY === n.row && b.active);
      if (neighbor && !visited.has(neighbor.id)) {
        visited.add(neighbor.id);
        queue.push(neighbor);
      }
    }
  }

  // Any active bubble not visited is floating
  grid.forEach(b => {
    if (b.active && !visited.has(b.id)) {
      floating.push(b);
    }
  });

  return floating;
};