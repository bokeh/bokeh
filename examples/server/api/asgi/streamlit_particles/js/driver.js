// Keep the high-frequency animation loop beside BokehJS in the browser.
const FRAME_INTERVAL = 45

let previous = performance.now()

async function frame(now) {
    try {
        const elapsed = now - previous
        if (elapsed < FRAME_INTERVAL) return

        const data = controls.data
        const strength = data.strength[0]
        const rate = data.rate[0]
        const paused = data.paused[0]

        if (!paused) {
            await evolution.execute(controls, {
                action: "step",
                dt: Math.min(elapsed, 50)/1000,
                strength,
                rate,
                time: now/1000,
            })
            particles.change.emit()
        }
        previous = now
    } catch (error) {
        console.error("Particle simulation frame failed", error)
        previous = now
    } finally {
        requestAnimationFrame(frame)
    }
}

requestAnimationFrame(frame)
