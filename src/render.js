import { SCREEN_W, SCREEN_H, COURT_WIDTH, COURT_LENGTH, NET_HEIGHT, NET_POST_HEIGHT,
  COURT_SURFACE, SERVICE_BOX_FILL, BALL_REPLAY, STAND_MARGIN_X, STAND_MARGIN_Z, ROOF_Y, ROOF_CHAR, LIGHT_CHAR, PILLAR_CHAR } from './constants.js';
import { camera, setDrawChar } from './camera.js';
import { scoring } from './scoring.js';
import { court } from './court.js';
import { GIT_HASH, GIT_DATE } from './version.js';

const SCALE = 4;
let ctx;
let kill_flash_timer = 0;

export function activate_kill_flash() {
  kill_flash_timer = 30;
}

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

export function getCtx() { return ctx; }

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

  if (p.hit_range_mult && p.hit_range_mult > 1) {
    camera.draw_char(p.x, 0.15, p.z, '[');
    camera.draw_char(p.x, 0.25, p.z, 'O');
    camera.draw_char(p.x, 0.35, p.z, ']');
  } else {
    camera.draw_char(p.x, 0.25, p.z, 'O');
  }
  camera.draw_char(p.x, 0.55, p.z, '_');
  camera.draw_char(p.x, 0.9, p.z, '.');
  camera.draw_char(p.x, 1.25, p.z, ':');

  if (p.shield_active) {
    ctx.fillStyle = '#44f';
    camera.draw_char(p.x - 0.3, 0.2, p.z, '~');
    camera.draw_char(p.x + 0.3, 0.2, p.z, '~');
  }

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

  player(p, label, game_mode) {
    const isP2 = game_mode === "2p" ? (label === "P2") : p.is_ai;
    const color = isP2 ? '#f44' : '#0ff';
    const racketSide = isP2 ? 1 : -1;
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

  hud(score, game_mode, opts) {
    ctx.fillStyle = "#fff";
    const ptDisplay = scoring.display(score);
    const ptLine = ptDisplay.split('\n')[0];
    if (ptLine.includes('Deuce')) {
      ctx.fillText(ptLine, 2, 1);
    } else {
      const p1Label = game_mode === "2p" ? "P1:" : "P:";
      const p2Label = game_mode === "2p" ? "P2:" : "A:";
      ctx.fillText(p1Label + scoring.point_name(score.points[0]) + " " + p2Label + scoring.point_name(score.points[1]), 2, 1);
    }
    ctx.fillText("Games " + score.games[0] + "-" + score.games[1], 2, 9);
    if (score.sets[0] > 0 || score.sets[1] > 0) {
      ctx.fillText("Sets " + score.sets[0] + "-" + score.sets[1], 2, 17);
    }
    if (kill_flash_timer > 0) {
      ctx.fillStyle = '#ff0';
      print("KILL +1", 100, 1);
      kill_flash_timer--;
    }
    if (opts) {
      if (opts.item) {
        ctx.fillStyle = '#0f0';
        const itemDescs = { F: 'Power shot', B: 'Wide reach', S: 'Auto return', M: 'Extra ball', T: 'Slow motion' };
        ctx.fillText("ITEM: " + opts.item + " (" + itemDescs[opts.item] + ")", 2, 25);
      }
      if (opts.p2_item) {
        ctx.fillStyle = '#f44';
        ctx.fillText("P2 ITEM: " + opts.p2_item, 2, 33);
      }
      if (opts.target_score !== null && opts.target_score !== undefined) {
        ctx.fillStyle = '#fa0';
        ctx.fillText("SCORE: " + opts.target_score, 2, 33);
      }
      if (opts.longest_rally !== null && opts.longest_rally !== undefined) {
        ctx.fillStyle = '#ff0';
        ctx.fillText("BEST: " + opts.longest_rally, 150, 9);
      }
      if (opts.cheat_code_active) {
        ctx.fillStyle = '#f0f';
        ctx.fillText("SUPER MODE!", 160, 25);
      }
      if (opts.time_slow_active) {
        ctx.fillStyle = '#44f';
        ctx.fillText("SLOW", 180, 33);
      }
      if (opts.head_bounce) {
        ctx.fillStyle = '#ff0';
        ctx.fillText("!", 130, 17);
      }
      if (opts.game_mode === 'zombie') {
        ctx.fillStyle = '#0f0';
        ctx.fillText("ZOMBIE MODE", 150, 17);
      }
      if (opts.game_mode === 'target_practice') {
        ctx.fillStyle = '#f80';
        ctx.fillText("TARGET PRACTICE", 130, 17);
      }
      if (opts.game_mode === 'rally_challenge') {
        ctx.fillStyle = '#ff0';
        ctx.fillText("RALLY CHALLENGE", 130, 17);
      }
      if (opts.game_mode === 'gravity_shift') {
        ctx.fillStyle = '#0ff';
        ctx.fillText("GRAVITY SHIFT", 140, 17);
      }
      if (opts.game_mode === 'pong_mode') {
        ctx.fillStyle = '#fff';
        ctx.fillText("PONG MODE", 150, 17);
      }
    }
  },

  audience(audience_obj) {
    if (!audience_obj || !audience_obj.spectators) return;

    for (let i = 0; i < audience_obj.spectators.length; i++) {
      const spec = audience_obj.spectators[i];
      const p = camera.project(spec.x, 0, spec.z);
      if (!p) continue;
      const sx = Math.round(p.sx);
      const sy = Math.round(p.sy);
      if (sx < -10 || sx > SCREEN_W + 10 || sy < -10 || sy > SCREEN_H + 10) continue;

      const alive = spec.alive !== false;
      ctx.fillStyle = alive ? '#fff' : '#666';
      const pose = audience_obj.get_pose(i);
      print(pose.top, sx - 7, sy);
      print(pose.bottom, sx - 7, sy + 7);
    }
  },

  venue() {
    ctx.fillStyle = '#444';
    for (let x = 15; x < SCREEN_W - 10; x += 2) {
      for (let y = 2; y <= 5; y++) {
        const ch = ((x + y) % 6 < 3) ? ROOF_CHAR : '~';
        ctx.fillText(ch, x, y);
      }
    }

    ctx.fillStyle = '#ff0';
    for (let lx = -COURT_WIDTH / 2; lx <= COURT_WIDTH / 2; lx += COURT_WIDTH / 5) {
      const p = camera.project(lx, ROOF_Y, COURT_LENGTH / 2);
      if (p) {
        ctx.fillText(LIGHT_CHAR, Math.round(p.sx), Math.round(p.sy));
      }
    }

    ctx.fillStyle = '#888';
    const halfW = COURT_WIDTH / 2;
    const pillarPositions = [
      { x: -(halfW + STAND_MARGIN_X + 1), z: -(STAND_MARGIN_Z + 1) },
      { x: halfW + STAND_MARGIN_X + 1, z: -(STAND_MARGIN_Z + 1) },
      { x: -(halfW + STAND_MARGIN_X + 1), z: COURT_LENGTH + STAND_MARGIN_Z + 1 },
      { x: halfW + STAND_MARGIN_X + 1, z: COURT_LENGTH + STAND_MARGIN_Z + 1 },
    ];
    for (const pos of pillarPositions) {
      for (let h = 0; h < 3; h++) {
        camera.draw_char(pos.x, 0.5 + h * 2, pos.z, PILLAR_CHAR);
      }
    }

    ctx.fillStyle = '#222';
    ctx.fillRect(155, 8, 40, 18);
    ctx.fillStyle = '#0f0';
    ctx.fillText('SET', 160, 10);
    ctx.fillText('GAM', 160, 18);
  },

  referee(state, face) {
    if (!state) return;

    const refX = COURT_WIDTH / 2 + 1.0;
    const refZ = COURT_LENGTH / 2;
    const anchor = camera.project(refX, 0, refZ);
    if (!anchor) return;

    const sx = Math.round(anchor.sx);
    const sy = Math.round(anchor.sy);

    ctx.fillStyle = '#fff';
    print('@', sx - 3, sy - 12);
    print('|', sx - 3, sy - 5);
    print('/', sx - 7, sy - 5);
    print('\\', sx + 1, sy - 5);
    print('/', sx - 6, sy + 2);
    print('\\', sx + 1, sy + 2);

    if (face) {
      ctx.fillStyle = '#ff0';
      print(face, sx - 3, sy - 12);
    }

    if (state.message && state.timer > 0) {
      ctx.fillStyle = '#ff0';
      print(state.message, 140, 20);
    }
  },


  serve_meter(charge) {
    const bar_x = 100;
    const bar_y = 28;
    const bar_w = 40;
    const bar_h = 5;

    ctx.fillStyle = '#222';
    ctx.fillRect(bar_x, bar_y, bar_w, bar_h);

    const fill = Math.max(0, Math.min(bar_w, charge * bar_w));
    if (fill > 0) {
      const color = charge < 0.4 ? '#0f0' : charge < 0.7 ? '#ff0' : '#f00';
      ctx.fillStyle = color;
      ctx.fillRect(bar_x, bar_y, fill, bar_h);
    }
  },

  menu(selected_diff) {
    ctx.fillStyle = "#fff";
    ctx.fillText("  ____  _   _   ___   _   _   _____   ___   _   _   ____", 8, 15);
    ctx.fillText(" / ___|| | | | / _ \\ | \\ | | | ____| / _ \\ | \\ | | / ___|", 8, 23);
    ctx.fillText(" \\___ \\| |_| || | | ||  \\| | |  _|  | | | ||  \\| | \\___ \\", 8, 31);
    ctx.fillText("  ___) |  _  || |_| || |\\  | | |___ | |_| || |\\  |  ___) |", 8, 39);
    ctx.fillText(" |____/|_| |_| \\___/ |_| \\_| |_____| \\___/ |_| \\_| |____/", 8, 47);
    ctx.fillText("Select Mode:", 50, 70);
    ctx.fillText((selected_diff === 1 ? " > " : "   ") + "1P EASY", 55, 80);
    ctx.fillText((selected_diff === 2 ? " > " : "   ") + "1P HARD", 55, 90);
    ctx.fillText((selected_diff === 3 ? " > " : "   ") + "2 PLAYERS", 55, 100);
    ctx.fillText((selected_diff === 4 ? " > " : "   ") + "SPECIAL MODES", 55, 110);
    ctx.fillText("Press Enter/Space to play", 40, 125);
    ctx.fillStyle = "#555";
    const ver = GIT_HASH !== 'dev' ? `${GIT_HASH} ${GIT_DATE}` : 'dev build';
    ctx.fillText(ver, 8, 128);
  },

  manual() {
    ctx.fillStyle = "#fff";
    ctx.fillText("CONTROLS", 100, 8);
    ctx.fillText("Player 1 (WASD)", 10, 22);
    ctx.fillText("W/Up: Move up", 20, 30);
    ctx.fillText("S/Down: Move down", 20, 38);
    ctx.fillText("A/Left: Move left", 20, 46);
    ctx.fillText("D/Right: Move right", 20, 54);
    ctx.fillText("Space: Hit / Confirm", 20, 62);
    ctx.fillText("E: Use item", 20, 70);
    ctx.fillText("Click: Serve toss / Hit", 20, 78);
    ctx.fillText("Up+Space: Topspin", 20, 86);
    ctx.fillText("Down+Space: Slice", 20, 94);
    ctx.fillText("Player 2 (Arrow Keys)", 120, 22);
    ctx.fillText("Enter: Hit / Confirm", 130, 30);
    ctx.fillText("Shift: Serve toss", 130, 38);
    ctx.fillText("Ctrl/Num0: Use item", 130, 46);
    ctx.fillText("Up+Enter: Topspin", 130, 54);
    ctx.fillText("Down+Enter: Slice", 130, 62);
    ctx.fillText("Press Q/Esc to go back", 60, 126);
  },

  game_over(winner, game_mode) {
    ctx.fillStyle = "#fff";
    ctx.fillText("  ____    _    __  __ _____ ", 35, 30);
    ctx.fillText(" / ___|  / \\  |  \\/  | ____|", 35, 38);
    ctx.fillText("| |  _  / _ \\ | |\\/| |  _|  ", 35, 46);
    ctx.fillText("| |_| |/ ___ \\| |  | | |___ ", 35, 54);
    ctx.fillText(" \\____/_/   \\_\\_|  |_|_____|", 35, 62);
    ctx.fillText(winner + " wins the match!", 55, 80);
    ctx.fillText("Press Enter/Space to continue", 40, 95);
  },

  // Phase 1: Rally Combo & Feedback
  rally_counter(len) {
    ctx.fillStyle = "#ff0";
    ctx.fillText("RALLY: " + len, 95, 1);
  },

  combo_indicator(combo) {
    ctx.fillStyle = "#0ff";
    ctx.fillText("COMBO x" + combo, 95, 9);
  },

  timing_feedback(fb) {
    if (!fb || fb.timer <= 0) return;
    const alpha = Math.min(1, fb.timer / 30);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fb.text === 'PERFECT' ? '#0f0' : fb.text === 'GOOD' ? '#ff0' : '#f88';
    const p = camera.project(fb.x, 1.5, fb.z);
    if (p) {
      ctx.fillText(fb.text, Math.round(p.sx) - 20, Math.round(p.sy) - 20);
    }
    ctx.globalAlpha = 1;
  },

  // Phase 2: Items
  item_box(item, frame) {
    if (!item) return;
    const blink = Math.floor((frame || 0) / 15) % 2 === 0;
    ctx.fillStyle = blink ? '#fff' : '#aaa';
    camera.draw_char(item.x, 0.01, item.z, '?');
  },

  // Phase 3: Particles & Effects
  particles(particles) {
    if (!particles || particles.length === 0) return;
    for (const p of particles) {
      ctx.fillStyle = '#fff';
      camera.draw_char(p.x, p.y, p.z, p.char);
    }
  },

  ball_trail(trail, ball) {
    if (!trail || trail.length < 2) return;
    const trail_char = (ball && ball.trail_char) || 'o';
    const trail_color = (ball && ball.trail_color) || '#ff0';
    for (let i = 0; i < trail.length - 1; i++) {
      const t = trail[i];
      const alpha = (i + 1) / trail.length * 0.6;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = trail_color;
      camera.draw_char(t.x, t.y, t.z, trail_char);
    }
    ctx.globalAlpha = 1;
  },

  speed_lines(ball) {
    if (!ball) return;
    ctx.fillStyle = '#888';
    const speed = Math.sqrt(ball.vx*ball.vx + ball.vz*ball.vz);
    if (speed > 0.4) {
      const nx = ball.vx / speed;
      const nz = ball.vz / speed;
      for (let i = 1; i <= 3; i++) {
        const sx = ball.x - nx * i * 0.3;
        const sz = ball.z - nz * i * 0.3;
        camera.draw_char(sx, ball.y, sz, '=');
      }
    }
  },

  slow_indicator() {
    ctx.fillStyle = '#44f';
    ctx.fillText("SLOW", 180, 1);
    ctx.fillStyle = 'rgba(0,0,255,0.1)';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
  },

  head_bounce(player) {
    const p = camera.project(player.x, PLAYER_EYE_Y + 0.3, player.z);
    if (p) {
      ctx.fillStyle = '#ff0';
      ctx.fillText('!', Math.round(p.sx) - 3, Math.round(p.sy) - 10);
    }
  },

  // Phase 4: Special modes & Easter eggs
  special_menu(selected) {
    ctx.fillStyle = "#fff";
    ctx.fillText("SPECIAL MODES", 50, 15);
    const modes = ["Zombie Tennis", "Target Practice", "Rally Challenge", "Gravity Shift", "Pong Mode"];
    const descriptions = [
      "Zombies chase you; hit them with the ball",
      "Hit target plates to score points",
      "Keep the rally going as long as possible",
      "Gravity direction changes periodically",
      "Classic pong-style gameplay",
    ];
    for (let i = 0; i < modes.length; i++) {
      const y = 30 + i * 14;
      ctx.fillText((selected === i ? " > " : "   ") + modes[i], 55, y);
      if (selected === i) {
        ctx.fillStyle = "#888";
        ctx.fillText(descriptions[i], 70, y + 8);
        ctx.fillStyle = "#fff";
      }
    }
    ctx.fillStyle = "#888";
    ctx.fillText("Press Q/Esc to go back", 40, 120);
  },

  zombie(z) {
    ctx.fillStyle = '#0f0';
    camera.draw_char(z.x, 0.3, z.z, 'Z');
  },

  target(t) {
    ctx.fillStyle = '#f80';
    camera.draw_char(t.x, 0.01, t.z, 'T');
    ctx.fillStyle = '#fa0';
    camera.draw_char(t.x, 0.3, t.z, '0');
  },

  gravity_indicator(dir) {
    ctx.fillStyle = '#0ff';
    let arrow = '?';
    if (dir.y < 0) arrow = '↓';
    else if (dir.y > 0) arrow = '↑';
    else if (dir.z < 0) arrow = '←';
    else if (dir.z > 0) arrow = '→';
    else if (dir.x < 0) arrow = '↙';
    else if (dir.x > 0) arrow = '↗';
    ctx.fillText("GRAVITY: " + arrow, 2, 25);
  },

  all_dead_screen() {
    ctx.fillStyle = '#f00';
    ctx.fillText("R.I.P.", 100, 60);
    ctx.fillText("All spectators have perished.", 40, 70);
    ctx.fillStyle = '#888';
    ctx.fillText("The show must go on...", 55, 80);
  },
};
