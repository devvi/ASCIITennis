# Issue 62: 球场以及球场规则制定 (Court and Court Rules)

## Product Requirements

Refactor court boundary detection, introduce a complete tennis rule system (singles boundaries, last-hitter tracking, violation types), and add an ASCII-style referee character to announce rule violations.

## Features

1. **Fix boundary detection** — use `SINGLES_WIDTH` (8.23) for singles match boundaries instead of `COURT_WIDTH` (10.97, doubles width)
2. **Last-hitter tracking** — record which player last hit the ball, used to determine who loses the point on out/net violations
3. **Rule system** — define explicit violation types: OUT (ball lands outside singles court), NET (ball hits net on hitter's side), DOUBLE_BOUNCE (ball bounces twice on same side), SERVE_FAULT (serve lands outside service box)
4. **ASCII referee** — render a referee character near the court that displays ASCII-art judgments on rule violations
5. **Judgment display** — show violation-specific messages (e.g. "OUT!", "NET!", "DOUBLE BOUNCE!", "FAULT!") via the referee

## Acceptance Criteria

1. Boundary detection uses singles court dimensions (SINGLES_WIDTH = 8.23); ball between singles and doubles sideline is OUT
2. Every hit records the last hitter; out/net violations award the point to the opponent
3. Double bounce on the same side is detected as a violation and awards the point to the opponent
4. A referee character appears at the net post area, showing violation text during POINT_SCORED state
5. Serve must land in the opponent's service box; serves landing outside are faults
6. All existing tests pass
