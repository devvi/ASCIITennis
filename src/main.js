import {
  STATE_MENU, STATE_SERVING, STATE_PLAYING, STATE_POINT_SCORED, STATE_GAME_OVER, STATE_VIOLATION_REPLAY,
  PLAYER_IDLE, COURT_LENGTH, COURT_WIDTH, SINGLES_WIDTH,
  BTN_UP, BTN_DOWN, BTN_B, BTN_A, BALL_HELD,
  BALL_OUT, BALL_NET, BALL_DOUBLE_BOUNCE, BALL_REPLAY,
  REPLAY_FRAME_COUNT,
  SERVE_TOSS_HEIGHT, SERVE_TOSS_DURATION, SERVE_ANGLE_MAX,
} from './constants.js';
import { court } from './court.js';
import { camera } from './camera.js';
import { createInput, KEY_MAP_P1, KEY_MAP_P2 } from './input.js';
import { player } from './player.js';
import { ball } from './ball.js';
import { ai } from './ai.js';
import { scoring } from './scoring.js';
import { render, initRender, beginFrame, print } from './render.js';
import { audience } from './audience.js';

let game_state;
let game_mode;
let selected_diff;
let human_player;
let p2_player;
let ball_obj;
let score;
let server;
let point_winner;
let point_timer;
let rally_hits;
let serve_timer;
let landing_pos;
let referee_state;
let serve_toss_started;
let serve_toss_frames;
let replay_timer;
let replay_landing_pos;
let audience_obj;
let input1;
let input2;

function init_game() {
  court.init();

  game_state = STATE_MENU;
  game_mode = "1p";
  selected_diff = 1;

  input1 = createInput(KEY_MAP_P1, true);
  input2 = createInput(KEY_MAP_P2, false);

  human_player = player.new(false);
  p2_player = null;
  ball_obj = ball.new();
  score = scoring.new();
  server = 0;
  point_winner = null;
  point_timer = 0;
  rally_hits = 0;
  serve_timer = 0;
  landing_pos = null;
  referee_state = { message: "", violation_type: null, timer: 0 };
  serve_toss_started = false;
  serve_toss_frames = 0;
  replay_timer = 0;
  replay_landing_pos = null;
  audience_obj = audience;
  audience_obj.init();
}

function start_match(mode) {
  game_mode = mode;

  if (mode === "2p") {
    p2_player = player.new(false, "back");
    human_player = player.new(false, "front");
  } else {
    p2_player = ai.new_player(selected_diff === 1 ? "easy" : "hard");
    human_player = player.new(false);
  }

  human_player.x = 0;
  human_player.z = 3;
  human_player.state = PLAYER_IDLE;
  human_player.hit_timer = 0;

  p2_player.x = 0;
  p2_player.z = COURT_LENGTH - 2;
  p2_player.state = PLAYER_IDLE;
  p2_player.hit_timer = 0;

  score = scoring.new();
  server = 0;
  rally_hits = 0;

  game_state = STATE_SERVING;
  setup_serve();
}

function setup_serve() {
  ball_obj = ball.new();
  serve_timer = 30;
  landing_pos = null;
  serve_toss_started = false;
  serve_toss_frames = 0;

  if (server === 0) {
    human_player.x = (Math.random() - 0.5) * 2;
    human_player.z = 2;
    ball_obj.x = human_player.x;
    ball_obj.z = human_player.z;
  } else {
    p2_player.x = (Math.random() - 0.5) * 2;
    p2_player.z = COURT_LENGTH - 2;
    ball_obj.x = p2_player.x;
    ball_obj.z = p2_player.z;
  }
  ball_obj.y = 1.0;
  ball_obj.state = BALL_HELD;
}

function do_serve(timing_quality, angle) {
  if (server === 0) {
    const target_x = human_player.x + angle * SERVE_ANGLE_MAX;
    const target_z = COURT_LENGTH * 0.85;
    ball.serve(ball_obj, human_player.x, human_player.z, target_x, target_z, timing_quality);
  } else {
    const target_x = p2_player.x + angle * SERVE_ANGLE_MAX;
    const target_z = 1 + Math.random() * 3;
    ball.serve(ball_obj, p2_player.x, p2_player.z, target_x, target_z, timing_quality);
  }
  game_state = STATE_PLAYING;
  rally_hits = 0;
}

function resolve_point(winner) {
  audience_obj.cheer();
  const result = scoring.award_point(score, winner);
  point_winner = winner;
  point_timer = 60;
  game_state = STATE_POINT_SCORED;

  if (result === null && score.tiebreak) {
    const total = score.points[0] + score.points[1];
    if (total % 2 === 1) {
      server = 1 - server;
    }
  }

  if (result === "game") {
    server = 1 - server;
  }

  if (result === "set") {
    server = 1 - server;
  }

  if (result === "match") {
    game_state = STATE_GAME_OVER;
  }
}

