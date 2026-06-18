import {
  CHEER_DURATION, AUDIENCE_COUNT,
  COURT_LENGTH, COURT_WIDTH,
} from './constants.js';

const IDLE_POSE = [' ', 'O', ' '];
const CHEER_POSE = ['\\', 'o', '/'];

function generate_positions() {
  const positions = [];
  const halfW = COURT_WIDTH / 2;

  const sides = [
    { xBase: -halfW - 2, zMin: -4, zMax: -1 },
    { xBase: halfW + 2, zMin: -4, zMax: -1 },
    { xBase: -halfW - 2, zMin: COURT_LENGTH + 1, zMax: COURT_LENGTH + 4 },
    { xBase: halfW + 2, zMin: COURT_LENGTH + 1, zMax: COURT_LENGTH + 4 },
    { xMin: -halfW - 4, xMax: -halfW - 1, zBase: -2 },
    { xMin: -halfW - 4, xMax: -halfW - 1, zBase: COURT_LENGTH + 2 },
    { xMin: halfW + 1, xMax: halfW + 4, zBase: -2 },
    { xMin: halfW + 1, xMax: halfW + 4, zBase: COURT_LENGTH + 2 },
  ];

  let i = 0;
  while (positions.length < AUDIENCE_COUNT) {
    const side = sides[i % sides.length];
    let x, z;

    if ('zBase' in side) {
      x = side.xMin + Math.random() * (side.xMax - side.xMin);
      z = side.zBase + (Math.random() - 0.5) * 1.5;
    } else {
      x = side.xBase + (Math.random() - 0.5) * 0.6;
      z = side.zMin + Math.random() * (side.zMax - side.zMin);
    }

    positions.push({ x, z });
    i++;
  }

  return positions;
}

export const audience = {
  spectators: [],
  cheer_level: 0,

  init() {
    this.spectators = generate_positions();
    this.cheer_level = 0;
  },

  cheer() {
    this.cheer_level = CHEER_DURATION;
  },

  update() {
    if (this.cheer_level > 0) {
      this.cheer_level--;
    }
  },

  get_pose(_index) {
    return this.cheer_level > 0 ? CHEER_POSE : IDLE_POSE;
  },
};
