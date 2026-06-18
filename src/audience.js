import { COURT_LENGTH, COURT_WIDTH } from './constants.js';

const CHEER_DURATION = 60;
const RALLY_CHEER_THRESHOLD = 5;
const SPECTATOR_COUNT = 25;

function generate_spectators() {
  const specs = [];
  const halfW = COURT_WIDTH / 2;

  for (let i = 0; i < SPECTATOR_COUNT; i++) {
    let x, z;
    const side = Math.floor(Math.random() * 4);
    switch (side) {
      case 0:
        x = -halfW - 1.0 - Math.random() * 1.5;
        z = Math.random() * COURT_LENGTH;
        break;
      case 1:
        x = halfW + 1.0 + Math.random() * 1.5;
        z = Math.random() * COURT_LENGTH;
        break;
      case 2:
        x = (Math.random() - 0.5) * COURT_WIDTH;
        z = -1.0 - Math.random() * 1.5;
        break;
      case 3:
        x = (Math.random() - 0.5) * COURT_WIDTH;
        z = COURT_LENGTH + 1.0 + Math.random() * 1.5;
        break;
    }
    specs.push({
      x,
      z,
      offset_x: (Math.random() - 0.5) * 0.3,
      offset_z: (Math.random() - 0.5) * 0.3,
    });
  }
  return specs;
}

export const audience = {
  CHEER_DURATION,
  RALLY_CHEER_THRESHOLD,

  spectators: [],
  cheer_level: 0,

  init() {
    this.spectators = generate_spectators();
    this.cheer_level = 0;
  },

  cheer() {
    this.cheer_level = CHEER_DURATION;
  },

  update() {
    if (this.cheer_level > 0) {
      this.cheer_level -= 1;
    }
  },

  get_pose(i) {
    if (this.cheer_level > 0) {
      return ['\\', 'o', '/'];
    }
    return [' ', 'O', ' '];
  },
};
