scoring = {}

function scoring.new()
  return {
    points = {0, 0},
    games = {0, 0},
    sets = {0, 0},
    deuce = false,
    advantage = nil,
  }
end

function scoring.point_name(p)
  if p == 0 then return "0" end
  if p == 1 then return "15" end
  if p == 2 then return "30" end
  if p == 3 then return "40" end
  return "40"
end

function scoring.display(s)
  if s.deuce then
    if s.advantage == 0 then return "Deuce\nAd Player" end
    if s.advantage == 1 then return "Deuce\nAd AI" end
    return "Deuce"
  end
  local p0 = scoring.point_name(s.points[1])
  local p1 = scoring.point_name(s.points[2])
  if p0 == "40" and p1 == "40" and s.points[1] == s.points[2] then
    return "Deuce"
  end
  return p0 .. " - " .. p1
end

function scoring.award_point(s, winner)
  if s.deuce then
    if s.advantage == nil then
      s.advantage = winner
    elseif s.advantage == winner then
      s.deuce = false
      s.advantage = nil
      s.points = {0, 0}
      return scoring.award_game(s, winner)
    else
      s.advantage = nil
    end
    return nil
  end

  local loser = 1 - winner
  s.points[winner + 1] = s.points[winner + 1] + 1
  local wp = s.points[winner + 1]
  local lp = s.points[loser + 1]

  if wp >= 4 and wp - lp >= 2 then
    s.points = {0, 0}
    return scoring.award_game(s, winner)
  end

  if wp >= 3 and lp >= 3 then
    s.deuce = true
    s.advantage = nil
  end

  return nil
end

function scoring.award_game(s, winner)
  s.games[winner + 1] = s.games[winner + 1] + 1

  if s.games[winner + 1] >= GAMES_TO_WIN_SET then
    if s.games[winner + 1] - s.games[1 - winner + 1] >= 2 then
      return scoring.award_set(s, winner)
    end
    if s.games[1 - winner + 1] == GAMES_TO_WIN_SET - 1 then
      return scoring.award_set(s, winner)
    end
  end

  if s.games[winner + 1] == 6 and s.games[1 - winner + 1] <= 4 then
    return scoring.award_set(s, winner)
  end

  return "game"
end

function scoring.award_set(s, winner)
  s.games = {0, 0}
  s.sets[winner + 1] = s.sets[winner + 1] + 1

  if s.sets[winner + 1] >= SETS_TO_WIN_MATCH then
    return "match"
  end

  return "set"
end

function scoring.reset(s)
  s.points = {0, 0}
  s.games = {0, 0}
  s.sets = {0, 0}
  s.deuce = false
  s.advantage = nil
end

return scoring
