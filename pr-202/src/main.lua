require("constants")
require("court")
require("camera")
require("input")
require("player")
require("ball")
require("ai")
require("scoring")
require("render")

function init_game()
  math.randomseed(os.time())
  court.init()

  game_state = STATE_MENU
  selected_diff = 1

  human_player = player.new(false)
  ai_player = nil
  ball_obj = ball.new()
  score = scoring.new()
  server = 0
  point_winner = nil
  point_timer = 0
  rally_hits = 0
  serve_timer = 0
end

function start_match()
  ai_player = ai.new_player(selected_diff == 1 and "easy" or "hard")

  human_player.x = 0
  human_player.z = 3
  human_player.state = PLAYER_IDLE
  human_player.hit_timer = 0

  ai_player.x = 0
  ai_player.z = COURT_LENGTH - 2
  ai_player.state = PLAYER_IDLE
  ai_player.hit_timer = 0

  score = scoring.new()
  server = 0
  rally_hits = 0

  game_state = STATE_SERVING
  setup_serve()
end

function setup_serve()
  ball_obj = ball.new()
  serve_timer = 30

  if server == 0 then
    human_player.x = (math.random() - 0.5) * 2
    human_player.z = 2
    ball_obj.x = human_player.x
    ball_obj.z = human_player.z
  else
    ai_player.x = (math.random() - 0.5) * 2
    ai_player.z = COURT_LENGTH - 2
    ball_obj.x = ai_player.x
    ball_obj.z = ai_player.z
  end
  ball_obj.y = 1.0
  ball_obj.state = BALL_HELD
end

function do_serve()
  if server == 0 then
    local serve_target_x = (math.random() - 0.5) * COURT_WIDTH * 0.8
    local serve_target_z = COURT_LENGTH * 0.7
    ball.serve(ball_obj, human_player.x, human_player.z, serve_target_x, serve_target_z)
  else
    local serve_target_x = (math.random() - 0.5) * COURT_WIDTH * 0.8
    local serve_target_z = 1 + math.random() * 3
    ball.serve(ball_obj, ai_player.x, ai_player.z, serve_target_x, serve_target_z)
  end
  game_state = STATE_PLAYING
  rally_hits = 0
end

function resolve_point(winner)
  local result = scoring.award_point(score, winner)
  point_winner = winner
  point_timer = 60
  game_state = STATE_POINT_SCORED

  if result == "game" then
    server = 1 - server
  end

  if result == "match" then
    game_state = STATE_GAME_OVER
  end
end

function update_menu()
  if input.pressed(BTN_UP) then
    selected_diff = math.max(1, selected_diff - 1)
  end
  if input.pressed(BTN_DOWN) then
    selected_diff = math.min(2, selected_diff + 1)
  end
  if input.pressed(BTN_B) then
    start_match()
  end
end

function update_serving()
  serve_timer = serve_timer - 1

  if server == 0 then
    if input.get_serve() then
      do_serve()
    end
  else
    if serve_timer <= 0 then
      do_serve()
    end
  end
end

function update_playing()
  local dx, dz = input.get_movement()
  player.move(human_player, dx, dz)
  player.update(human_player, 1)

  local shot = input.get_shot_type()
  if shot and player.can_hit(human_player, ball_obj) then
    if player.swing(human_player) then
      local target_x = (math.random() - 0.5) * COURT_WIDTH * 0.8
      local target_z = COURT_LENGTH - 1 - math.random() * 3
      ball.hit(ball_obj, human_player.x, 1.0, human_player.z, target_x, target_z, shot)
      rally_hits = rally_hits + 1
    end
  end

  local ai_action = ai.update(ai_player, ball_obj, 1)
  if ai_action then
    ball.hit(ball_obj, ai_player.x, 1.0, ai_player.z, ai_action.target_x, ai_action.target_z, ai_action.hit_type)
    rally_hits = rally_hits + 1
  end
  player.update(ai_player, 1)

  ball.update(ball_obj, 1)

  if ball_obj.state == BALL_OUT then
    if ball_obj.z < COURT_LENGTH / 2 then
      resolve_point(1)
    else
      resolve_point(0)
    end
  elseif ball_obj.state == BALL_NET then
    if ball_obj.z < COURT_LENGTH / 2 then
      resolve_point(1)
    else
      resolve_point(0)
    end
  elseif ball_obj.z > COURT_LENGTH + 1 then
    resolve_point(0)
  elseif ball_obj.z < -1 then
    resolve_point(1)
  end
end

function update_point_scored()
  point_timer = point_timer - 1
  if point_timer <= 0 then
    game_state = STATE_SERVING
    setup_serve()
  end
end

function update_game_over()
  if input.pressed(BTN_B) then
    init_game()
  end
end

function draw_game()
  cls()

  if game_state == STATE_MENU then
    render.menu(selected_diff)
    return
  end

  camera.init(human_player.x, PLAYER_EYE_Y, human_player.z)
  render.court()
  render.net()

  if ball_obj then
    render.ball(ball_obj)
  end

  render.player(human_player, "P")
  if ai_player then
    render.player(ai_player, "A")
  end

  render.hud(score)

  if game_state == STATE_SERVING then
    if server == 0 then
      print("Your serve - Press B", 50, 120)
    else
      print("AI serving...", 60, 120)
    end
  end

  if game_state == STATE_POINT_SCORED then
    local name = point_winner == 0 and "Player" or "AI"
    print("Point: " .. name, 70, 110)
  end

  if game_state == STATE_GAME_OVER then
    local winner = score.sets[1] > score.sets[2] and "Player" or "AI"
    render.game_over(winner)
  end
end

function TIC()
  input.update()

  if game_state == STATE_MENU then
    update_menu()
  elseif game_state == STATE_SERVING then
    update_serving()
  elseif game_state == STATE_PLAYING then
    update_playing()
  elseif game_state == STATE_POINT_SCORED then
    update_point_scored()
  elseif game_state == STATE_GAME_OVER then
    update_game_over()
  end

  draw_game()
end

init_game()
