ball = {}

function ball.new()
  return {
    x = 0, y = 1.0, z = 0,
    vx = 0, vy = 0, vz = 0,
    spin_x = 0, spin_z = 0,
    state = BALL_HELD,
    bounces = 0,
  }
end

function ball.update(b, dt)
  if b.state ~= BALL_IN_PLAY then return end

  local prev_z = b.z

  b.vx = b.vx - b.vx * AIR_RESISTANCE + b.spin_x * SPIN_FACTOR
  b.vz = b.vz - b.vz * AIR_RESISTANCE + b.spin_z * SPIN_FACTOR
  b.vy = b.vy + GRAVITY * dt

  b.x = b.x + b.vx * dt
  b.y = b.y + b.vy * dt
  b.z = b.z + b.vz * dt

  if b.y < BALL_RADIUS then
    b.y = BALL_RADIUS
    b.vy = -b.vy * BOUNCE_FACTOR
    b.vx = b.vx * 0.8
    b.vz = b.vz * 0.8
    b.bounces = b.bounces + 1
    b.state = BALL_BOUNCE

    if b.bounces > 2 then
      b.state = BALL_OUT
    end
  end

  if court.hits_net(b.x, b.z, prev_z, b.y) then
    b.state = BALL_NET
    return
  end

  if not court.is_in_bounds(b.x, b.z) then
    if b.bounces > 0 then
      b.state = BALL_OUT
    end
  end

  if b.z > COURT_LENGTH + 2 then
    b.state = BALL_OUT
  end
  if b.z < -2 then
    b.state = BALL_OUT
  end
end

function ball.serve(b, from_x, from_z, target_x, target_z, speed)
  b.x = from_x
  b.y = 1.5
  b.z = from_z
  b.vx = (target_x - from_x) * speed / 20
  b.vz = speed
  b.vy = 2.0
  b.spin_x = 0
  b.spin_z = 0
  b.bounces = 0
  b.state = BALL_IN_PLAY
end

function ball.hit(b, hit_x, hit_y, hit_z, target_x, target_z, hit_type)
  local params = HIT_PARAMS[hit_type]
  if not params then params = HIT_PARAMS[HIT_FLAT] end

  local dx = target_x - hit_x
  local dz = target_z - hit_z
  local dist = math.sqrt(dx*dx + dz*dz)
  if dist < 0.01 then dist = 0.01 end

  local speed = params.speed
  b.x = hit_x
  b.y = hit_y
  b.z = hit_z
  b.vx = (dx / dist) * speed
  b.vz = (dz / dist) * speed
  b.vy = 1.5 + params.arc * 4
  b.spin_x = math.random() * params.spin * 2 - params.spin
  b.spin_z = params.spin * 0.5
  b.bounces = 0
  b.state = BALL_IN_PLAY
end

return ball
