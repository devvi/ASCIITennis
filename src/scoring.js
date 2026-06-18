import { GAMES_TO_WIN_SET, SETS_TO_WIN_MATCH, TIEBREAK_POINTS_TO_WIN } from './constants.js';

export const scoring = {
  new() {
    return {
      points: [0, 0],
      games: [0, 0],
      sets: [0, 0],
      deuce: false,
      advantage: null,
      tiebreak: false,
    };
  },

  point_name(p) {
    if (p === 0) return "0";
    if (p === 1) return "15";
    if (p === 2) return "30";
    if (p === 3) return "40";
    return "40";
  },

  display(s) {
    if (s.tiebreak) {
      return "Tiebreak: " + s.points[0] + "-" + s.points[1];
    }
    if (s.deuce) {
      if (s.advantage === 0) return "Deuce\nAd Player";
      if (s.advantage === 1) return "Deuce\nAd AI";
      return "Deuce";
    }
    const p0 = this.point_name(s.points[0]);
    const p1 = this.point_name(s.points[1]);
    if (p0 === "40" && p1 === "40" && s.points[0] === s.points[1]) {
      return "Deuce";
    }
    return p0 + " - " + p1;
  },

  award_point(s, winner) {
    // Check for tiebreaker entry: games 6-6
    if (!s.tiebreak && s.games[0] === 6 && s.games[1] === 6) {
      s.tiebreak = true;
      s.points = [0, 0];
      return "tiebreak";
    }

    if (s.tiebreak) {
      s.points[winner] += 1;
      const wp = s.points[winner];
      const lp = s.points[1 - winner];
      if (wp >= TIEBREAK_POINTS_TO_WIN && wp - lp >= 2) {
        s.tiebreak = false;
        s.games[winner] += 1;
        return this.award_set(s, winner);
      }
      return null;
    }

    if (s.deuce) {
      if (s.advantage === null) {
        s.advantage = winner;
      } else if (s.advantage === winner) {
        s.deuce = false;
        s.advantage = null;
        s.points = [0, 0];
        return this.award_game(s, winner);
      } else {
        s.advantage = null;
      }
      return null;
    }

    const loser = 1 - winner;
    s.points[winner] += 1;
    const wp = s.points[winner];
    const lp = s.points[loser];

    if (wp >= 4 && wp - lp >= 2) {
      s.points = [0, 0];
      return this.award_game(s, winner);
    }

    if (wp >= 3 && lp >= 3) {
      s.deuce = true;
      s.advantage = null;
    }

    return null;
  },

  award_game(s, winner) {
    s.games[winner] += 1;

    if (s.games[winner] >= GAMES_TO_WIN_SET
      && s.games[winner] - s.games[1 - winner] >= 2) {
      return this.award_set(s, winner);
    }

    return "game";
  },

  award_set(s, winner) {
    s.games = [0, 0];
    s.sets[winner] += 1;
    s.tiebreak = false;

    if (s.sets[winner] >= SETS_TO_WIN_MATCH) {
      return "match";
    }

    return "set";
  },

  resolve_violation(s, last_hitter, violation_type) {
    if (last_hitter === null || last_hitter === undefined) {
      return null;
    }
    const winner = 1 - last_hitter;
    return this.award_point(s, winner);
  },


  reset(s) {
    s.points = [0, 0];
    s.games = [0, 0];
    s.sets = [0, 0];
    s.deuce = false;
    s.advantage = null;
    s.tiebreak = false;
  },
};
