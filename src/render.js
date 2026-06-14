import { SCREEN_W, SCREEN_H, COURT_WIDTH, COURT_LENGTH, HUD_HEIGHT, NET_HEIGHT, NET_POST_HEIGHT,
  FOCAL, CAM_HEIGHT, CAM_Z, HORIZON_Y,
  COURT_SURFACE, COURT_SURFACE_DARK, COURT_OUTSIDE, SERVICE_BOX_FILL } from './constants.js';
import { camera, setDrawChar } from './camera.js';
import { scoring } from './scoring.js';
import { court } from './court.js';

const SCALE = 4;
let ctx;

function printChar(ch, x, y) {
  ctx.fillText(ch, x, y);
}

export function initRender(canvas) {
  canvas.width = SCREEN_W * SCALE;
  canvas.height = SCREEN_H * SCALE;
  ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  setDrawChar(printChar);
}

export function beginFrame() {
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.font = '7px "Courier New", monospace';
  ctx.textBaseline = "top";
  ctx.textAlign = "start";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
}

export function print(str, x, y) {
  ctx.fillText(str, x, y);
}

function drawCourtSurface() {
  ctx.fillStyle = COURT_SURFACE;
  const Z_STEPS = 80;
  for (let i = 0; i <= Z_STEPS; i++) {
    const t = i / Z_STEPS;
    const z = t * COURT_LENGTH;
    const halfW = COURT_WIDTH / 2;
    const left = camera.project(-halfW, 0, z);
    const right = camera.project(halfW, 0, z);
    if (!left || !right) continue;
    const sy = Math.round(left.sy);
    if (sy < HUD_HEIGHT || sy >= SCREEN_H) continue;
    const sx1 = Math.max(0, Math.round(left.sx));
    const sx2 = Math.min(SCREEN_W - 1, Math.round(right.sx));
    if (sx2 > sx1) {
      ctx.fillRect(sx1, sy, sx2 - sx1, 1);
    }
  }
}

function drawServiceBoxes() {
  ctx.fillStyle = SERVICE_BOX_FILL;
  const Z_STEPS = 40;
  const mid = COURT_LENGTH / 2;
  const halfW = COURT_WIDTH / 2;
  for (const [zStart, zEnd] of [[0, mid], [mid, COURT_LENGTH]]) {
    for (let i = 0; i <= Z_STEPS; i++) {
      const t = i / Z_STEPS;
      const z = zStart + t * (zEnd - zStart);
      const left = camera.project(-halfW, 0, z);
      const right = camera.project(halfW, 0, z);
      if (!left || !right) continue;
      const sy = Math.round(left.sy);
      if (sy < HUD_HEIGHT || sy >= SCREEN_H) continue;
      const sx1 = Math.max(0, Math.round(left.sx));
      const sx2 = Math.min(SCREEN_W - 1, Math.round(right.sx));
      if (sx2 > sx1) {
        ctx.fillRect(sx1, sy, sx2 - sx1, 1);
      }
    }
  }
}

function drawCourtLines() {
  ctx.fillStyle = '#fff';
  for (const line of court.lines) {
    const isHorizontal = Math.abs(line.z1 - line.z2) < 0.01;
    const isHash = isHorizontal && Math.abs(line.x1 - line.x2) < 2;
    let ch = isHorizontal ? '-' : '|';
    if (isHash) ch = '|';
    const dz = line.z1 - line.z2;
    const dx = line.x1 - line.x2;
    camera.draw_line(line.x1, 0, line.z1, line.x2, 0, line.z2, ch);
  }
}

function drawNet() {
  const mid = COURT_LENGTH / 2;
  const halfW = COURT_WIDTH / 2;

  // Net top tape
  ctx.fillStyle = '#fff';
  camera.draw_line(-halfW, NET_HEIGHT, mid, halfW, NET_HEIGHT, mid, '=');

  // Net mesh (horizontal strands)
  ctx.fillStyle = '#888';
  const strands = 6;
  for (let i = 1; i < strands; i++) {
    const y = (i / strands) * NET_HEIGHT;
    camera.draw_line(-halfW, y, mid, halfW, y, mid, ':');
  }

  // Net posts
  ctx.fillStyle = '#aaa';
  camera.draw_char(-halfW, NET_POST_HEIGHT, mid, '|');
  camera.draw_char(halfW, NET_POST_HEIGHT, mid, '|');

  // Post tops
  ctx.fillStyle = '#fff';
  camera.draw_char(-halfW, NET_POST_HEIGHT + 0.05, mid, '@');
  camera.draw_char(halfW, NET_POST_HEIGHT + 0.05, mid, '@');
}

