-- court dimensions (in world units)
COURT_LENGTH = 23.77
COURT_WIDTH = 10.97
NET_HEIGHT = 0.914
PLAYER_EYE_Y = 1.7
BALL_RADIUS = 0.05

-- physics
GRAVITY = -0.163
BOUNCE_FACTOR = 0.7
SPIN_FACTOR = 0.02
AIR_RESISTANCE = 0.01

-- hit types
HIT_FLAT = 1
HIT_TOPSPIN = 2
HIT_SLICE = 3
HIT_LOB = 4

-- hit parameters {speed, arc, spin}
HIT_PARAMS = {
  [HIT_FLAT] = {speed = 25, arc = 0.0, spin = 0.0},
  [HIT_TOPSPIN] = {speed = 22, arc = 0.3, spin = 0.8},
  [HIT_SLICE] = {speed = 20, arc = -0.1, spin = -0.6},
  [HIT_LOB] = {speed = 15, arc = 0.8, spin = 0.1},
}

-- button mappings
BTN_UP = 0
BTN_DOWN = 1
BTN_LEFT = 2
BTN_RIGHT = 3
BTN_A = 4
BTN_B = 5
BTN_X = 6
BTN_Y = 7

-- game states
STATE_MENU = "menu"
STATE_SERVING = "serving"
STATE_PLAYING = "playing"
STATE_POINT_SCORED = "point_scored"
STATE_GAME_OVER = "game_over"

-- player states
PLAYER_IDLE = "idle"
PLAYER_MOVING = "moving"
PLAYER_HITTING = "hitting"

-- ball states
BALL_HELD = "held"
BALL_IN_PLAY = "in_play"
BALL_OUT = "out"
BALL_NET = "net"
BALL_BOUNCE = "bounce"

-- scoring
POINTS = {0, 15, 30, 40}
GAMES_TO_WIN_SET = 6
SETS_TO_WIN_MATCH = 2

-- rendering
SCREEN_W = 240
SCREEN_H = 136
FOV = 120
DEPTH_CHARS = " .:-=+*#%@"

-- AI difficulty configs
AI_EASY = {
  reaction_time = 20,
  accuracy = 0.5,
  aggression = 0.2,
  speed = 0.7,
}

AI_HARD = {
  reaction_time = 5,
  accuracy = 0.9,
  aggression = 0.7,
  speed = 1.0,
}
