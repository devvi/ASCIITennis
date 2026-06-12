import { SCREEN_W, SCREEN_H, COURT_WIDTH, NET_HEIGHT, COURT_LENGTH } from './constants.js';
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
  ctx.fillStyle = "#0f0";
}

export function print(str, x, y) {
  ctx.fillText(str, x, y);
}

export const render = {
  court() {
    for (const line of court.lines) {
      camera.draw_line(line.x1, 0, line.z1, line.x2, 0, line.z2);
    }
  },

  net() {
    const half = COURT_WIDTH / 2;
    const net_z = COURT_LENGTH / 2;
    const posts = 6;
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      const nx = -half + half * 2 * t;
      const nz = net_z;
      const ny0 = 0;
      const ny1 = NET_HEIGHT;
      camera.draw_line(nx, ny0, nz, nx, ny1, nz);
    }
    camera.draw_line(-half, NET_HEIGHT, net_z, half, NET_HEIGHT, net_z);
  },

  player(p, label) {
    if (p.z < camera.z && camera.z - p.z > 2) {
      const dx = p.x - camera.x;
      const dz = p.z - camera.z;
      if (dx * dx + dz * dz > 100) return;
    }
    const pc1 = camera.project_char(p.x, 1.2, p.z);
    if (pc1) {
      print(label, pc1.sx - 2, pc1.sy - 4);
    }
    const pc2 = camera.project_char(p.x, 0.1, p.z);
    if (pc2) {
      print(pc2.ch, pc2.sx, pc2.sy);
    }
  },

  ball(b) {
    if (b.state === "in_play" || b.state === "bounce") {
      const pc = camera.project_char(b.x, b.y, b.z);
      if (pc) {
        print("o", pc.sx, pc.sy);
        const pc2 = camera.project_char(b.x, 0, b.z);
        if (pc2) {
          print(pc2.ch, pc2.sx, pc2.sy);
        }
      }
    }
  },

  hud(score) {
    const display = scoring.display(score);
    print("SCORE", 2, 1);
    print("Player", 2, 9);
    print("AI", 2, 17);
    print(display, 50, 1);
    print("Games " + score.games[0] + "-" + score.games[1], 2, 25);
    if (score.sets[0] > 0 || score.sets[1] > 0) {
      print("Sets " + score.sets[0] + "-" + score.sets[1], 2, 33);
    }
  },

  menu(selected_diff) {
    print("  ____  _   _   ___   _   _   _____   ___   _   _   ____", 8, 15);
    print(" / ___|| | | | / _ \\ | \\ | | | ____| / _ \\ | \\ | | / ___|", 8, 23);
    print(" \\___ \\| |_| || | | ||  \\| | |  _|  | | | ||  \\| | \\___ \\", 8, 31);
    print("  ___) |  _  || |_| || |\\  | | |___ | |_| || |\\  |  ___) |", 8, 39);
    print(" |____/|_| |_| \\___/ |_| \\_| |_____| \\___/ |_| \\_| |____/", 8, 47);
    print("Select AI Difficulty:", 50, 70);
    print((selected_diff === 1 ? " > " : "   ") + "EASY", 55, 80);
    print((selected_diff === 2 ? " > " : "   ") + "HARD", 55, 90);
    print("Click to play", 55, 110);
  },

  game_over(winner) {
    print("  ____    _    __  __ _____ ", 35, 30);
    print(" / ___|  / \\  |  \\/  | ____|", 35, 38);
    print("| |  _  / _ \\ | |\\/| |  _|  ", 35, 46);
    print("| |_| |/ ___ \\| |  | | |___ ", 35, 54);
    print(" \\____/_/   \\_\\_|  |_|_____|", 35, 62);
    print(winner + " wins the match!", 55, 80);
    print("Click to play again", 48, 95);
  },
};
