// Two softened point vortices plus a weak background flow.
if (cb_data.action === "step") {
    const {dt, strength, rate, time} = cb_data
    const {x, y, speed} = particles.data
    const center_x = centers.data.x
    const center_y = centers.data.y
    const step = dt*(0.25 + 0.18*rate)
    const circulation = 0.55*strength

    for (let i = 0; i < x.length; i++) {
        const left_dx = x[i] - center_x[0]
        const left_dy = y[i] - center_y[0]
        const right_dx = x[i] - center_x[1]
        const right_dy = y[i] - center_y[1]
        const left_r2 = left_dx*left_dx + left_dy*left_dy + SOFTENING_SQUARED
        const right_r2 = right_dx*right_dx + right_dy*right_dy + SOFTENING_SQUARED

        const velocity_x = circulation*(-left_dy/left_r2 + right_dy/right_r2)
            + 0.16*Math.cos(1.6*y[i] + 0.35*time)
        const velocity_y = circulation*(left_dx/left_r2 - right_dx/right_r2)
            + 0.10*Math.sin(1.4*x[i] - 0.25*time)

        advect_particle(x, y, speed, i, velocity_x, velocity_y, step)
    }
}
