export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const THEME = {
  bg: 0x090c19,
  grid: 0x141c38,
  orb: 0x00f0ff,
  orbGlow: 0x00f0ff,
  gravityNode: 0xffd700,
  gravityAura: 0xffd700,
  target: 0xff007f,
  hazard: 0xff3344,
  deflector: 0x00ff88,
  text: '#ffffff',
  textSub: '#8ea2c6',
  accent: '#00f0ff',
  gold: '#ffd700',
};

export const LEVELS = [
  {
    id: 1,
    name: 'First Sling',
    subtitle: 'Drag back & release the orb to launch into the target core',
    maxMoves3Stars: 1,
    maxMoves2Stars: 2,
    ballStart: { x: 360, y: 1050 },
    target: { x: 360, y: 300, radius: 45 },
    gravityNodes: [],
    deflectors: [],
    hazards: [],
  },
  {
    id: 2,
    name: 'Gravitational Slingshot',
    subtitle: 'Launch into the Gravity Anchor, hold to orbit, release to fling',
    maxMoves3Stars: 1,
    maxMoves2Stars: 2,
    ballStart: { x: 180, y: 1050 },
    target: { x: 540, y: 300, radius: 45 },
    gravityNodes: [
      { x: 360, y: 680, radius: 28, auraRadius: 155, orbitSpeed: 3.4 }
    ],
    deflectors: [],
    hazards: [
      { x: 360, y: 880, width: 260, height: 26, isMoving: false }
    ],
  },
  {
    id: 3,
    name: 'Dual Anchors',
    subtitle: 'Chain multiple gravity orbits around defensive barriers',
    maxMoves3Stars: 2,
    maxMoves2Stars: 3,
    ballStart: { x: 160, y: 1100 },
    target: { x: 560, y: 220, radius: 45 },
    gravityNodes: [
      { x: 260, y: 800, radius: 26, auraRadius: 140, orbitSpeed: 3.6 },
      { x: 460, y: 520, radius: 26, auraRadius: 140, orbitSpeed: -3.6 }
    ],
    deflectors: [
      { x: 200, y: 620, width: 140, height: 20, angle: 25 },
      { x: 520, y: 720, width: 140, height: 20, angle: -25 }
    ],
    hazards: [
      { x: 360, y: 360, width: 220, height: 24, isMoving: false }
    ],
  },
  {
    id: 4,
    name: 'Hazard Patrol',
    subtitle: 'Time your slingshot past oscillating security barriers',
    maxMoves3Stars: 2,
    maxMoves2Stars: 3,
    ballStart: { x: 360, y: 1100 },
    target: { x: 360, y: 220, radius: 45 },
    gravityNodes: [
      { x: 200, y: 680, radius: 26, auraRadius: 150, orbitSpeed: 3.5 },
      { x: 520, y: 680, radius: 26, auraRadius: 150, orbitSpeed: -3.5 }
    ],
    deflectors: [],
    hazards: [
      { x: 360, y: 860, width: 220, height: 24, isMoving: true, moveRange: 160, moveSpeed: 1.8, axis: 'x' },
      { x: 360, y: 480, width: 220, height: 24, isMoving: true, moveRange: 160, moveSpeed: -1.8, axis: 'x' }
    ],
  },
  {
    id: 5,
    name: 'Master Grid',
    subtitle: 'Synthesize ricochets, gravity pivots, and precision timing',
    maxMoves3Stars: 2,
    maxMoves2Stars: 3,
    ballStart: { x: 140, y: 1100 },
    target: { x: 360, y: 180, radius: 45 },
    gravityNodes: [
      { x: 520, y: 820, radius: 28, auraRadius: 155, orbitSpeed: 3.8 },
      { x: 220, y: 460, radius: 28, auraRadius: 155, orbitSpeed: -3.8 }
    ],
    deflectors: [
      { x: 360, y: 640, width: 180, height: 22, angle: -45 }
    ],
    hazards: [
      { x: 160, y: 780, width: 180, height: 22, isMoving: false },
      { x: 540, y: 380, width: 180, height: 22, isMoving: true, moveRange: 120, moveSpeed: 2.2, axis: 'y' }
    ],
  }
];
