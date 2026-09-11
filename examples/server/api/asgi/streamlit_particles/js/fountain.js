// Ballistic particles leave the first center and are repelled by the second.
function pseudo_random(value) {
    const raw = Math.sin(value*12.9898)*43758.5453
    return raw - Math.floor(raw)
}

if (cb_data.action === "step") {
    const {dt, strength, rate, time} = cb_data
    const {x, y, vx, vy, life, speed} = particles.data
    const center_x = centers.data.x
    const center_y = centers.data.y
    const gravity = 0.34 + 0.14*rate
    const step = 0.72*dt

    function launch(index, seed) {
        x[index] = center_x[0] + 0.035*(pseudo_random(seed + 0.17) - 0.5)
        y[index] = center_y[0] + 0.025*pseudo_random(seed + 0.83)
        vx[index] = 0.52 + 0.15*strength + 0.22*(pseudo_random(seed + 1.91) - 0.5)
        vy[index] = 0.96 + 0.25*strength + 0.22*pseudo_random(seed + 3.47)
        life[index] = 0
    }

    for (let i = 0; i < x.length; i++) {
        const deflector_dx = x[i] - center_x[1]
        const deflector_dy = y[i] - center_y[1]
        const deflector_r2 = deflector_dx*deflector_dx + deflector_dy*deflector_dy + 0.08
        const deflection = 0.10*strength/Math.pow(deflector_r2, 1.5)

        vx[i] += step*(deflection*deflector_dx + 0.035*Math.sin(1.7*y[i] + 0.8*time))
        vy[i] += step*(deflection*deflector_dy - gravity)
        x[i] += step*vx[i]
        y[i] += step*vy[i]
        life[i] += step

        const outside = x[i] < -3.1 || x[i] > 3.1 || y[i] < -2.1 || y[i] > 2.2
        if (life[i] > 4.8 || outside) launch(i, i + Math.floor(time*11))
        speed[i] = clamp_unit(Math.hypot(vx[i], vy[i])/2.2)
    }
}
