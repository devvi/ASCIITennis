import {
  STATE_MENU, STATE_SERVING, STATE_PLAYING, STATE_POINT_SCORED, STATE_GAME_OVER, STATE_VIOLATION_REPLAY,
  STATE_KILL_CAM,
  STATE_ZOMBIE_TENNIS, STATE_TARGET_PRACTICE, STATE_RALLY_CHALLENGE, STATE_GRAVITY_SHIFT, STATE_PONG_MODE,
  PLAYER_IDLE, COURT_LENGTH, COURT_WIDTH, SINGLES_WIDTH,
  BTN_UP, BTN_DOWN, BTN_B, BTN_A, BTN_X, BALL_HELD,
  BALL_OUT, BALL_NET, BALL_DOUBLE_BOUNCE, BALL_REPLAY, BALL_FLYING_OUT,
  REPLAY_FRAME_COUNT,
  KILL_CAM_DURATION,
  SERVE_TOSS_HEIGHT, SERVE_TOSS_DURATION, SERVE_ANGLE_MAX, SERVE_CHARGE_DURATION,
  RALLY_MILESTONES, SCREEN_SHAKE_DURATION, SCREEN_SHAKE_INTENSITY, COMBO_SPEED_BOOST,
  ITEM_SPAWN_INTERVAL, ITEM_COLLECT_RANGE, ITEM_LIFETIME, ITEM_TYPES, ITEM_ACTIVE_DURATION,
  MAX_PARTICLES, PARTICLE_LIFE,
  MAX_ZOMBIES, ZOMBIE_SPEED, NUM_TARGETS, TARGET_RADIUS, GRAVITY_VECTORS,
  PLAYER_EYE_Y, HIT_RANGE_H, AUDIENCE_COUNT, AI_HARD,
} from './constants.js';
import { court } from './court.js';
import { camera } from './camera.js';
import { createInput, KEY_MAP_P1, KEY_MAP_P2 } from './input.js';
import { player } from './player.js';
import { ball } from './ball.js';
import { ai } from './ai.js';
import { scoring } from './scoring.js';
import { render, initRender, beginFrame, print, activate_kill_flash, getCtx } from './render.js';
import { audience } from './audience.js';

let game_state;
let game_mode;
let selected_diff;
let selected_mode_idx;
let human_player;
let p2_player;
let ball_obj;
let second_ball;
let score;
let server;
let point_winner;
let point_timer;
let rally_hits;
let rally_length;
let combo_level;
let shake_timer;
let timing_feedback;
let serve_timer;
let landing_pos;
let referee_state;
let serve_toss_started;
let serve_toss_frames;
let serve_charge;
let replay_timer;
let replay_landing_pos;
let kill_cam_timer;
let fly_out_hitter;
let audience_obj;
let input1;
let input2;
let particles;
let items;
let item_spawn_timer;
let time_slow_active;
let time_slow_timer;
let gravity_dir_index;
let gravity_shift_timer;
let zombies;
let targets;
let target_score;
let target_respawn_timer;
let longest_rally;
let pong_active;
let pong_ball_speed;
let pong_paddle1_y;
let pong_paddle2_y;
let cheat_code_buffer;
let cheat_code_active;
let all_dead_triggered;
let referee_face;