function drawPlayerFigure(p, color, racketSide) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  camera.draw_char(p.x, 0.01, p.z, 'O');

  ctx.fillStyle = color;
  camera.draw_char(p.x, 0.25, p.z, '/');
  camera.draw_char(p.x, 0.55, p.z, '|');
  camera.draw_char(p.x, 0.9, p.z, '+');

  if (p.state === 'hitting') {
    ctx.fillStyle = '#ddd';
    if (racketSide < 0) {
      camera.draw_char(p.x - 0.4, 0.7, p.z, '/');
    } else {
      camera.draw_char(p.x + 0.4, 0.7, p.z, '\\');
    }
  }

  ctx.fillStyle = color;
  camera.draw_char(p.x, 1.25, p.z, 'O');
}

export const render = {
  court() {
    drawCourtSurface();
    drawServiceBoxes();
    drawCourtLines();
  },

  net() {
    drawNet();
  },

  player(p, label) {
    const color = p.is_ai ? '#f44' : '#0ff';
    const racketSide = p.is_ai ? 1 : -1;
    drawPlayerFigure(p, color, racketSide);
  },

  ball(b) {
    if (b.state !== "in_play" && b.state !== "bounce") return;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    camera.draw_char(b.x, 0.01, b.z, '@');

    ctx.fillStyle = '#ff0';
    camera.draw_char(b.x, b.y, b.z, 'O');
  },

  hud(score) {
    ctx.fillStyle = "#fff";
    const ptDisplay = scoring.display(score);
    const ptLine = ptDisplay.split('\n')[0];
    if (ptLine.includes('Deuce')) {
      ctx.fillText(ptLine, 2, 1);
    } else {
      ctx.fillText("P:" + scoring.point_name(score.points[0]) + " A:" + scoring.point_name(score.points[1]), 2, 1);
    }
    ctx.fillText("Games " + score.games[0] + "-" + score.games[1], 2, 9);
    if (score.sets[0] > 0 || score.sets[1] > 0) {
      ctx.fillText("Sets " + score.sets[0] + "-" + score.sets[1], 2, 17);
    }
  },

  menu(selected_diff) {
    ctx.fillStyle = "#fff";
    ctx.fillText("  ____  _   _   ___   _   _   _____   ___   _   _   ____", 8, 15);
    ctx.fillText(" / ___|| | | | / _ \\ | \\ | | | ____| / _ \\ | \\ | | / ___|", 8, 23);
    ctx.fillText(" \\___ \\| |_| || | | ||  \\| | |  _|  | | | ||  \\| | \\___ \\", 8, 31);
    ctx.fillText("  ___) |  _  || |_| || |\\  | | |___ | |_| || |\\  |  ___) |", 8, 39);
    ctx.fillText(" |____/|_| |_| \\___/ |_| \\_| |_____| \\___/ |_| \\_| |____/", 8, 47);
    ctx.fillText("Select AI Difficulty:", 50, 70);
    ctx.fillText((selected_diff === 1 ? " > " : "   ") + "EASY", 55, 80);
    ctx.fillText((selected_diff === 2 ? " > " : "   ") + "HARD", 55, 90);
    ctx.fillText("Click to play", 55, 110);
  },

  game_over(winner) {
    ctx.fillStyle = "#fff";
    ctx.fillText("  ____    _    __  __ _____ ", 35, 30);
    ctx.fillText(" / ___|  / \\  |  \\/  | ____|", 35, 38);
    ctx.fillText("| |  _  / _ \\ | |\\/| |  _|  ", 35, 46);
    ctx.fillText("| |_| |/ ___ \\| |  | | |___ ", 35, 54);
    ctx.fillText(" \\____/_/   \\_\\_|  |_|_____|", 35, 62);
    ctx.fillText(winner + " wins the match!", 55, 80);
    ctx.fillText("Click to play again", 48, 95);
  },
};
