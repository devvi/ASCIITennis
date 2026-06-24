input = {}

function input.init()
  input.prev = {}
  input.curr = {}
  for i = 0, 7 do
    input.prev[i] = false
    input.curr[i] = false
  end
end

function input.update()
  for i = 0, 7 do
    input.prev[i] = input.curr[i]
    input.curr[i] = btn(i)
  end
end

function input.pressed(btn_id)
  return input.curr[btn_id] and not input.prev[btn_id]
end

function input.held(btn_id)
  return input.curr[btn_id]
end

function input.released(btn_id)
  return not input.curr[btn_id] and input.prev[btn_id]
end

function input.get_movement()
  local dx, dz = 0, 0
  if input.held(BTN_LEFT) then dx = -1 end
  if input.held(BTN_RIGHT) then dx = 1 end
  if input.held(BTN_UP) then dz = -1 end
  if input.held(BTN_DOWN) then dz = 1 end
  return dx, dz
end

function input.get_shot_type()
  if not input.pressed(BTN_B) then return nil end

  if input.held(BTN_UP) then return HIT_TOPSPIN end
  if input.held(BTN_DOWN) then return HIT_SLICE end
  if input.held(BTN_LEFT) or input.held(BTN_RIGHT) then return HIT_LOB end

  return HIT_FLAT
end

function input.get_serve()
  return input.pressed(BTN_B) or input.pressed(BTN_A)
end

return input
