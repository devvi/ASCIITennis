export const COURT_LENGTH = 23.77;
export const COURT_WIDTH = 10.97;
export const NET_HEIGHT = 0.914;
export const PLAYER_EYE_Y = 1.7;
export const BALL_RADIUS = 0.05;

export const GRAVITY = -0.006;
export const BOUNCE_FACTOR = 0.6;
export const SPIN_FACTOR = 0.003;
export const AIR_RESISTANCE = 0.005;

export const HIT_FLAT = 1;
export const HIT_TOPSPIN = 2;
export const HIT_SLICE = 3;
export const HIT_LOB = 4;

export const HIT_PARAMS = {
  [HIT_FLAT]: { speed: 0.40, arc: 0.0, spin: 0.0 },
  [HIT_TOPSPIN]: { speed: 0.35, arc: 0.6, spin: 0.8 },
  [HIT_SLICE]: { speed: 0.30, arc: -0.1, spin: -0.6 },
  [HIT_LOB]: { speed: 0.25, arc: 1.5, spin: 0.1 },
};

export const BTN_UP = 0;
export const BTN_DOWN = 1;
export const BTN_LEFT = 2;
export const BTN_RIGHT = 3;
export const BTN_A = 4;
export const BTN_B = 5;
export const BTN_X = 6;
export const BTN_Y = 7;

export const STATE_MENU = "menu";
export const STATE_SERVING = "serving";
export const STATE_PLAYING = "playing";
export const STATE_POINT_SCORED = "point_scored";
export const STATE_GAME_OVER = "game_over";
export const STATE_VIOLATION_REPLAY = "violation_replay";

export const REPLAY_FRAME_COUNT = 90;

export const PLAYER_IDLE = "idle";
export const PLAYER_MOVING = "moving";
export const PLAYER_HITTING = "hitting";

export const HIT_RANGE_H = 2.5;
export const HIT_HEIGHT_MIN = 0.1;
export const HIT_HEIGHT_MAX = 2.5;

export const PLAYER_SPEED = 0.08;

export const BALL_HELD = "held";
export const BALL_IN_PLAY = "in_play";
export const BALL_OUT = "out";
export const BALL_NET = "net";
export const BALL_BOUNCE = "bounce";
export const BALL_DOUBLE_BOUNCE = "double_bounce";
export const BALL_REPLAY = "replay";

export const VIOLATION_NONE = null;
export const VIOLATION_OUT = "out";
export const VIOLATION_NET = "net";
export const VIOLATION_DOUBLE_BOUNCE = "double_bounce";

export const POINTS = [0, 15, 30, 40];
export const GAMES_TO_WIN_SET = 6;
export const SETS_TO_WIN_MATCH = 2;

export const SCREEN_W = 240;
export const SCREEN_H = 136;
export const HUD_HEIGHT = 15;
export const STATUS_HEIGHT = 5;
export const COURT_PADDING = 4;

// Perspective camera
export const FOCAL = 120;
export const CAM_HEIGHT = 10;
export const CAM_Z = -6;
export const HORIZON_Y = 40;
export const CAM_PITCH = -0.5;

// Court colors (clay court)
export const COURT_SURFACE = '#c64830';
export const COURT_SURFACE_DARK = '#9a3520';
export const COURT_OUTSIDE = '#1a1a1a';
export const SERVICE_BOX_FILL = 'rgba(255,255,255,0.05)';
export const SINGLES_WIDTH = 8.23;
export const MAX_MOUSE_HOLD_FRAMES = 60;
export const DIRECTIONAL_ANGLE = Math.sqrt(0.5);
export const NET_POST_HEIGHT = 1.07;

// Audience
export const AUDIENCE_COUNT = 96;
export const AUDIENCE_CHEER_DURATION = 75;
export const AUDIENCE_ROWS = 4;
export const ROW_SPACING = 0.8;
export const SEAT_SPACING = 0.5;
export const STAND_MARGIN_X = 1.2;
export const STAND_MARGIN_Z = 1.5;
export const ROOF_Y = 6;
export const ROOF_CHAR = '^';
export const LIGHT_CHAR = '*';
export const PILLAR_CHAR = 'H';

// Serve (GBC-style toss)
export const SERVE_TOSS_HEIGHT = 2.5;
export const SERVE_TOSS_DURATION = 30;
export const SERVE_S_SPEED_MULT = 1.5;
export const SERVE_NORMAL_SPEED = 0.35;
export const SERVE_ANGLE_MAX = SINGLES_WIDTH * 0.4;
export const SERVE_SPEED_MAX = 0.55;
export const SERVE_SPEED_MIN = 0.25;
export const SERVE_CHARGE_DURATION = 30;

// Kill cam / fly-out
export const BALL_FLYING_OUT = "flying_out";
export const STATE_KILL_CAM = "kill_cam";
export const STATE_MANUAL = "manual";
export const KILL_RADIUS = 1.0;
export const KILL_CAM_DURATION = 30;

export const AI_EASY = {
  reaction_time: 20,
  accuracy: 0.5,
  aggression: 0.2,
  speed: 0.7,
};

export const AI_HARD = {
  reaction_time: 5,
  accuracy: 0.9,
  aggression: 0.7,
  speed: 1.0,
};

// Phase 1: Rally Combo & Feedback
export const RALLY_MILESTONES = [5, 10, 15, 20];
export const SCREEN_SHAKE_DURATION = 4;
export const SCREEN_SHAKE_INTENSITY = 2;
export const PERFECT_WINDOW = 5;
export const COMBO_SPEED_BOOST = 0.02;

// Phase 2: Power-ups & Court Items
export const ITEM_SPAWN_INTERVAL = 600;
export const ITEM_COLLECT_RANGE = 1.0;
export const ITEM_LIFETIME = 600;
export const ITEM_ACTIVE_DURATION = 300;
export const ITEM_TYPES = { FIRE: 'F', BIG_RACKET: 'B', SHIELD: 'S', MULTI_BALL: 'M', TIME_SLOW: 'T' };

// Phase 3: Particles
export const MAX_PARTICLES = 30;
export const PARTICLE_LIFE = 5;

// Phase 5: Advanced Returns (perfect timing & smash)
export const PERFECT_SPEED_MULT = 1.3;
export const SMASH_SPEED_MULT = 1.6;
export const NET_VOLLEY_RANGE = 1.5;
export const PERFECT_TRAIL_LENGTH = 8;
export const SMASH_TRAIL_LENGTH = 12;
export const PERFECT_TRAIL_COLOR = '#4f4';
export const SMASH_TRAIL_COLOR = '#f44';
export const PERFECT_TRAIL_CHAR = '*';
export const SMASH_TRAIL_CHAR = '#';
export const PERFECT_PARTICLES = 10;
export const SMASH_PARTICLES = 12;

// Phase 4: Special Game Modes
export const STATE_ZOMBIE_TENNIS = "zombie";
export const STATE_TARGET_PRACTICE = "target_practice";
export const STATE_RALLY_CHALLENGE = "rally_challenge";
export const STATE_GRAVITY_SHIFT = "gravity_shift";
export const STATE_PONG_MODE = "pong_mode";

export const MAX_ZOMBIES = 5;
export const ZOMBIE_SPEED = 0.03;
export const NUM_TARGETS = 8;
export const TARGET_RADIUS = 0.8;
export const GRAVITY_VECTORS = [
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: -1 },
  { x: 0, y: 0, z: 1 },
  { x: -1, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
];
