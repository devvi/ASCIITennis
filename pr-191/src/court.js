import { COURT_LENGTH, COURT_WIDTH, NET_HEIGHT, SINGLES_WIDTH } from './constants.js';

export const court = {
  lines: [],
  net: {},

  init() {
    const SW = SINGLES_WIDTH;
    this.lines = [
      // Doubles baselines
      { x1: -COURT_WIDTH/2, z1: 0, x2: COURT_WIDTH/2, z2: 0 },
      { x1: -COURT_WIDTH/2, z1: COURT_LENGTH, x2: COURT_WIDTH/2, z2: COURT_LENGTH },
      // Doubles sidelines
      { x1: -COURT_WIDTH/2, z1: 0, x2: -COURT_WIDTH/2, z2: COURT_LENGTH },
      { x1: COURT_WIDTH/2, z1: 0, x2: COURT_WIDTH/2, z2: COURT_LENGTH },
      // Singles sidelines
      { x1: -SW/2, z1: 0, x2: -SW/2, z2: COURT_LENGTH },
      { x1: SW/2, z1: 0, x2: SW/2, z2: COURT_LENGTH },
      // Service lines
      { x1: -COURT_WIDTH/2, z1: COURT_LENGTH/4, x2: COURT_WIDTH/2, z2: COURT_LENGTH/4 },
      { x1: -COURT_WIDTH/2, z1: 3*COURT_LENGTH/4, x2: COURT_WIDTH/2, z2: 3*COURT_LENGTH/4 },
      // Center service line
      { x1: 0, z1: COURT_LENGTH/4, x2: 0, z2: 3*COURT_LENGTH/4 },
      // Center hash marks on baselines
      { x1: -0.5, z1: 0, x2: 0.5, z2: 0 },
      { x1: -0.5, z1: COURT_LENGTH, x2: 0.5, z2: COURT_LENGTH },
    ];

    this.net = {
      x1: -COURT_WIDTH/2, z1: COURT_LENGTH/2,
      x2: COURT_WIDTH/2, z2: COURT_LENGTH/2,
      height: NET_HEIGHT,
    };
  },

  is_in_bounds(x, z) {
    return x >= -SINGLES_WIDTH/2 && x <= SINGLES_WIDTH/2
      && z >= 0 && z <= COURT_LENGTH;
  },

  is_in_player_side(z) {
    return z < COURT_LENGTH / 2;
  },

  is_in_service_box(x, z, side) {
    if (side === 0) {
      if (z < 0 || z > COURT_LENGTH / 4) return false;
    } else {
      if (z < 3 * COURT_LENGTH / 4 || z > COURT_LENGTH) return false;
    }
    return x >= -SINGLES_WIDTH / 2 && x <= SINGLES_WIDTH / 2;
  },


  hits_net(x, z, prev_z, ball_height) {
    if (ball_height > NET_HEIGHT) return false;
    return (prev_z < COURT_LENGTH/2 && z >= COURT_LENGTH/2)
        || (prev_z > COURT_LENGTH/2 && z <= COURT_LENGTH/2);
  },
};