const VIOLATION_MESSAGES = {
  out: "OUT!",
  net: "NET!",
  double_bounce: "DOUBLE BOUNCE!",
};

function resolve_violation_point(violation_type, hitter) {
  audience_obj.cheer();
  const winner = 1 - hitter;
  point_winner = winner;

  ball_obj.state = BALL_REPLAY;
  replay_landing_pos = { x: ball_obj.x, z: ball_obj.z };
  replay_timer = REPLAY_FRAME_COUNT;
  game_state = STATE_VIOLATION_REPLAY;

  referee_state.message = VIOLATION_MESSAGES[violation_type] || "";
  referee_state.violation_type = violation_type;
  referee_state.timer = REPLAY_FRAME_COUNT;

  const result = scoring.resolve_violation(score, hitter, violation_type);

  if (result === null && score.tiebreak) {
    const total = score.points[0] + score.points[1];
    if (total % 2 === 1) {
      server = 1 - server;
    }
  }

  if (result === "game") {
    server = 1 - server;
  }

  if (result === "set") {
    server = 1 - server;
  }

  if (result === "match") {
    game_state = STATE_GAME_OVER;
  }
}

function update_violation_replay() {
  replay_timer -= 1;
  if (referee_state.timer > 0) {
    referee_state.timer -= 1;
  }

  ball.update(ball_obj);

  if (replay_timer <= 0) {
    referee_state.timer = 0;
    point_timer = 60;
    game_state = STATE_POINT_SCORED;
  }
}

function update_menu() {
  if (input1.pressed(BTN_UP)) {
    selected_diff = Math.max(1, selected_diff - 1);
  }
  if (input1.pressed(BTN_DOWN)) {
    selected_diff = Math.min(3, selected_diff + 1);
  }
  if (input1.pressed(BTN_B)) {
    if (selected_diff === 3) {
      start_match("2p");
    } else {
      start_match("1p");
    }
  }
}

function update_serving() {
  const curInput = server === 0 ? input1 : (game_mode === "2p" ? input2 : null);

  if (curInput) {
    if (!serve_toss_started) {
      if (curInput.pressed(BTN_A)) {
        serve_toss_started = true;
        serve_toss_frames = 0;
        ball_obj.y = 1.0;
        ball_obj.state = BALL_HELD;
      }
    } else {
      serve_toss_frames++;
      const half = SERVE_TOSS_DURATION / 2;
      if (serve_toss_frames <= half) {
        const t = serve_toss_frames / half;
        ball_obj.y = 1.0 + (SERVE_TOSS_HEIGHT - 1.0) * t;
      } else {
        const t = (serve_toss_frames - half) / half;
        ball_obj.y = SERVE_TOSS_HEIGHT - (SERVE_TOSS_HEIGHT - 1.0) * t;
      }

      if (curInput.pressed(BTN_A)) {
        const diff = Math.abs(serve_toss_frames - half);
        const timing_quality = diff <= 3 ? "s_serve" : "normal";
        const angle = curInput.get_aim_angle();
        do_serve(timing_quality, angle);
        serve_toss_started = false;
        serve_toss_frames = 0;
      } else if (ball_obj.y <= 0.8) {
        serve_toss_frames = 0;
        ball_obj.y = 1.0;
      }
    }
  } else {
    serve_timer--;
    if (serve_timer <= 0) {
      const accuracy = p2_player.ai_config.accuracy;
      const timing_quality = Math.random() < accuracy * 0.6 ? "s_serve" : "normal";
      const angle = Math.round((Math.random() - 0.5) * 2);
      do_serve(timing_quality, angle);
    }
  }
}