function init_game() {
  court.init();

  game_state = STATE_MENU;
  game_mode = "1p";
  selected_diff = 1;
  selected_mode_idx = 0;

  if (!input1) {
    input1 = createInput(KEY_MAP_P1, true);
    input2 = createInput(KEY_MAP_P2, false);
    input1.init(canvas);
    input2.init();
  } else {
    input1.reset();
    input2.reset();
  }

  human_player = player.new(false);
  p2_player = null;
  ball_obj = ball.new();
  second_ball = null;
  score = scoring.new();
  server = 0;
  point_winner = null;
  point_timer = 0;
  rally_hits = 0;
  rally_length = 0;
  combo_level = 0;
  shake_timer = 0;
  timing_feedback = null;
  serve_timer = 0;
  landing_pos = null;
  referee_state = { message: "", violation_type: null, timer: 0 };
  referee_face = '--';
  serve_toss_started = false;
  serve_toss_frames = 0;
  serve_charge = 0;
  replay_timer = 0;
  replay_landing_pos = null;
  kill_cam_timer = 0;
  fly_out_hitter = null;
  audience_obj = audience;
  audience_obj.init();
  particles = [];
  items = [];
  item_spawn_timer = 0;
  time_slow_active = false;
  time_slow_timer = 0;
  gravity_dir_index = 0;
  gravity_shift_timer = 600;
  zombies = [];
  targets = [];
  target_score = 0;
  target_respawn_timer = 0;
  longest_rally = 0;
  pong_active = false;
  pong_ball_speed = 0.08;
  pong_paddle1_y = 3;
  pong_paddle2_y = 3;
  cheat_code_buffer = [];
  cheat_code_active = false;
  all_dead_triggered = false;
}

function update_special_menu() {
  const special_modes = [STATE_ZOMBIE_TENNIS, STATE_TARGET_PRACTICE, STATE_RALLY_CHALLENGE, STATE_GRAVITY_SHIFT, STATE_PONG_MODE];
  if (input1.pressed(BTN_UP)) {
    selected_mode_idx = Math.max(0, selected_mode_idx - 1);
  }
  if (input1.pressed(BTN_DOWN)) {
    selected_mode_idx = Math.min(special_modes.length - 1, selected_mode_idx + 1);
  }
  if (input1.pressed(BTN_B)) {
    start_match(special_modes[selected_mode_idx]);
  }
  if (input1.pressed(BTN_X) || input1.pressed(BTN_A)) {
    game_state = STATE_MENU;
    selected_mode_idx = 0;
  }
}

