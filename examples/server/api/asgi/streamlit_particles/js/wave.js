// Radial displacement from the superposition of two phase-shifted waves.
if (cb_data.action === "step") {
    const {strength, rate, time} = cb_data
    const {x, y, speed} = particles.data
    const center_x = centers.data.x
    const center_y = centers.data.y
    const displacement = 0.055*strength

    for (let i = 0; i < x.length; i++) {
        const column = i % GRID_WIDTH
        const row = Math.floor(i/GRID_WIDTH)
        const base_x = X_MIN + (X_MAX - X_MIN)*column/(GRID_WIDTH - 1)
        const base_y = Y_MIN + (Y_MAX - Y_MIN)*row/(GRID_HEIGHT - 1)
        const left_dx = base_x - center_x[0]
        const left_dy = base_y - center_y[0]
        const right_dx = base_x - center_x[1]
        const right_dy = base_y - center_y[1]
        const left_distance = Math.hypot(left_dx, left_dy) + 0.001
        const right_distance = Math.hypot(right_dx, right_dy) + 0.001
        const left_phase = 4.2*left_distance - 1.35*rate*time
        const right_phase = 4.2*right_distance - 1.35*rate*time + 0.55

        x[i] = base_x + displacement*(
            Math.cos(left_phase)*left_dx/left_distance
            + Math.cos(right_phase)*right_dx/right_distance
        )
        y[i] = base_y + displacement*(
            Math.cos(left_phase)*left_dy/left_distance
            + Math.cos(right_phase)*right_dy/right_distance
        )
        speed[i] = clamp_unit(0.5 + 0.25*(Math.sin(left_phase) + Math.sin(right_phase)))
    }
}
