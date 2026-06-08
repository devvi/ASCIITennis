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
  if p <= 3 then return tostring(POINTS[p + 1]) end
  return "40"
end

function scoring.display(s, server)
  local p0 = s.points[1]
  local p1 = s.points[2]

  if s.deuce then
    if s.advantage == 0 then return "Deuce\nAdvantage Player"
    elseif s.advantage == 1 then return "Deuce\nAdvantage AI" end
    return "Deuce"
  end

  return scoring.point_name(p0) .. " - " .. scoring.point_name(p1)
end

function scoring.award_point(s, winner)
  if s.deuce then
    if s.advantage == nil then
      s.advantage = winner
    elseif s.advantage == winner then
      s.advantage = nil
      s.deuce = false
      s.points[winner + 1] = 0
      s.points[1 - winner + 1] = 0
      return scoring.award_game(s, winner)
    else
      s.advantage = nil
    end
    return nil
  end

  local loser = 1 - winner
  s.points[winner + 1] = s.points[winner + 1] + 1

  if s.points[winner + 1] >= 4 then
    if s.points[loser + 1] <= 2 then
      return scoring.award_game(s, winner)
    end

    if s.points[loser + 1] >= 4 then
      if s.points[winner + 1] - s.points[loser + 1] >= 2 then
        return scoring.award_game(s, winner)
      else
        s.deuce = true
        s.advantage = nil
      end
    end
  end

  if s.points[winner + 1] >= 4 and s.points[winner + 1] - s.points[loser + 1] >= 2 then
    return scoring.award_game(s, winner)
  end

  return nil
end

function scoring.award_game(s, winner)
  s.points = {0, 0}
  s.games[winner + 1] = s.games[winner + 1] + 1
  s.deuce = false
  s.advantage = nil

  if s.games[winner + 1] >= GAMES_TO_WIN_SET then
    if s.games[winner + 1] - s.games[1 - winner + 1] >= 2 then
      return scoring.award_set(s, winner)
    end
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
