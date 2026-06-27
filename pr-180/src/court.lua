court = {}

function court.init()
  court.lines = {
    -- baseline player side
    {x1 = -COURT_WIDTH/2, z1 = 0, x2 = COURT_WIDTH/2, z2 = 0},
    -- baseline opponent side
    {x1 = -COURT_WIDTH/2, z1 = COURT_LENGTH, x2 = COURT_WIDTH/2, z2 = COURT_LENGTH},
    -- left sideline
    {x1 = -COURT_WIDTH/2, z1 = 0, x2 = -COURT_WIDTH/2, z2 = COURT_LENGTH},
    -- right sideline
    {x1 = COURT_WIDTH/2, z1 = 0, x2 = COURT_WIDTH/2, z2 = COURT_LENGTH},
    -- service line player side
    {x1 = -COURT_WIDTH/2, z1 = COURT_LENGTH/4, x2 = COURT_WIDTH/2, z2 = COURT_LENGTH/4},
    -- service line opponent side
    {x1 = -COURT_WIDTH/2, z1 = 3*COURT_LENGTH/4, x2 = COURT_WIDTH/2, z2 = 3*COURT_LENGTH/4},
    -- center service line
    {x1 = 0, z1 = COURT_LENGTH/4, x2 = 0, z2 = 3*COURT_LENGTH/4},
  }

  court.net = {
    x1 = -COURT_WIDTH/2, z1 = COURT_LENGTH/2,
    x2 = COURT_WIDTH/2, z2 = COURT_LENGTH/2,
    height = NET_HEIGHT,
  }
end

function court.is_in_bounds(x, z)
  return x >= -COURT_WIDTH/2 and x <= COURT_WIDTH/2
    and z >= 0 and z <= COURT_LENGTH
end

function court.is_in_player_side(z)
  return z < COURT_LENGTH / 2
end

function court.hits_net(x, z, prev_z, ball_height)
  if ball_height > NET_HEIGHT then return false end
  return (prev_z < COURT_LENGTH/2 and z >= COURT_LENGTH/2)
      or (prev_z > COURT_LENGTH/2 and z <= COURT_LENGTH/2)
end

return court
