import { SCREEN_W, SCREEN_H, COURT_WIDTH, COURT_LENGTH, NET_HEIGHT, NET_POST_HEIGHT,
  COURT_SURFACE, SERVICE_BOX_FILL, BALL_REPLAY } from './constants.js';
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

function fillQuad(ctx, corners) {
  if (corners.length < 4) return;
  const pts = corners.map(c => ({ x: Math.round(c.sx), y: Math.round(c.sy) }));
  const minY = Math.min(...pts.map(p => p.y));
  const maxY = Math.max(...pts.map(p => p.y));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      const p1 = pts[i], p2 = pts[j];
      if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
        const t = (y - p1.y) / (p2.y - p1.y);
        xs.push(p1.x + t * (p2.x - p1.x));
      }
    }
    if (xs.length >= 2) {
      xs.sort((a, b) => a - b);
      const x1 = Math.ceil(xs[0]);
      const x2 = Math.floor(xs[xs.length - 1]);
      for (let x = x1; x <= x2; x++) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

function drawCourtSurface() {
  ctx.fillStyle = COURT_SURFACE;
  const halfW = COURT_WIDTH / 2;
  const corners = [
    camera.project(-halfW, 0, 0),
    camera.project( halfW, 0, 0),
    camera.project( halfW, 0, COURT_LENGTH),
    camera.project(-halfW, 0, COURT_LENGTH),
  ].filter(Boolean);
  if (corners.length < 4) return;
  fillQuad(ctx, corners);
}

function drawServiceBoxes() {
  ctx.fillStyle = SERVICE_BOX_FILL;
  const halfW = COURT_WIDTH / 2;
  const mid = COURT_LENGTH / 2;
  for (const [zStart, zEnd] of [[0, mid], [mid, COURT_LENGTH]]) {
    const corners = [
      camera.project(-halfW, 0, zStart),
      camera.project( halfW, 0, zStart),
      camera.project( halfW, 0, zEnd),
      camera.project(-halfW, 0, zEnd),
    ].filter(Boolean);
    if (corners.length < 4) continue;
    fillQuad(ctx, corners);
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
  camera.draw_char(p.x, 0.25, p.z, 'O');
  camera.draw_char(p.x, 0.55, p.z, '_');
  camera.draw_char(p.x, 0.9, p.z, '.');
  camera.draw_char(p.x, 1.25, p.z, ':');

  if (p.state === 'hitting') {
    ctx.fillStyle = '#ddd';
    if (racketSide < 0) {
      camera.draw_char(p.x - 0.4, 0.7, p.z, '/');
    } else {
      camera.draw_char(p.x + 0.4, 0.7, p.z, '\\');
    }
  }
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
    let color;
    let racketSide;
    if (p.side !== undefined) {
      color = p.side === 1 ? '#0f0' : '#0ff';
      racketSide = p.side === 1 ? 1 : -1;
    } else {
      color = p.is_ai ? '#f44' : '#0ff';
      racketSide = p.is_ai ? 1 : -1;
    }
    drawPlayerFigure(p, color, racketSide);
  },

  landing_marker(pos) {
    if (!pos) return;
    ctx.fillStyle = "#ff0";
    camera.draw_char(pos.x, 0, pos.z, 'X');
  },

  ball(b) {
    if (b.state !== "in_play" && b.state !== "bounce" && b.state !== BALL_REPLAY && b.state !== "held") return;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    camera.draw_char(b.x, 0.01, b.z, '@');

    ctx.fillStyle = '#ff0';
    camera.draw_char(b.x, b.y, b.z, 'O');
  },

  hud(score, game_mode) {
    ctx.fillStyle = "#fff";
    const p1Label = game_mode === 2 ? "P1" : "P";
    const p2Label = game_mode === 2 ? "P2" : "A";
    const ptDisplay = scoring.display(score);
    const ptLine = ptDisplay.split('\n')[0];
    if (ptLine.includes('Deuce') || ptLine.includes('Tiebreak')) {
      ctx.fillText(ptLine, 2, 1);
    } else {
      ctx.fillText(p1Label + ":" + scoring.point_name(score.points[0]) + " " + p2Label + ":" + scoring.point_name(score.points[1]), 2, 1);
    }
    ctx.fillText("Games " + score.games[0] + "-" + score.games[1], 2, 9);
    if (score.sets[0] > 0 || score.sets[1] > 0) {
      ctx.fillText("Sets " + score.sets[0] + "-" + score.sets[1], 2, 17);
    }
  },

  referee(state) {
    if (!state || state.timer <= 0) return;

    const refX = COURT_WIDTH / 2 + 1.0;
    const refZ = COURT_LENGTH / 2;

    ctx.fillStyle = '#fff';
    camera.draw_char(refX, 1.2, refZ, '@');
    camera.draw_char(refX, 0.9, refZ, '|');
    camera.draw_char(refX - 0.4, 0.9, refZ, '/');
    camera.draw_char(refX + 0.4, 0.9, refZ, '\\');
    camera.draw_char(refX - 0.3, 0.4, refZ, '/');
    camera.draw_char(refX + 0.3, 0.4, refZ, '\\');

    if (state.message) {
      ctx.fillStyle = '#ff0';
      print(state.message, 140, 20);
    }
  },


  audience(aud) {
    const color = aud.cheer_level > 0 ? '#ff0' : '#fff';
    ctx.fillStyle = color;
    for (const spec of aud.spectators) {
      const x = spec.x + spec.offset_x;
      const z = spec.z + spec.offset_z;
      const pose = aud.get_pose(0);
      camera.draw_char(x, 0.4, z, pose[0]);
      camera.draw_char(x, 0.7, z, pose[1]);
      camera.draw_char(x, 1.0, z, pose[2]);
    }
  },

  menu(selected_diff, game_mode) {
    ctx.fillStyle = "#fff";
    ctx.fillText("  ____  _   _   ___   _   _   _____   ___   _   _   ____", 8, 15);
    ctx.fillText(" / ___|| | | | / _ \\ | \\ | | | ____| / _ \\ | \\ | | / ___|", 8, 23);
    ctx.fillText(" \\___ \\| |_| || | | ||  \\| | |  _|  | | | ||  \\| | \\___ \\", 8, 31);
    ctx.fillText("  ___) |  _  || |_| || |\\  | | |___ | |_| || |\\  |  ___) |", 8, 39);
    ctx.fillText(" |____/|_| |_| \\___/ |_| \\_| |_____| \\___/ |_| \\_| |____/", 8, 47);
    ctx.fillText("Mode: " + (game_mode === 2 ? "2-Player" : "1-Player"), 50, 65);
    if (game_mode === 1) {
      ctx.fillText("Select AI Difficulty:", 50, 75);
      ctx.fillText((selected_diff === 1 ? " > " : "   ") + "EASY", 55, 85);
      ctx.fillText((selected_diff === 2 ? " > " : "   ") + "HARD", 55, 95);
    }
    ctx.fillText("LEFT/RIGHT: mode", 50, 110);
    ctx.fillText("Click to play", 50, 120);
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
