import {
  STATE_MENU, STATE_SERVING, STATE_PLAYING, STATE_POINT_SCORED, STATE_GAME_OVER,
  PLAYER_IDLE, COURT_LENGTH, COURT_WIDTH,
  BTN_UP, BTN_DOWN, BTN_B, BALL_HELD,
} from './constants.js';
import { court } from './court.js';
import { camera } from './camera.js';
import { input } from './input.js';
import { player } from './player.js';
import { ball } from './ball.js';
import { ai } from './ai.js';
import { scoring } from './scoring.js';
import { render, initRender, beginFrame, print } from './render.js';

let game_state;
let selected_diff;
let human_player;
let ai_player;
let ball_obj;
let score;
let server;
let point_winner;
let point_timer;
let rally_hits;
let serve_timer;
let landing_pos;

function init_game() {
  court.init();

  game_state = STATE_MENU;
  selected_diff = 1;

  human_player = player.new(false);
  ai_player = null;
  ball_obj = ball.new();
  score = scoring.new();
  server = 0;
  point_winner = null;
  point_timer = 0;
  rally_hits = 0;
  serve_timer = 0;
  landing_pos = null;
}

function start_match() {
  ai_player = ai.new_player(selected_diff === 1 ? "easy" : "hard");

  human_player.x = 0;
  human_player.z = 3;
  human_player.state = PLAYER_IDLE;
  human_player.hit_timer = 0;

  ai_player.x = 0;
  ai_player.z = COURT_LENGTH - 2;
  ai_player.state = PLAYER_IDLE;
  ai_player.hit_timer = 0;

  score = scoring.new();
  server = 0;
  rally_hits = 0;

  game_state = STATE_SERVING;
  setup_serve();
}

function setup_serve() {
  ball_obj = ball.new();
  serve_timer = 30;

  if (server === 0) {
    human_player.x = (Math.random() - 0.5) * 2;
    human_player.z = 2;
    ball_obj.x = human_player.x;
    ball_obj.z = human_player.z;
  } else {
    ai_player.x = (Math.random() - 0.5) * 2;
    ai_player.z = COURT_LENGTH - 2;
    ball_obj.x = ai_player.x;
    ball_obj.z = ai_player.z;
  }
  ball_obj.y = 1.0;
  ball_obj.state = BALL_HELD;
}

function do_serve() {
  if (server === 0) {
    const serve_target_x = (Math.random() - 0.5) * COURT_WIDTH * 0.8;
    const serve_target_z = COURT_LENGTH * 0.7;
    ball.serve(ball_obj, human_player.x, human_player.z, serve_target_x, serve_target_z);
  } else {
    const serve_target_x = (Math.random() - 0.5) * COURT_WIDTH * 0.8;
    const serve_target_z = 1 + Math.random() * 3;
    ball.serve(ball_obj, ai_player.x, ai_player.z, serve_target_x, serve_target_z);
  }
  game_state = STATE_PLAYING;
  rally_hits = 0;
}

function resolve_point(winner) {
  const result = scoring.award_point(score, winner);
  point_winner = winner;
  point_timer = 60;
  game_state = STATE_POINT_SCORED;

  if (result === "game") {
    server = 1 - server;
  }

  if (result === "match") {
    game_state = STATE_GAME_OVER;
  }
}

function update_menu() {
  if (input.pressed(BTN_UP)) {
    selected_diff = Math.max(1, selected_diff - 1);
  }
  if (input.pressed(BTN_DOWN)) {
    selected_diff = Math.min(2, selected_diff + 1);
  }
  if (input.pressed(BTN_B)) {
    start_match();
  }
}

function update_serving() {
  serve_timer -= 1;

  if (server === 0) {
    if (input.get_serve()) {
      do_serve();
    }
  } else {
    if (serve_timer <= 0) {
      do_serve();
    }
  }
}

function update_playing() {
  const [dx, dz] = input.get_movement();
  player.move(human_player, dx, dz);
  player.update(human_player);

  human_player.can_hit_this_frame = player.in_hit_range(human_player, ball_obj);

  const shot = input.get_shot_type();
  if (shot && player.can_hit(human_player, ball_obj)) {
    if (player.swing(human_player)) {
      const target_x = (Math.random() - 0.5) * COURT_WIDTH * 0.8;
      const target_z = COURT_LENGTH - 1 - Math.random() * 3;
      ball.hit(ball_obj, human_player.x, 1.0, human_player.z, target_x, target_z, shot);
      rally_hits += 1;
    }
  }

  const ai_action = ai.update(ai_player, ball_obj);
  if (ai_action) {
    ball.hit(ball_obj, ai_player.x, 1.0, ai_player.z, ai_action.target_x, ai_action.target_z, ai_action.hit_type);
    rally_hits += 1;
  }
  player.update(ai_player);

  ball.update(ball_obj);

  landing_pos = ball.predict_landing(ball_obj);

  if (ball_obj.state === "out") {
    if (ball_obj.z < COURT_LENGTH / 2) {
      resolve_point(1);
    } else {
      resolve_point(0);
    }
  } else if (ball_obj.state === "net") {
    if (ball_obj.z < COURT_LENGTH / 2) {
      resolve_point(1);
    } else {
      resolve_point(0);
    }
  } else if (ball_obj.z > COURT_LENGTH + 1) {
    resolve_point(0);
  } else if (ball_obj.z < -1) {
    resolve_point(1);
  }
}

function update_point_scored() {
  point_timer -= 1;
  if (point_timer <= 0) {
    game_state = STATE_SERVING;
    setup_serve();
  }
}

function update_game_over() {
  if (input.pressed(BTN_B)) {
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

  if (ball_obj) {
    render.ball(ball_obj);
  }

  render.player(human_player, "P");
  if (ai_player) {
    render.player(ai_player, "A");
  }

  if (landing_pos) {
    render.landing_marker(landing_pos);
  }

  render.hud(score);

  if (game_state === STATE_SERVING) {
    if (server === 0) {
      print("Your serve - Click", 50, 120);
    } else {
      print("AI serving...", 60, 120);
    }
  }

  if (game_state === STATE_POINT_SCORED) {
    const name = point_winner === 0 ? "Player" : "AI";
    print("Point: " + name, 70, 110);
  }

  if (game_state === STATE_GAME_OVER) {
    const winner = score.sets[0] > score.sets[1] ? "Player" : "AI";
    render.game_over(winner);
  }
}

function gameLoop() {
  if (game_state === STATE_MENU) {
    update_menu();
  } else if (game_state === STATE_SERVING) {
    update_serving();
  } else if (game_state === STATE_PLAYING) {
    update_playing();
  } else if (game_state === STATE_POINT_SCORED) {
    update_point_scored();
  } else if (game_state === STATE_GAME_OVER) {
    update_game_over();
  }

  input.update();
  draw_game();
  window.__gs = {
    game_state, human_x: human_player.x, human_z: human_player.z,
    human_state: human_player.state,
    ball_x: ball_obj?.x, ball_y: ball_obj?.y, ball_z: ball_obj?.z,
    ball_vx: ball_obj?.vx, ball_vy: ball_obj?.vy, ball_vz: ball_obj?.vz,
    ball_state: ball_obj?.state,
    score_sets: score?.sets, score_games: score?.games, score_points: score?.points,
    server,
  };
  requestAnimationFrame(gameLoop);
}

const canvas = document.getElementById("game");
initRender(canvas);
input.init(canvas);
init_game();
requestAnimationFrame(gameLoop);
