import {display, fig, row} from "../_util"

describe("webgl", () => {
  it("should support nan in line", async () => {
    const x0 = [0, 0.3, 0.6, 0.9, 0.95, 1.0]
    const x1 = [0, 0.3, NaN, 0.9, 0.95, 1.0]
    const y = [1, 0.9, 0.9, 1.0, 0.0, 1.0]

    const p0 = fig([300, 300], {output_backend: 'webgl', title: 'All finite'})
    const p1 = fig([300, 300], {output_backend: 'webgl', title: 'With NaN'})

    p0.line(x0, y)
    p1.line(x1, y)

    await display(row([p0, p1]))
  })
})
