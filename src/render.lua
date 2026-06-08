render = {}

function render.court()
  for _, line in ipairs(court.lines) do
    camera.draw_line(line.x1, 0, line.z1, line.x2, 0, line.z2)
  end
  local half = COURT_WIDTH / 2
  camera.draw_rect(-half, 0, half, COURT_LENGTH)
end

function render.net()
  local half = COURT_WIDTH / 2
  local net_z = COURT_LENGTH / 2
  local posts = 6
  for i = 0, posts do
    local t = i / posts
    local nx = -half + half * 2 * t
    local nz = net_z
    local ny0 = 0
    local ny1 = NET_HEIGHT
    camera.draw_line(nx, ny0, nz, nx, ny1, nz)
  end
  camera.draw_line(-half, NET_HEIGHT, net_z, half, NET_HEIGHT, net_z)
end

function render.player(p, label)
  if p.z < camera.z and camera.z - p.z > 2 then
    local dx = p.x - camera.x
    local dz = p.z - camera.z
    if dx * dx + dz * dz > 100 then return end
  end
  local sx, sy, ch = camera.project_char(p.x, 1.2, p.z)
  if sx then
    print(label, sx - 2, sy - 4)
  end
  local sx2, sy2, ch2 = camera.project_char(p.x, 0.1, p.z)
  if sx2 then
    print(ch2, sx2, sy2)
  end
end

function render.ball(b)
  if b.state == BALL_IN_PLAY or b.state == BALL_BOUNCE then
    local sx, sy, ch = camera.project_char(b.x, b.y, b.z)
    if sx then
      print("o", sx, sy)
      local sx2, sy2, ch2 = camera.project_char(b.x, 0, b.z)
      if sx2 then
        print(ch2, sx2, sy2)
      end
    end
  end
end

function render.hud(score)
  local display = scoring.display(score)
  print("SCORE", 2, 1)
  print("Player", 2, 9)
  print("AI", 2, 17)
  print(display, 50, 1)
  print("Games " .. score.games[1] .. "-" .. score.games[2], 2, 25)
  if score.sets[1] > 0 or score.sets[2] > 0 then
    print("Sets " .. score.sets[1] .. "-" .. score.sets[2], 2, 33)
  end
end

function render.menu(selected_diff)
  print("  ____  _   _   ___   _   _   _____   ___   _   _   ____", 8, 15)
  print(" / ___|| | | | / _ \\ | \\ | | | ____| / _ \\ | \\ | | / ___|", 8, 23)
  print(" \\___ \\| |_| || | | ||  \\| | |  _|  | | | ||  \\| | \\___ \\", 8, 31)
  print("  ___) |  _  || |_| || |\\  | | |___ | |_| || |\\  |  ___) |", 8, 39)
  print(" |____/|_| |_| \\___/ |_| \\_| |_____| \\___/ |_| \\_| |____/", 8, 47)
  print("Select AI Difficulty:", 50, 70)
  print((selected_diff == 1 and " > " or "   ") .. "EASY", 55, 80)
  print((selected_diff == 2 and " > " or "   ") .. "HARD", 55, 90)
  print("Press B to play", 55, 110)
end

function render.game_over(winner)
  print("  ____    _    __  __ _____ ", 35, 30)
  print(" / ___|  / \\  |  \\/  | ____|", 35, 38)
  print("| |  _  / _ \\ | |\\/| |  _|  ", 35, 46)
  print("| |_| |/ ___ \\| |  | | |___ ", 35, 54)
  print(" \\____/_/   \\_\\_|  |_|_____|", 35, 62)
  print(winner .. " wins the match!", 55, 80)
  print("Press B to play again", 48, 95)
end

return render
