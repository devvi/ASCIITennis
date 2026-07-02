import { COURT_LENGTH, COURT_WIDTH, AUDIENCE_COUNT, AUDIENCE_ROWS, ROW_SPACING, STAND_MARGIN_X, STAND_MARGIN_Z, KILL_RADIUS } from './constants.js';

const POSES = {
  idle: [
    { top: ' O ', bottom: ' _ ' },
    { top: '(O)', bottom: '_ _' },
    { top: " O'", bottom: ' _ ' },
  ],
  cheer: { top: '\\o/', bottom: ' - ' },
  dead: { top: ' X ', bottom: '|_|' },
};

export const audience = {
  spectators: [],
  cheer_level: 0,
  kill_count: 0,
  crowd_phase: 0,

  init(count = AUDIENCE_COUNT) {
    this.spectators = [];
    this.cheer_level = 0;
    this.kill_count = 0;
    this.crowd_phase = 0;
    this.generate_positions(count);
    this.sort_by_depth();
  },

  generate_positions(count) {
    const halfW = COURT_WIDTH / 2;
    const totalRows = 6 * AUDIENCE_ROWS;
    const perRow = Math.floor(count / totalRows);
    let remaining = count - perRow * totalRows;

    const banks = [
      { rowAxis: 'z', rowStart: -STAND_MARGIN_Z, rowDir: -1, seatAxis: 'x', seatStart: -halfW - STAND_MARGIN_X, seatEnd: -halfW },
      { rowAxis: 'z', rowStart: -STAND_MARGIN_Z, rowDir: -1, seatAxis: 'x', seatStart: halfW, seatEnd: halfW + STAND_MARGIN_X },
      { rowAxis: 'x', rowStart: -halfW - STAND_MARGIN_X - AUDIENCE_ROWS * ROW_SPACING, rowDir: -1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH / 2 },
      { rowAxis: 'x', rowStart: halfW + STAND_MARGIN_X + AUDIENCE_ROWS * ROW_SPACING, rowDir: 1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH / 2 },
      { rowAxis: 'x', rowStart: -halfW - STAND_MARGIN_X, rowDir: -1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH / 2 },
      { rowAxis: 'x', rowStart: halfW + STAND_MARGIN_X, rowDir: 1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH / 2 },
    ];

    for (let bankIdx = 0; bankIdx < banks.length; bankIdx++) {
      const bank = banks[bankIdx];
      for (let row = 0; row < AUDIENCE_ROWS; row++) {
        const seatsInRow = perRow + (remaining > 0 ? 1 : 0);
        if (remaining > 0) remaining--;
        if (seatsInRow === 0) continue;

        const rowPos = bank.rowStart + row * ROW_SPACING * bank.rowDir;
        for (let seat = 0; seat < seatsInRow; seat++) {
          const t = seatsInRow > 1 ? seat / (seatsInRow - 1) : 0;
          const seatPos = bank.seatStart + t * (bank.seatEnd - bank.seatStart);
          const x = bank.seatAxis === 'x' ? seatPos : rowPos;
          const z = bank.seatAxis === 'z' ? seatPos : rowPos;
          this.spectators.push({
            x: x + (Math.random() - 0.5) * 0.3,
            z: z + (Math.random() - 0.5) * 0.3,
            row,
            variant: Math.floor(Math.random() * POSES.idle.length),
            alive: true,
          });
        }
      }
    }
  },

  sort_by_depth() {
    this.spectators.sort((a, b) => b.z - a.z);
  },

  cheer(intensity) {
    this.cheer_level = intensity !== undefined ? Math.min(150, intensity) : 75;
  },

  update() {
    if (this.cheer_level > 0) {
      this.cheer_level--;
    }
  },

  check_hit(x, z) {
    let nearest = -1;
    let minDist = Infinity;
    for (let i = 0; i < this.spectators.length; i++) {
      const s = this.spectators[i];
      if (!s.alive) continue;
      const dx = x - s.x;
      const dz = z - s.z;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist < KILL_RADIUS && dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    }
    return nearest;
  },

  kill(i) {
    if (i < 0 || i >= this.spectators.length) return;
    if (!this.spectators[i].alive) return;
    this.spectators[i].alive = false;
    this.kill_count++;
  },

  get_pose(i) {
    const spec = this.spectators[i];
    if (!spec || !spec.alive) return POSES.dead;
    if (this.cheer_level > 0) {
      return POSES.cheer;
    }
    if (this.crowd_phase > 0) {
      return { top: '|o|', bottom: ' _ ' };
    }
    const variant = spec.variant ?? 0;
    return POSES.idle[variant % POSES.idle.length];
  },
};
