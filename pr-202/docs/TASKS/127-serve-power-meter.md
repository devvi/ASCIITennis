# Task Tracking: Serve Power Meter

## Related

- Feature issue: #127
- Plan issue: #128

## Modules Impacted

- **src/constants.js** — SERVE_SPEED_MIN, SERVE_CHARGE_DURATION
- **src/ball.js** — serve() power param
- **src/main.js** — serve_charge state, charge/release logic, AI power
- **src/render.js** — serve_meter() rendering
- **tests/ball.test.js** — serve power scaling tests
- **tests/main.test.js** — charge/release tests
- **tests/render.test.js** — meter rendering tests
