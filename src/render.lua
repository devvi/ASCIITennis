render = {}

function render.court()
  for _, line in ipairs(court.lines) do
    local sx1, sy1 = camera.project(line.x1, 0, line.z1)
    local sx2, sy2 = camera.project(line.x2, 0, line.z2)
    if sx1 and sx2 then
      print(".", sx1, sy1)
      print(".", sx2, sy2)
    end
  end
end

function render.net()
  local steps = 10
  for i = 0, steps do
    local t = i / steps
    local nx = court.net.x1 + (court.net.x2 - court.net.x1) * t
    local nz = court.net.z1 + (court.net.z2 - court.net.z1) * t
    for j = 0, 3 do
      local ny = (j / 3) * court.net.height
      local sx, sy, ch = camera.project_char(nx, ny, nz)
      if sx then
        print(ch or "|", sx, sy)
      end
    end
  end
end

function render.player(p, label)
  local sx, sy, ch = camera.project_char(p.x, 1.0, p.z)
  if sx then
    print(label or "P", sx, sy)
  end
end

function render.ball(b)
  if b.state == BALL_IN_PLAY or b.state == BALL_BOUNCE then
    local sx, sy, ch = camera.project_char(b.x, b.y, b.z)
    if sx then
      print(ch or "o", sx, sy)
    end
  end
end

function render.hud(score, server)
  local text = scoring.display(score, server)
  print("SCORE", 2, 2)
  print(text, 2, 10)
  print("Games: " .. score.games[1] .. "-" .. score.games[2], 2, 30)
  if score.sets[1] > 0 or score.sets[2] > 0 then
    print("Sets: " .. score.sets[1] .. "-" .. score.sets[2], 2, 38)
  end
end

function render.menu(selected_diff)
  print("=== ASCIITennis ===", 60, 30)
  print("Select Difficulty:", 60, 50)
  print("> Easy" .. (selected_diff == 1 and " <" or ""), 60, 60)
  print("> Hard" .. (selected_diff == 2 and " <" or ""), 60, 70)
  print("Press B to start", 60, 90)
end

function render.game_over(winner)
  print("=== GAME OVER ===", 60, 40)
  print(winner .. " wins!", 70, 55)
  print("Press B to play again", 50, 75)
end

return render
