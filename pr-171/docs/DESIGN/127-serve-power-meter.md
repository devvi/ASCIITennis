# Serve Power Meter — Design

## Constants

| Constant | Value | Description |
|---|---|---|
| `SERVE_SPEED_MIN` | 0.25 | Minimum serve speed at power=0 |
| `SERVE_CHARGE_DURATION` | 45 | Frames to reach full charge |

## Data Flow

1. `update_serving()` — when human holds BTN_A, increment `serve_charge` each frame, capping at 1.0
2. On release (or at max charge), call `do_serve("normal", angle, serve_charge)`
3. `ball.serve()` accepts `power` param, interpolates speed: `SERVE_SPEED_MIN + (SERVE_SPEED_MAX - SERVE_SPEED_MIN) * power`
4. `render.serve_meter(charge)` draws horizontal bar in HUD area
5. AI: hard difficulty serves at 80-100% power, easy at 30-60%

## Modules Affected

- **constants.js** — +2 constants
- **ball.js** — `serve()` accepts power param
- **main.js** — `serve_charge` state, charge logic in `update_serving()`, pass power to `do_serve()`
- **render.js** — `serve_meter()` method
