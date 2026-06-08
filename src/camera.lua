camera = {}

function camera.init(cx, cy, cz)
  camera.x = cx
  camera.y = cy
  camera.z = cz
end

function camera.project(world_x, world_y, world_z)
  local dz = world_z - camera.z
  if dz <= 0.01 then return nil end

  local dx = world_x - camera.x
  local dy = camera.y - world_y

  local scale = FOV / dz
  local sx = SCREEN_W / 2 + dx * scale
  local sy = SCREEN_H / 2 - dy * scale

  if sx < -SCREEN_W*2 or sx > SCREEN_W*3 then return nil end
  if sy < -SCREEN_H*2 or sy > SCREEN_H*3 then return nil end

  local depth = dz / (COURT_LENGTH * 1.5)
  return sx, sy, depth
end

local function depth_char(depth)
  if depth < 0 then depth = 0 end
  if depth > 1 then depth = 1 end
  local idx = math.floor(depth * (#DEPTH_CHARS - 1)) + 1
  return string.sub(DEPTH_CHARS, idx, idx)
end

function camera.project_char(world_x, world_y, world_z)
  local sx, sy, depth = camera.project(world_x, world_y, world_z)
  if sx == nil then return nil end
  return sx, sy, depth_char(depth)
end

function camera.draw_line(x1, y1, z1, x2, y2, z2)
  local p1 = {camera.project(x1, y1, z1)}
  local p2 = {camera.project(x2, y2, z2)}
  if not p1[1] or not p2[1] then return end

  local sx1, sy1, d1 = p1[1], p1[2], p1[3]
  local sx2, sy2, d2 = p2[1], p2[2], p2[3]

  local steps = math.max(1, math.abs(sx2 - sx1), math.abs(sy2 - sy1))
  if steps > 50 then steps = 50 end

  for i = 0, steps do
    local t = i / steps
    local sx = sx1 + (sx2 - sx1) * t
    local sy = sy1 + (sy2 - sy1) * t
    local depth = d1 + (d2 - d1) * t
    local ch = depth_char(depth)

    local ix = math.floor(sx + 0.5)
    local iy = math.floor(sy + 0.5)
    if ix >= 0 and ix < SCREEN_W and iy >= 0 and iy < SCREEN_H then
      print(ch, ix, iy)
    end
  end
end

function camera.draw_rect(x1, z1, x2, z2, y)
  y = y or 0
  camera.draw_line(x1, y, z1, x2, y, z1)
  camera.draw_line(x2, y, z1, x2, y, z2)
  camera.draw_line(x2, y, z2, x1, y, z2)
  camera.draw_line(x1, y, z2, x1, y, z1)
end

return camera
