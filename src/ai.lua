ai = {}

function ai.new_player(difficulty)
  local p = player.new(true)
  p.ai_config = difficulty == "hard" and AI_HARD or AI_EASY
  p.reaction_counter = 0
  p.target_x = p.x
  p.target_z = p.z
  p.has_served = false
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
  local court_center_x = 0
  local base_z = COURT_LENGTH - 2

  if ball.state == BALL_IN_PLAY then
    if ball.vz < 0 and ball.z > COURT_LENGTH * 0.4 then
      if ai_player.reaction_counter < config.reaction_time then
        ai_player.reaction_counter = ai_player.reaction_counter + 1
        ai_player.target_x = court_center_x
        ai_player.target_z = base_z
      else
        local relative_vz = -ball.vz
        if relative_vz < 0.01 then relative_vz = 0.01 end
        local time_to_reach_z = (ball.z - 2) / relative_vz
        local predicted_x = ball.x + ball.vx * time_to_reach_z * 0.8
        local jitter = (1 - config.accuracy) * 4
        ai_player.target_x = predicted_x + (math.random() - 0.5) * jitter
        local depth_offset = (1 - config.aggression) * 2
        ai_player.target_z = math.max(COURT_LENGTH * 0.6, base_z - depth_offset)
      end
    else
      ai_player.reaction_counter = 0
      local ball_dir = ball.vz > 0 and -1 or 1
      local target_z_offset = (ball.z - COURT_LENGTH / 2) * 0.3
      ai_player.target_z = base_z + target_z_offset
      ai_player.target_x = court_center_x + ball.x * 0.5
    end
  else
    ai_player.reaction_counter = 0
    ai_player.target_x = court_center_x
    ai_player.target_z = base_z
  end

  local dx = ai_player.target_x - ai_player.x
  local dz = ai_player.target_z - ai_player.z
  local dist = math.sqrt(dx*dx + dz*dz)

  local move_speed = config.speed * PLAYER_SPEED * 1.2
  if dist > 0.3 then
    local move_x = (dx / dist) * move_speed
    local move_z = (dz / dist) * move_speed
    ai_player.x = ai_player.x + move_x
    ai_player.z = ai_player.z + move_z
    local margin = 1.0
    ai_player.x = math.max(-COURT_WIDTH/2 + margin, math.min(COURT_WIDTH/2 - margin, ai_player.x))
    ai_player.z = math.max(COURT_LENGTH/2 + 0.5, math.min(COURT_LENGTH - 0.5, ai_player.z))
    ai_player.state = PLAYER_MOVING
  else
    ai_player.state = PLAYER_IDLE
  end

  if ball.state == BALL_IN_PLAY then
    local can_reach = math.abs(ball.x - ai_player.x) < 1.5
      and math.abs(ball.z - ai_player.z) < 1.5
      and ball.y < 2.5 and ball.y > 0.1
      and ball.vz > 0

    if can_reach and ai_player.state == PLAYER_IDLE then
      player.swing(ai_player)

      local r = math.random()
      local hit_type
      if r < config.aggression then
        hit_type = HIT_FLAT
      elseif r < config.aggression + 0.25 then
        hit_type = HIT_TOPSPIN
      elseif r < config.aggression + 0.45 then
        hit_type = HIT_SLICE
      else
        hit_type = HIT_LOB
      end

      local accuracy = config.accuracy
      local target_x = (math.random() - 0.5) * COURT_WIDTH * (1.2 - accuracy * 0.6)
      local target_z = 1 + math.random() * 4 * (1 - accuracy * 0.5)
      return {hit_type = hit_type, target_x = target_x, target_z = target_z}
    end
  end

  return nil
end

return ai
