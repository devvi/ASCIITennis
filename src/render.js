import { SCREEN_W, SCREEN_H, COURT_WIDTH, COURT_LENGTH, HUD_HEIGHT, STATUS_HEIGHT } from './constants.js';
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

export const render = {
  court() {
    ctx.fillStyle = "#0a0";
    ctx.fillRect(camera.offsetX, camera.offsetY, COURT_WIDTH * camera.scaleX, COURT_LENGTH * camera.scaleZ);

    ctx.fillStyle = "#fff";
    for (const line of court.lines) {
      camera.draw_line(line.x1, line.z1, line.x2, line.z2, '-');
    }
  },

  net() {
    ctx.fillStyle = "#fff";
    const half = COURT_WIDTH / 2;
    const mid = COURT_LENGTH / 2;
    camera.draw_line(-half, mid, half, mid, '=');
  },

  player(p, label) {
    if (p.can_hit_this_frame) {
      ctx.fillStyle = "#0f0";
      camera.draw_char(p.x, p.z, '*');
    }
    ctx.fillStyle = p.is_ai ? "#f00" : "#0ff";
    camera.draw_char(p.x, p.z, label);
  },

  landing_marker(pos) {
    if (!pos) return;
    ctx.fillStyle = "#ff0";
    camera.draw_char(pos.x, pos.z, 'X');
  },

  ball(b) {
    if (b.state === "in_play" || b.state === "bounce") {
      ctx.fillStyle = "#333";
      camera.draw_char(b.x, b.z, '.');
      ctx.fillStyle = "#ff0";
      if (b.y > 1.0) {
        camera.draw_char(b.x, b.z - 0.4, 'O');
      } else {
        camera.draw_char(b.x, b.z, 'o');
      }
    }
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
