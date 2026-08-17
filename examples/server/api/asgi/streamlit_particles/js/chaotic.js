// Two vortices with time-varying circulation and an oscillating shear flow.
if (cb_data.action === "step") {
    const {dt, strength, rate, time} = cb_data
    const {x, y, speed} = particles.data
    const center_x = centers.data.x
    const center_y = centers.data.y
    const step = dt*(0.36 + 0.08*rate)
    const pulse = 0.78*Math.sin((0.65 + 0.55*rate)*time)
    const left_circulation = 0.54*strength*(1 + pulse)
    const right_circulation = 0.54*strength*(1 - pulse)

    for (let i = 0; i < x.length; i++) {
        const left_dx = x[i] - center_x[0]
        const left_dy = y[i] - center_y[0]
        const right_dx = x[i] - center_x[1]
        const right_dy = y[i] - center_y[1]
        const left_r2 = left_dx*left_dx + left_dy*left_dy + SOFTENING_SQUARED
        const right_r2 = right_dx*right_dx + right_dy*right_dy + SOFTENING_SQUARED

        const velocity_x = -left_circulation*left_dy/left_r2
            + right_circulation*right_dy/right_r2
            + 0.18*Math.sin(1.8*y[i] + 0.45*rate*time)
        const velocity_y = left_circulation*left_dx/left_r2
            - right_circulation*right_dx/right_r2
            + 0.12*Math.sin(1.5*x[i] - 0.38*rate*time)

        advect_particle(x, y, speed, i, velocity_x, velocity_y, step)
    }
}