function update_playing() {
  const [dx, dz] = input1.get_movement();
  player.move(human_player, dx, dz);
  player.update(human_player);

  human_player.can_hit_this_frame = player.in_hit_range(human_player, ball_obj);

  const shot = input1.get_shot_type();
  if (shot && player.can_hit(human_player, ball_obj)) {
    if (player.swing(human_player)) {
      const angle = input1.get_aim_angle();
      const target_x = angle * SINGLES_WIDTH * 0.35;
      const target_z = COURT_LENGTH - 2 - Math.random() * 2;
      ball.hit(ball_obj, human_player.x, 1.0, human_player.z, target_x, target_z, shot, 0);
      rally_hits += 1;
    }
  }

  if (game_mode === "2p") {
    const [dx2, dz2] = input2.get_movement();
    player.move(p2_player, dx2, dz2);
    player.update(p2_player);

    const shot2 = input2.get_shot_type();
    if (shot2 && player.can_hit(p2_player, ball_obj)) {
      if (player.swing(p2_player)) {
        const angle2 = input2.get_aim_angle();
        const target_x2 = angle2 * SINGLES_WIDTH * 0.35;
        const target_z2 = 2 + Math.random() * 2;
        ball.hit(ball_obj, p2_player.x, 1.0, p2_player.z, target_x2, target_z2, shot2, 1);
        rally_hits += 1;
      }
    }
  } else {
    const ai_action = ai.update(p2_player, ball_obj);
    if (ai_action) {
      ball.hit(ball_obj, p2_player.x, 1.0, p2_player.z, ai_action.target_x, ai_action.target_z, ai_action.hit_type, 1);
      rally_hits += 1;
    }
    player.update(p2_player);
  }

  ball.update(ball_obj);

  landing_pos = ball.predict_landing(ball_obj);

  if (ball_obj.state === BALL_DOUBLE_BOUNCE) {
    if (ball_obj.last_hit_by !== null) {
      resolve_violation_point("double_bounce", ball_obj.last_hit_by);
    }
  } else if (ball_obj.state === BALL_OUT) {
    const hitter = rally_hits === 0 ? server : ball_obj.last_hit_by;
    if (hitter !== null) {
      resolve_violation_point("out", hitter);
    }
  } else if (ball_obj.state === BALL_NET) {
    const hitter = rally_hits === 0 ? server : ball_obj.last_hit_by;
    if (hitter !== null) {
      resolve_violation_point("net", hitter);
    }
  } else if (ball_obj.z > COURT_LENGTH + 1) {
    const hitter = rally_hits === 0 ? server : ball_obj.last_hit_by;
    if (hitter !== null) {
      resolve_violation_point("out", hitter);
    }
  } else if (ball_obj.z < -1) {
    const hitter = rally_hits === 0 ? server : ball_obj.last_hit_by;
    if (hitter !== null) {
      resolve_violation_point("out", hitter);
    }
  }
}

function update_point_scored() {
  point_timer -= 1;
  if (referee_state.timer > 0) {
    referee_state.timer -= 1;
  }
  if (point_timer <= 0) {
    referee_state.timer = 0;
    game_state = STATE_SERVING;
    setup_serve();
  }
}

function update_game_over() {
  if (input1.pressed(BTN_B)) {
    init_game();
  }
}

function draw_game() {
  beginFrame();

  if (game_state === STATE_MENU) {
    render.menu(selected_diff);
    return;
  }

  camera.init();
  render.court();
  render.net();
  render.audience(audience_obj);

  if (ball_obj) {
    render.ball(ball_obj);
  }

  render.player(human_player, "P1", game_mode);
  if (p2_player) {
    render.player(p2_player, game_mode === "2p" ? "P2" : "A", game_mode);
  }

  if (landing_pos) {
    render.landing_marker(landing_pos);
  }

  if (game_state === STATE_VIOLATION_REPLAY && replay_landing_pos) {
    render.landing_marker(replay_landing_pos);
  }

  render.hud(score, game_mode);

  if (game_state === STATE_SERVING) {
    if (server === 0) {
      if (!serve_toss_started) {
        print("Left click to serve", 35, 120);
      } else {
        print("Click to swing!", 50, 120);
      }
    } else if (game_mode === "2p") {
      if (!serve_toss_started) {
        print("P2: Press Shift to serve", 35, 120);
      } else {
        print("P2: Press Shift to swing!", 45, 120);
      }
    } else {
      print("AI serving...", 60, 120);
    }
  }

  render.referee(referee_state);

  if (game_state === STATE_POINT_SCORED) {
    const name = point_winner === 0
      ? (game_mode === "2p" ? "Player 1" : "Player")
      : (game_mode === "2p" ? "Player 2" : "AI");
    print("Point: " + name, 70, 110);
  }

  if (game_state === STATE_GAME_OVER) {
    const winner = score.sets[0] > score.sets[1]
      ? (game_mode === "2p" ? "Player 1" : "Player")
      : (game_mode === "2p" ? "Player 2" : "AI");
    render.game_over(winner, game_mode);
  }
}

function gameLoop() {
  if (game_state === STATE_MENU) {
    update_menu();
  } else if (game_state === STATE_SERVING) {
    update_serving();
  } else if (game_state === STATE_PLAYING) {
    update_playing();
  } else if (game_state === STATE_VIOLATION_REPLAY) {
    update_violation_replay();
  } else if (game_state === STATE_POINT_SCORED) {
    update_point_scored();
  } else if (game_state === STATE_GAME_OVER) {
    update_game_over();
  }

  input1.update();
  input2.update();
  audience_obj.update();
  draw_game();
  window.__gs = {
    game_state, human_x: human_player.x, human_z: human_player.z,
    human_state: human_player.state,
    ball_x: ball_obj?.x, ball_y: ball_obj?.y, ball_z: ball_obj?.z,
    ball_vx: ball_obj?.vx, ball_vy: ball_obj?.vy, ball_vz: ball_obj?.vz,
    ball_state: ball_obj?.state,
    score_sets: score?.sets, score_games: score?.games, score_points: score?.points,
    server, game_mode,
  };
  requestAnimationFrame(gameLoop);
}

const canvas = document.getElementById("game");
initRender(canvas);
init_game();
input1.init(canvas);
input2.init();
requestAnimationFrame(gameLoop);
