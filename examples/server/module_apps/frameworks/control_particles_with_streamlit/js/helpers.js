// Shared, allocation-free bookkeeping for the 50,000-particle inner loops.
const GRID_WIDTH = 250
const GRID_HEIGHT = 200
const X_MIN = -3
const X_MAX = 3
const Y_MIN = -2
const Y_MAX = 2
const MAX_SPEED = 2.5
const SOFTENING_SQUARED = 0.18

function wrap(value, minimum, maximum) {
    const width = maximum - minimum
    if (value > maximum) return value - width
    if (value < minimum) return value + width
    return value
}

function clamp_unit(value) {
    return Math.max(0, Math.min(1, value))
}

function advect_particle(x, y, speed, index, velocity_x, velocity_y, dt) {
    const magnitude = Math.hypot(velocity_x, velocity_y)
    const scale = magnitude > MAX_SPEED ? MAX_SPEED/magnitude : 1
    const bounded_x = velocity_x*scale
    const bounded_y = velocity_y*scale

    x[index] = wrap(x[index] + dt*bounded_x, X_MIN, X_MAX)
    y[index] = wrap(y[index] + dt*bounded_y, Y_MIN, Y_MAX)
    speed[index] = Math.min(magnitude, MAX_SPEED)/MAX_SPEED
}

function integrate_particle(x, y, vx, vy, speed, index, velocity_x, velocity_y, dt) {
    const magnitude = Math.hypot(velocity_x, velocity_y)
    const scale = magnitude > MAX_SPEED ? MAX_SPEED/magnitude : 1
    const bounded_x = velocity_x*scale
    const bounded_y = velocity_y*scale

    vx[index] = bounded_x
    vy[index] = bounded_y
    x[index] = wrap(x[index] + dt*bounded_x, X_MIN, X_MAX)
    y[index] = wrap(y[index] + dt*bounded_y, Y_MIN, Y_MAX)
    speed[index] = Math.min(magnitude, MAX_SPEED)/MAX_SPEED
}
