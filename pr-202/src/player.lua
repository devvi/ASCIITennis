player = {}

function player.new(is_ai)
  return {
    x = 0,
    z = is_ai and COURT_LENGTH - 2 or 3,
    state = PLAYER_IDLE,
    hit_timer = 0,
    swing_duration = 15,
    speed = PLAYER_SPEED,
    is_ai = is_ai or false,
  end
end

function player.update(p, dt)
  if p.hit_timer > 0 then
    p.hit_timer = p.hit_timer - 1
    if p.hit_timer <= 0 then
      p.state = PLAYER_IDLE
    end
  end
end

function player.move(p, dx, dz)
  local new_x = p.x + dx * p.speed
  local new_z = p.z + dz * p.speed
  local margin = 1.0

  p.x = math.max(-COURT_WIDTH/2 + margin, math.min(COURT_WIDTH/2 - margin, new_x))
  p.z = math.max(0.5, math.min(COURT_LENGTH/2 - 0.5, new_z))
end

function player.swing(p)
  if p.hit_timer > 0 then return false end
  p.state = PLAYER_HITTING
  p.hit_timer = p.swing_duration
  return true
end

function player.can_hit(p, ball)
  if p.state ~= PLAYER_IDLE then return false end
  local dx = p.x - ball.x
  local dz = p.z - ball.z
  local dy = ball.y
  local dist = math.sqrt(dx*dx + dz*dz + dy*dy)
  return dist < 1.5
end

return player