function start_match(mode) {
  game_mode = mode;

  particles = [];
  items = [];
  item_spawn_timer = 0;
  zombies = [];
  targets = [];
  target_score = 0;
  target_respawn_timer = 0;
  time_slow_active = false;
  time_slow_timer = 0;
  gravity_dir_index = 0;
  gravity_shift_timer = 600;
  second_ball = null;
  longest_rally = 0;
  pong_active = false;
  all_dead_triggered = false;
  cheat_code_active = false;
  referee_face = '--';

  if (mode === "super") {
    cheat_code_active = true;
    mode = "1p";
  }

  if (mode === STATE_PONG_MODE) {
    pong_active = true;
    pong_paddle1_y = 3;
    pong_paddle2_y = 3;
  }

  if (mode === STATE_ZOMBIE_TENNIS) {
    zombies = [];
  }

  if (mode === STATE_TARGET_PRACTICE) {
    targets = [];
    target_score = 0;
    for (let i = 0; i < NUM_TARGETS; i++) {
      targets.push({
        x: (Math.random() - 0.5) * (SINGLES_WIDTH - 1),
        z: COURT_LENGTH / 2 + 1 + Math.random() * (COURT_LENGTH / 2 - 2),
        hit: false,
        points: 10,
      });
    }
  }

  if (mode === "2p") {
    p2_player = player.new(false, "back");
    human_player = player.new(false, "front");
  } else {
    p2_player = ai.new_player(cheat_code_active ? "hard" : (selected_diff === 1 ? "easy" : "hard"));
    human_player = player.new(false);
  }

  if (cheat_code_active) {
    p2_player.ai_config = AI_HARD;
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
  rally_length = 0;
  combo_level = 0;

  game_state = STATE_SERVING;
  setup_serve();
}

function setup_serve() {
  ball_obj = ball.new();
  serve_timer = 30;
  landing_pos = null;
  serve_toss_started = false;
  serve_toss_frames = 0;
  serve_charge = 0;

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

function do_serve(timing_quality, angle, power) {
  if (server === 0) {
    const target_x = human_player.x + angle * SERVE_ANGLE_MAX;
    const target_z = COURT_LENGTH * 0.85;
    ball.serve(ball_obj, human_player.x, human_player.z, target_x, target_z, timing_quality, power);
  } else {
    const target_x = p2_player.x + angle * SERVE_ANGLE_MAX;
    const target_z = 1 + Math.random() * 3;
    ball.serve(ball_obj, p2_player.x, p2_player.z, target_x, target_z, timing_quality, power);
  }
  game_state = STATE_PLAYING;
  rally_hits = 0;
}

function resolve_point(winner) {
  audience_obj.cheer(rally_length * 10);
  const result = scoring.award_point(score, winner);
  point_winner = winner;
  point_timer = 60;
  game_state = STATE_POINT_SCORED;
  rally_length = 0;
  combo_level = 0;

  if (result === "game") {
    server = 1 - server;
  }

  if (result === "match") {
    game_state = STATE_GAME_OVER;
  }

  // Referee face
  referee_face = '^_^';
}

const VIOLATION_MESSAGES = {
  out: "OUT!",
  net: "NET!",
  double_bounce: "DOUBLE BOUNCE!",
};

function resolve_violation_point(violation_type, hitter) {
  audience_obj.cheer(rally_length * 5);
  const winner = 1 - hitter;
  point_winner = winner;
  rally_length = 0;
  combo_level = 0;

  ball_obj.state = BALL_REPLAY;
  replay_landing_pos = { x: ball_obj.x, z: ball_obj.z };
  replay_timer = REPLAY_FRAME_COUNT;
  game_state = STATE_VIOLATION_REPLAY;

  referee_state.message = VIOLATION_MESSAGES[violation_type] || "";
  referee_state.violation_type = violation_type;
  referee_state.timer = REPLAY_FRAME_COUNT;
  referee_face = 'o_O';

  const result = scoring.resolve_violation(score, hitter, violation_type);

  if (result === "game") {
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
  const menu_items = ["1P EASY", "1P HARD", "2 PLAYERS", "SPECIAL MODES"];
  const max_idx = menu_items.length;

  if (input1.pressed(BTN_UP)) {
    selected_diff = Math.max(1, selected_diff - 1);
    selected_mode_idx = Math.max(0, selected_mode_idx - 1);
  }
  if (input1.pressed(BTN_DOWN)) {
    selected_diff = Math.min(menu_items.length, selected_diff + 1);
    selected_mode_idx = Math.min(max_idx - 1, selected_mode_idx + 1);
  }
  if (input1.pressed(BTN_B)) {
    const idx = selected_mode_idx;
    if (idx === 0) {
      start_match("1p");
    } else if (idx === 1) {
      start_match("1p_hard");
    } else if (idx === 2) {
      start_match("2p");
    } else if (idx === 3) {
      game_state = "special_menu";
    }
  }

  if (cheat_code_active) {
    cheat_code_active = false;
    start_match("super");
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

      if (curInput.held(BTN_A)) {
        serve_charge = Math.min(1, serve_charge + 1 / SERVE_CHARGE_DURATION);
      }

      if (serve_charge >= 1 || curInput.released(BTN_A)) {
        const angle = curInput.get_aim_angle();
        do_serve("normal", angle, serve_charge);
        serve_toss_started = false;
        serve_toss_frames = 0;
        serve_charge = 0;
      } else if (ball_obj.y <= 0.8) {
        serve_toss_started = false;
        serve_toss_frames = 0;
        serve_charge = 0;
        ball_obj.y = 1.0;
      }
    }
  } else {
    serve_timer--;
    if (serve_timer <= 0) {
      const is_hard = selected_diff === 2;
      const charge = is_hard
        ? 0.8 + Math.random() * 0.2
        : 0.3 + Math.random() * 0.3;
      const angle = Math.round((Math.random() - 0.5) * 2);
      do_serve("normal", angle, charge);
    }
  }
}

function apply_slow() {
  return time_slow_active ? 0.5 : 1.0;
}

function update_playing() {
  const speed_mult = apply_slow();

  const [dx, dz] = input1.get_movement();
  const moved_dx = dx * speed_mult;
  const moved_dz = dz * speed_mult;
  player.move(human_player, moved_dx, moved_dz);
  player.update(human_player);

  if (input1.pressed(BTN_X)) {
    const item_type = player.use_item(human_player);
    if (item_type === ITEM_TYPES.TIME_SLOW) {
      time_slow_active = true;
      time_slow_timer = ITEM_ACTIVE_DURATION;
    }
  }

  human_player.can_hit_this_frame = player.in_hit_range(human_player, ball_obj);

  const shot = input1.get_shot_type();
  if (shot && player.can_hit(human_player, ball_obj)) {
    const timing_quality = player.swing_with_timing(human_player, ball_obj);
    if (timing_quality) {
      const angle = input1.get_aim_angle();
      const target_x = angle * SINGLES_WIDTH * 0.35;
      const target_z = COURT_LENGTH - 2 - Math.random() * 2;
      const combo_mult = 1.0 + COMBO_SPEED_BOOST * combo_level;
      const fire_mult = human_player.item_active && human_player.item === null ? 1.5 : 1.0;
      ball.hit(ball_obj, human_player.x, 1.0, human_player.z, target_x, target_z, shot, 0, combo_mult * fire_mult);

      if (human_player.item_active && human_player.item === null) {
        human_player.item_active = false;
        human_player.item_timer = 0;
      }

      rally_hits += 1;
      rally_length += 1;
      combo_level += 1;

      if (RALLY_MILESTONES.includes(rally_length)) {
        shake_timer = SCREEN_SHAKE_DURATION;
        audience_obj.cheer(rally_length * 10);
      }

      timing_feedback = {
        text: timing_quality,
        timer: 30,
        x: human_player.x,
        z: human_player.z,
      };

      // spawn particles on hit
      for (let i = 0; i < 6 && particles.length < MAX_PARTICLES; i++) {
        particles.push({
          x: ball_obj.x,
          y: ball_obj.y,
          z: ball_obj.z,
          char: ['*', '+', "'"][Math.floor(Math.random() * 3)],
          vx: (Math.random() - 0.5) * 0.2,
          vy: Math.random() * 0.2,
          vz: (Math.random() - 0.5) * 0.2,
          life: PARTICLE_LIFE,
        });
      }
    }
  }

  if (game_mode === "2p") {
    const [dx2, dz2] = input2.get_movement();
    player.move(p2_player, dx2 * speed_mult, dz2 * speed_mult);
    player.update(p2_player);

    const shot2 = input2.get_shot_type();
    if (shot2 && player.can_hit(p2_player, ball_obj)) {
      if (player.swing(p2_player)) {
        const angle2 = input2.get_aim_angle();
        const target_x2 = angle2 * SINGLES_WIDTH * 0.35;
        const target_z2 = 2 + Math.random() * 2;
        ball.hit(ball_obj, p2_player.x, 1.0, p2_player.z, target_x2, target_z2, shot2, 1);
        rally_hits += 1;
        rally_length += 1;
      }
    }
  } else {
    const ai_action = ai.update(p2_player, ball_obj);
    if (ai_action) {
      ball.hit(ball_obj, p2_player.x, 1.0, p2_player.z, ai_action.target_x, ai_action.target_z, ai_action.hit_type, 1);
      rally_hits += 1;
      rally_length += 1;
    }
    player.update(p2_player);
  }

  // Shield auto-return
  if (human_player.shield_active && ball_obj.state === BALL_IN_PLAY && ball_obj.vz > 0 && ball_obj.z > COURT_LENGTH / 2) {
    const dist = Math.sqrt(
      (human_player.x - ball_obj.x) ** 2 + (human_player.z - ball_obj.z) ** 2
    );
    if (dist < HIT_RANGE_H * 2) {
      ball.hit(ball_obj, ball_obj.x, ball_obj.y, ball_obj.z, 3, 5, 1, 1);
      human_player.shield_active = false;
      human_player.item_active = false;
      rally_length += 1;
    }
  }

  // Multi-ball update
  if (second_ball) {
    ball.update(second_ball, null);
    if (second_ball.state === BALL_DOUBLE_BOUNCE || second_ball.state === BALL_OUT || second_ball.state === BALL_NET) {
      second_ball = null;
    }
  }

  const gravity = game_mode === STATE_GRAVITY_SHIFT ? GRAVITY_VECTORS[gravity_dir_index] : null;
  ball.update(ball_obj, gravity);

  // Item collection
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.timer -= 1;
    if (item.timer <= 0) {
      items.splice(i, 1);
      continue;
    }
    if (player.can_collect_item(human_player, item) && !human_player.item) {
      player.collect_item(human_player, item.type);
      items.splice(i, 1);
    }
  }

  // Item spawn timer
  item_spawn_timer += 1;
  if (item_spawn_timer >= ITEM_SPAWN_INTERVAL && items.length < 3) {
    item_spawn_timer = 0;
    const types = Object.values(ITEM_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const halfW = COURT_WIDTH / 2 - 1;
    items.push({
      x: (Math.random() - 0.5) * halfW * 2,
      z: 2 + Math.random() * (COURT_LENGTH - 4),
      type,
      timer: ITEM_LIFETIME,
    });
  }

  landing_pos = ball.predict_landing(ball_obj);

  // Zombie mode: spawn zombie on out
  if (game_mode === STATE_ZOMBIE_TENNIS && (ball_obj.state === BALL_OUT || ball_obj.state === BALL_DOUBLE_BOUNCE) && zombies.length < MAX_ZOMBIES) {
    if (ball_obj.y < -10 || ball_obj.z > COURT_LENGTH + 20) {
      // only when ball actually leaves
    } else {
      zombies.push({
        x: ball_obj.x,
        z: ball_obj.z,
        speed: ZOMBIE_SPEED,
        active: true,
      });
    }
  }

  // Zombie movement
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zmb = zombies[i];
    if (!zmb.active) {
      zombies.splice(i, 1);
      continue;
    }
    const dx_z = human_player.x - zmb.x;
    const dz_z = human_player.z - zmb.z;
    const dist = Math.sqrt(dx_z*dx_z + dz_z*dz_z);
    if (dist < 0.5) {
      resolve_point(1);
      return;
    }
    if (dist > 0.1) {
      zmb.x += (dx_z / dist) * zmb.speed;
      zmb.z += (dz_z / dist) * zmb.speed;
    }

    // Ball hitting zombie destroys it
    if (ball_obj.state === BALL_IN_PLAY) {
      const bd = Math.sqrt((ball_obj.x - zmb.x)**2 + (ball_obj.z - zmb.z)**2);
      if (bd < 1.0) {
        zombies.splice(i, 1);
        audience_obj.cheer(30);
      }
    }
  }

  // Target practice hit detection
  if (game_mode === STATE_TARGET_PRACTICE && ball_obj.state === BALL_IN_PLAY) {
    for (let i = targets.length - 1; i >= 0; i--) {
      const t = targets[i];
      if (t.hit) continue;
      const td = Math.sqrt((ball_obj.x - t.x)**2 + (ball_obj.z - t.z)**2);
      if (td < TARGET_RADIUS) {
        target_score += t.points;
        t.hit = true;
        audience_obj.cheer(30);
        target_respawn_timer = 60;
        targets.splice(i, 1);
      }
    }
  }

  if (target_respawn_timer > 0) {
    target_respawn_timer -= 1;
    if (target_respawn_timer <= 0 && targets.length < NUM_TARGETS) {
      targets.push({
        x: (Math.random() - 0.5) * (SINGLES_WIDTH - 1),
        z: COURT_LENGTH / 2 + 1 + Math.random() * (COURT_LENGTH / 2 - 2),
        hit: false,
        points: 10,
      });
    }
  }

  // Rally challenge: no scoring
  if (game_mode === STATE_RALLY_CHALLENGE && (ball_obj.state === BALL_DOUBLE_BOUNCE || ball_obj.state === BALL_OUT || ball_obj.state === BALL_NET)) {
    if (rally_length > longest_rally) {
      longest_rally = rally_length;
    }
    rally_length = 0;
    combo_level = 0;
    game_state = STATE_SERVING;
    setup_serve();
    return;
  }

  // Gravity shift timer
  if (game_mode === STATE_GRAVITY_SHIFT) {
    gravity_shift_timer -= 1;
    if (gravity_shift_timer <= 0) {
      gravity_dir_index = (gravity_dir_index + 1) % GRAVITY_VECTORS.length;
      gravity_shift_timer = 600;
    }
  }

  if (ball_obj.state === BALL_FLYING_OUT) {
    const hitIndex = audience_obj.check_hit(ball_obj.x, ball_obj.z);
    if (hitIndex >= 0) {
      audience_obj.kill(hitIndex);
      audience_obj.cheer();
      const result = scoring.award_kill(score, fly_out_hitter);
      point_winner = fly_out_hitter;
      kill_cam_timer = KILL_CAM_DURATION;
      game_state = STATE_KILL_CAM;
      activate_kill_flash();
      if (result === "game") {
        server = 1 - server;
      }
      if (result === "match") {
        game_state = STATE_GAME_OVER;
      }
    } else if (ball_obj.y < -10 || ball_obj.z > COURT_LENGTH + 20 || ball_obj.z < -5) {
      resolve_violation_point("out", fly_out_hitter);
    }
    return;
  }

  if (ball_obj.state === BALL_DOUBLE_BOUNCE) {
    if (ball_obj.last_hit_by !== null) {
      resolve_violation_point("double_bounce", ball_obj.last_hit_by);
    }
  } else if (ball_obj.state === BALL_OUT) {
    const hitter = rally_hits === 0 ? server : ball_obj.last_hit_by;
    if (hitter !== null) {
      fly_out_hitter = hitter;
      ball_obj.state = BALL_FLYING_OUT;
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

function update_kill_cam() {
  kill_cam_timer -= 1;
  if (kill_cam_timer <= 0) {
    referee_state.timer = 0;
    point_timer = 60;
    game_state = STATE_POINT_SCORED;
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

  if (game_state === "special_menu") {
    render.special_menu(selected_mode_idx);
    return;
  }

  // Screen shake offset
  const shake_ctx = getCtx();
  if (shake_timer > 0) {
    const ox = Math.round((Math.random() - 0.5) * 2 * SCREEN_SHAKE_INTENSITY);
    const oy = Math.round((Math.random() - 0.5) * 2 * SCREEN_SHAKE_INTENSITY);
    shake_ctx.translate(ox, oy);
  }

  if (pong_active) {
    camera.init_pong();
  } else {
    camera.init();
  }

  render.venue();
  render.court();
  render.net();
  render.audience(audience_obj);

  // Items
  for (const item of items) {
    render.item_box(item);
  }

  // Targets
  for (const t of targets) {
    if (!t.hit) {
      render.target(t);
    }
  }

  // Zombies
  for (const z of zombies) {
    render.zombie(z);
  }

  if (ball_obj) {
    render.ball(ball_obj);
    if (ball_obj.trail && ball_obj.trail.length > 1) {
      render.ball_trail(ball_obj.trail);
    }
    if (ball_obj.show_speed_lines && ball_obj.state === BALL_IN_PLAY) {
      render.speed_lines(ball_obj);
    }
  }

  if (second_ball) {
    render.ball(second_ball);
    if (second_ball.trail && second_ball.trail.length > 1) {
      render.ball_trail(second_ball.trail);
    }
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

  // Particles
  render.particles(particles);

  render.hud(score, game_mode, {
    rally_length,
    combo_level,
    item: human_player.item,
    target_score: game_mode === STATE_TARGET_PRACTICE ? target_score : null,
    longest_rally: game_mode === STATE_RALLY_CHALLENGE ? longest_rally : null,
    time_slow_active,
    cheat_code_active,
    all_dead_triggered,
    game_mode,
    head_bounce: human_player.head_bounce_timer > 0,
  });

  if (game_state === STATE_SERVING) {
    if (serve_charge > 0) {
      render.serve_meter(serve_charge);
    }

    if (server === 0) {
      if (!serve_toss_started) {
        print("Click to serve (hold to charge)", 25, 120);
      } else {
        print("Release to serve!", 45, 120);
      }
    } else if (game_mode === "2p") {
      if (!serve_toss_started) {
        print("P2: Press Shift to serve", 35, 120);
      } else {
        print("P2: Release Shift to serve!", 35, 120);
      }
    } else {
      print("AI serving...", 60, 120);
    }
  }

  render.referee(referee_state, referee_face);

  // Timing feedback
  if (timing_feedback && timing_feedback.timer > 0) {
    render.timing_feedback(timing_feedback);
    timing_feedback.timer -= 1;
  }

  // Combo indicator
  if (combo_level > 1) {
    render.combo_indicator(combo_level);
  }

  // Rally counter
  if (rally_length > 0) {
    render.rally_counter(rally_length);
  }

  // Slow indicator
  if (time_slow_active) {
    render.slow_indicator();
  }

  // Head bounce
  if (human_player.head_bounce_timer > 0) {
    render.head_bounce(human_player);
  }

  // All dead screen
  if (all_dead_triggered) {
    render.all_dead_screen();
  }

  // Gravity direction indicator
  if (game_mode === STATE_GRAVITY_SHIFT) {
    render.gravity_indicator(GRAVITY_VECTORS[gravity_dir_index]);
  }

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

function check_all_dead() {
  if (audience_obj.kill_count >= AUDIENCE_COUNT && !all_dead_triggered) {
    all_dead_triggered = true;
  }
}

function check_head_bounce() {
  if (!ball_obj || ball_obj.state !== BALL_IN_PLAY) return;
  const dx = ball_obj.x - human_player.x;
  const dz = ball_obj.z - human_player.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  if (dist < 0.3 && Math.abs(ball_obj.y - PLAYER_EYE_Y) < 0.1 && Math.abs(ball_obj.vx) < 0.01 && Math.abs(ball_obj.vz) < 0.01) {
    ball_obj.vy = 0.15;
    ball_obj.vx = 0;
    ball_obj.vz = 0;
    human_player.head_bounce_timer = 10;
  }
}

function check_net_climb() {
  const mid = COURT_LENGTH / 2;
  if (input1.pressed(BTN_UP) && Math.abs(human_player.z - mid) < 1 && Math.abs(human_player.x) < 0.5 && !human_player.net_climb) {
    human_player.net_climb = true;
    human_player.net_climb_timer = 3;
    // Teleport past net
    human_player.z = human_player.z < mid ? mid + 1.5 : mid - 1.5;
  }
}

function gameLoop() {
  if (game_state === STATE_MENU) {
    update_menu();
  } else if (game_state === "special_menu") {
    update_special_menu();
  } else if (game_state === STATE_SERVING) {
    update_serving();
  } else if (game_state === STATE_PLAYING) {
    check_head_bounce();
    check_net_climb();
    update_playing();
    check_all_dead();
  } else if (game_state === STATE_VIOLATION_REPLAY) {
    update_violation_replay();
  } else if (game_state === STATE_KILL_CAM) {
    update_kill_cam();
    referee_face = '>_<';
  } else if (game_state === STATE_POINT_SCORED) {
    update_point_scored();
  } else if (game_state === STATE_GAME_OVER) {
    update_game_over();
  }

  // Particle update
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.z += p.vz;
    p.life -= 1;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }

  // Screen shake
  if (shake_timer > 0) {
    shake_timer -= 1;
  }

  // Time slow timer
  if (time_slow_active) {
    time_slow_timer -= 1;
    if (time_slow_timer <= 0) {
      time_slow_active = false;
    }
  }

  // Crowd wave
  if (rally_length > 5) {
    audience_obj.crowd_phase = 1 - audience_obj.crowd_phase;
  } else {
    audience_obj.crowd_phase = 0;
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
    server, game_mode, rally_length, combo_level,
  };
  requestAnimationFrame(gameLoop);
}

const canvas = document.getElementById("game");
initRender(canvas);
init_game();
input1.init(canvas);
input2.init();
requestAnimationFrame(gameLoop);
