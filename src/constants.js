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

export const VIOLATION_NONE = null;
export const VIOLATION_OUT = "out";
export const VIOLATION_NET = "net";
export const VIOLATION_DOUBLE_BOUNCE = "double_bounce";
export const VIOLATION_SERVE_FAULT = "serve_fault";

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
export const CAM_HEIGHT = 4;
export const CAM_Z = -5;
export const HORIZON_Y = 15;
export const CAM_PITCH = -0.15;

// Court colors (clay court)
export const COURT_SURFACE = '#c64830';
export const COURT_SURFACE_DARK = '#9a3520';
export const COURT_OUTSIDE = '#1a1a1a';
export const SERVICE_BOX_FILL = 'rgba(255,255,255,0.05)';
export const SINGLES_WIDTH = 8.23;
export const NET_POST_HEIGHT = 1.07;

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
