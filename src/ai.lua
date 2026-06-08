ai = {}

function ai.new_player(difficulty)
  local p = player.new(true)
  p.ai_config = difficulty == "hard" and AI_HARD or AI_EASY
  p.reaction_counter = 0
  p.target_x = p.x
  p.target_z = p.z
  return p
end

function ai.update(ai_player, ball, dt)
  if ai_player.hit_timer > 0 then
    ai_player.hit_timer = ai_player.hit_timer - 1
    if ai_player.hit_timer <= 0 then
      ai_player.state = PLAYER_IDLE
    end
    return nil
  end

  local config = ai_player.ai_config

  if ball.state == BALL_IN_PLAY and ball.vz < 0 then
    if ai_player.reaction_counter < config.reaction_time then
      ai_player.reaction_counter = ai_player.reaction_counter + 1
    else
      local prediction_z = COURT_LENGTH - 1
      local time_to_reach = (prediction_z - ball.z) / (-ball.vz + 0.01)
      local predicted_x = ball.x + ball.vx * time_to_reach
      local accuracy_jitter = (1 - config.accuracy) * 2
      ai_player.target_x = predicted_x + (math.random() - 0.5) * accuracy_jitter
      ai_player.target_z = prediction_z
    end
  else
    ai_player.reaction_counter = 0
    ai_player.target_x = COURT_LENGTH / 2
    ai_player.target_z = COURT_LENGTH - 2
  end

  local dx = ai_player.target_x - ai_player.x
  local dz = ai_player.target_z - ai_player.z
  local dist = math.sqrt(dx*dx + dz*dz)

  if dist > 0.5 then
    local move_x = (dx / dist) * config.speed * 0.1
    local move_z = (dz / dist) * config.speed * 0.1
    player.move(ai_player, move_x * 10, move_z * 10)
    ai_player.state = PLAYER_MOVING
  else
    ai_player.state = PLAYER_IDLE
  end

  if ball.state == BALL_IN_PLAY and ball.vz > 0 and ball.z > COURT_LENGTH - 3 then
    if player.can_hit(ai_player, ball) then
      player.swing(ai_player)

      local hit_type
      local r = math.random()
      if r < config.aggression then
        hit_type = HIT_FLAT
      elseif r < config.aggression + 0.2 then
        hit_type = HIT_TOPSPIN
      elseif r < config.aggression + 0.4 then
        hit_type = HIT_SLICE
      else
        hit_type = HIT_LOB
      end

      local target_x = (math.random() - 0.5) * COURT_WIDTH * 0.6
      local target_z = 1 + math.random() * 5
      return {hit_type = hit_type, target_x = target_x, target_z = target_z}
    end
  end

  return nil
end

return ai
