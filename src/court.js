import { COURT_LENGTH, COURT_WIDTH, NET_HEIGHT } from "./constants.js";

export const court = {
  lines: [],
  net: {},

  init() {
    this.lines = [
      { x1: -COURT_WIDTH/2, z1: 0, x2: COURT_WIDTH/2, z2: 0 },
      { x1: -COURT_WIDTH/2, z1: COURT_LENGTH, x2: COURT_WIDTH/2, z2: COURT_LENGTH },
      { x1: -COURT_WIDTH/2, z1: 0, x2: -COURT_WIDTH/2, z2: COURT_LENGTH },
      { x1: COURT_WIDTH/2, z1: 0, x2: COURT_WIDTH/2, z2: COURT_LENGTH },
      { x1: -COURT_WIDTH/2, z1: COURT_LENGTH/4, x2: COURT_WIDTH/2, z2: COURT_LENGTH/4 },
      { x1: -COURT_WIDTH/2, z1: 3*COURT_LENGTH/4, x2: COURT_WIDTH/2, z2: 3*COURT_LENGTH/4 },
      { x1: 0, z1: COURT_LENGTH/4, x2: 0, z2: 3*COURT_LENGTH/4 },
    ];

    this.net = {
      x1: -COURT_WIDTH/2, z1: COURT_LENGTH/2,
      x2: COURT_WIDTH/2, z2: COURT_LENGTH/2,
      height: NET_HEIGHT,
    };
  },

  is_in_bounds(x, z) {
    return x >= -COURT_WIDTH/2 && x <= COURT_WIDTH/2
      && z >= 0 && z <= COURT_LENGTH;
  },

  is_in_player_side(z) {
    return z < COURT_LENGTH / 2;
  },

  hits_net(x, z, prev_z, ball_height) {
    if (ball_height > NET_HEIGHT) return false;
    return (prev_z < COURT_LENGTH/2 && z >= COURT_LENGTH/2)
        || (prev_z > COURT_LENGTH/2 && z <= COURT_LENGTH/2);
  },
};
