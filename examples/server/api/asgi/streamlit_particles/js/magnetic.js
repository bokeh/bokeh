// A two-center magnetic field bends an initially rightward particle beam.
if (cb_data.action === "step") {
    const {dt, strength, rate} = cb_data
    const {x, y, vx, vy, speed} = particles.data
    const center_x = centers.data.x
    const center_y = centers.data.y
    const step = dt*(0.25 + 0.18*rate)

    for (let i = 0; i < x.length; i++) {
        const left_dx = x[i] - center_x[0]
        const left_dy = y[i] - center_y[0]
        const right_dx = x[i] - center_x[1]
        const right_dy = y[i] - center_y[1]
        const left_r2 = left_dx*left_dx + left_dy*left_dy + SOFTENING_SQUARED
        const right_r2 = right_dx*right_dx + right_dy*right_dy + SOFTENING_SQUARED
        const magnetic_field = 0.34*strength*(1/left_r2 - 1/right_r2)
        const left_electric = 0.10*strength/Math.pow(left_r2, 1.5)
        const right_electric = 0.10*strength/Math.pow(right_r2, 1.5)
        const electric_x = left_electric*left_dx - right_electric*right_dx
        const electric_y = left_electric*left_dy - right_electric*right_dy

        const velocity_x = 0.999*(vx[i] + step*(magnetic_field*vy[i] + electric_x))
        const velocity_y = 0.999*(vy[i] + step*(-magnetic_field*vx[i] + electric_y))
        integrate_particle(x, y, vx, vy, speed, i, velocity_x, velocity_y, step)
    }
}
