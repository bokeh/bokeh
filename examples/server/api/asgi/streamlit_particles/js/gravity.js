// Semi-implicit Euler integration around two Plummer-softened attractors.
if (cb_data.action === "step") {
    const {dt, strength, rate} = cb_data
    const {x, y, vx, vy, speed} = particles.data
    const center_x = centers.data.x
    const center_y = centers.data.y
    const step = dt*(0.25 + 0.18*rate)
    const gravity = 0.42*strength

    for (let i = 0; i < x.length; i++) {
        const left_dx = x[i] - center_x[0]
        const left_dy = y[i] - center_y[0]
        const right_dx = x[i] - center_x[1]
        const right_dy = y[i] - center_y[1]
        const left_r2 = left_dx*left_dx + left_dy*left_dy + SOFTENING_SQUARED
        const right_r2 = right_dx*right_dx + right_dy*right_dy + SOFTENING_SQUARED
        const left_force = gravity/Math.pow(left_r2, 1.5)
        const right_force = gravity/Math.pow(right_r2, 1.5)

        const velocity_x = 0.998*(vx[i] - step*(left_force*left_dx + right_force*right_dx))
        const velocity_y = 0.998*(vy[i] - step*(left_force*left_dy + right_force*right_dy))
        integrate_particle(x, y, vx, vy, speed, i, velocity_x, velocity_y, step)
    }
}
