# Browser animation

Codex generated the JavaScript in this directory specifically for this example.
The citations in `../modes.toml` support the governing equations, but the
numerical constants, damping, speed limits, boundary handling, and time stepping
are choices made for this demo.

`driver.js` owns the `requestAnimationFrame` loop. It reads the one-row Bokeh
`ColumnDataSource`, observes the paused state, and calls the active kernel.
Python replaces the kernel's `CustomJS.code` and sends newly initialized NumPy
arrays when the mode changes or the viewer resets the simulation.

Each kernel receives two Bokeh models through `CustomJS.args`:

- `particles` contains the `x`, `y`, `vx`, `vy`, `life`, and normalized `speed`
  arrays.
- `centers` contains the two draggable field-center positions.

For each frame, the driver passes `action: "step"`, `strength`, `rate`, `time`,
and `dt` in `cb_data`. Python handles mode-specific initialization, so the
kernels only advance the simulation between resets.

Python prepends `helpers.js` to each kernel. The helper functions implement
speed limiting, periodic boundaries, and integration without allocating objects
inside the 50,000-particle loops.

Bokeh serializes the `float32` NumPy arrays for a reset as binary WebSocket
buffers. The arrays stay in the browser during animation, so particle positions
do not cross the WebSocket for each frame.
