// An analytic streamfunction gives a divergence-free, noise-like velocity field.
if (cb_data.action === "step") {
    const {dt, strength, rate, time} = cb_data
    const {x, y, speed} = particles.data
    const center_x = centers.data.x
    const center_y = centers.data.y
    const step = 0.52*dt
    const phase = 0.34*rate*time

    for (let i = 0; i < x.length; i++) {
        const left_dx = x[i] - center_x[0]
        const left_dy = y[i] - center_y[0]
        const right_dx = x[i] - center_x[1]
        const right_dy = y[i] - center_y[1]
        const left_r2 = left_dx*left_dx + left_dy*left_dy + SOFTENING_SQUARED
        const right_r2 = right_dx*right_dx + right_dy*right_dy + SOFTENING_SQUARED

        const sin_x1 = Math.sin(1.35*x[i] + phase)
        const cos_x1 = Math.cos(1.35*x[i] + phase)
        const sin_y1 = Math.sin(1.55*y[i] - 0.8*phase)
        const cos_y1 = Math.cos(1.55*y[i] - 0.8*phase)
        const sin_x2 = Math.sin(2.1*x[i] - 0.6*phase)
        const cos_x2 = Math.cos(2.1*x[i] - 0.6*phase)
        const sin_y2 = Math.sin(1.8*y[i] + 0.9*phase)
        const cos_y2 = Math.cos(1.8*y[i] + 0.9*phase)
        const swirl = 0.15*strength*(1 + 0.35*Math.sin(0.7*phase))

        const velocity_x = strength*(0.40*sin_x1*cos_y1 + 0.20*sin_x2*cos_y2)
            + swirl*(-left_dy/left_r2 + right_dy/right_r2)
        const velocity_y = -strength*(
            (0.40*1.35/1.55)*cos_x1*sin_y1 + (0.20*2.1/1.8)*cos_x2*sin_y2
        ) + swirl*(left_dx/left_r2 - right_dx/right_r2)

        advect_particle(x, y, speed, i, velocity_x, velocity_y, step)
    }
}
