camera = {}

function camera.init(cx, cy, cz)
  camera.x = cx
  camera.y = cy
  camera.z = cz
end

function camera.project(world_x, world_y, world_z)
  local dx = world_x - camera.x
  local dy = world_y - camera.y
  local dz = world_z - camera.z
  if dz <= 0 then return nil end

  local scale = FOV / dz
  local sx = SCREEN_W / 2 + dx * scale
  local sy = SCREEN_H / 2 - dy * scale

  if sx < -SCREEN_W or sx > SCREEN_W * 2 then return nil end
  if sy < -SCREEN_H or sy > SCREEN_H * 2 then return nil end

  local depth = dz / COURT_LENGTH
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

return camera
