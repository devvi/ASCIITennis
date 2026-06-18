import { COURT_LENGTH, COURT_WIDTH, AUDIENCE_COUNT } from './constants.js';

export const audience = {
  spectators: [],
  cheer_level: 0,

  init(count = AUDIENCE_COUNT) {
    this.spectators = [];
    this.cheer_level = 0;
    const halfW = COURT_WIDTH / 2;

    const regions = [
      { xRange: [-halfW - 1.0, -halfW - 0.5], zRange: [-1.5, -0.5] },
      { xRange: [halfW + 0.5, halfW + 1.0], zRange: [-1.5, -0.5] },
      { xRange: [-halfW - 1.0, -halfW - 0.5], zRange: [COURT_LENGTH + 0.5, COURT_LENGTH + 1.5] },
      { xRange: [halfW + 0.5, halfW + 1.0], zRange: [COURT_LENGTH + 0.5, COURT_LENGTH + 1.5] },
      { xRange: [-halfW - 1.5, -halfW - 0.5], zRange: [0, COURT_LENGTH] },
      { xRange: [halfW + 0.5, halfW + 1.5], zRange: [0, COURT_LENGTH] },
    ];

    for (let i = 0; i < count; i++) {
      const region = regions[i % regions.length];
      const x = region.xRange[0] + Math.random() * (region.xRange[1] - region.xRange[0]);
      const z = region.zRange[0] + Math.random() * (region.zRange[1] - region.zRange[0]);
      this.spectators.push({ x, z });
    }
  },

  cheer() {
    this.cheer_level = 75;
  },

  update() {
    if (this.cheer_level > 0) {
      this.cheer_level--;
    }
  },

  get_pose(i) {
    if (this.cheer_level > 0) {
      return { top: '\\o/', bottom: ' - ' };
    }
    return { top: ' O ', bottom: ' _ ' };
  },
};
