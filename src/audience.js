import { COURT_LENGTH, COURT_WIDTH, AUDIENCE_COUNT, AUDIENCE_ROWS, ROW_SPACING, STAND_MARGIN_X, STAND_MARGIN_Z } from './constants.js';

const POSES = {
  idle: [
    { top: ' O ', bottom: ' _ ' },
    { top: '(O)', bottom: '_ _' },
    { top: " O'", bottom: ' _ ' },
  ],
  cheer: { top: '\\o/', bottom: ' - ' },
};

export const audience = {
  spectators: [],
  cheer_level: 0,

  init(count = AUDIENCE_COUNT) {
    this.spectators = [];
    this.cheer_level = 0;
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
      { rowAxis: 'z', rowStart: COURT_LENGTH + STAND_MARGIN_Z, rowDir: 1, seatAxis: 'x', seatStart: -halfW - STAND_MARGIN_X, seatEnd: -halfW },
      { rowAxis: 'z', rowStart: COURT_LENGTH + STAND_MARGIN_Z, rowDir: 1, seatAxis: 'x', seatStart: halfW, seatEnd: halfW + STAND_MARGIN_X },
      { rowAxis: 'x', rowStart: -halfW - STAND_MARGIN_X, rowDir: -1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH },
      { rowAxis: 'x', rowStart: halfW + STAND_MARGIN_X, rowDir: 1, seatAxis: 'z', seatStart: 0, seatEnd: COURT_LENGTH },
    ];

    for (const bank of banks) {
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
          });
        }
      }
    }
  },

  sort_by_depth() {
    this.spectators.sort((a, b) => b.z - a.z);
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
      return POSES.cheer;
    }
    const variant = this.spectators[i]?.variant ?? 0;
    return POSES.idle[variant % POSES.idle.length];
  },
};
