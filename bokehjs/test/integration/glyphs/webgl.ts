import {display, fig, row} from "#framework/layouts"
import type {OutputBackend} from "@bokehjs/core/enums"

describe("webgl", () => {
  it("should support nan in line", async () => {
    const x0 = [0, 0.3, 0.6, 0.9, 0.95, 1.0]
    const x1 = [0, 0.3, NaN, 0.9, 0.95, 1.0]
    const y = [1, 0.9, 0.9, 1.0, 0.0, 1.0]

    const p0 = fig([300, 300], {output_backend: "webgl", title: "All finite"})
    const p1 = fig([300, 300], {output_backend: "webgl", title: "With NaN"})

    p0.line(x0, y)
    p1.line(x1, y)

    await display(row([p0, p1]))
  })

  it("should render overlapping near parallel lines", async () => {
    const dx = 0.01
    const x0 = [ 0,    0.5, 0.5, 0.5+dx, 2.0]
    const y0 = [-0.2, -0.2, 0.8, 0.4,    0.4]
    const x1 = [0, 1, 1, 1+dx, 2]
    const y1 = [0, 0, 1, 0.6,  0.6]
    const x2 = [0.0, 1.5, 1.5, 1.5-dx, 2]
    const y2 = [0.2, 0.2, 1.2, 0.8,    0.8]
    const lw = 12

    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {output_backend, title: output_backend})

      p.line(x0, y0, {line_color: "green", line_width: lw, line_join: "bevel"})
      p.line(x1, y1, {line_color: "blue", line_width: lw, line_join: "round"})
      p.line(x2, y2, {line_color: "red", line_width: lw, line_join: "miter"})

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("webgl")

    await display(row([p0, p1]))
  })

  it("should clip patch ring accumulation to the plot frame", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {
        output_backend,
        title: output_backend,
        x_range: [0, 10],
        y_range: [0, 10],
      })
      p.xgrid.visible = false
      p.ygrid.visible = false

      p.patch(
        [-2, 4, 4, -2, NaN, 12, 14, 14, 12],
        [2, 2, 8, 8, NaN, 2, 2, 8, 8],
        {fill_color: null, line_color: "navy", line_width: 8},
      )
      p.patches({
        xs: [[6, 12, 12, 6, NaN, -5, -2, -2, -5]],
        ys: [[-2, -2, 4, 4, NaN, 12, 12, 15, 15]],
        fill_color: null,
        line_color: "firebrick",
        line_width: 8,
      })

      return p
    }

    await display(row([make_plot("canvas"), make_plot("webgl")]))
  })

  it("should support zoom without NaN problems", async () => {
    // See 8th item of issue #11050.
    const x = [-1, 1, 1, -1]
    const y = [0, 0, 1, 1]

    function make_plot(output_backend: OutputBackend) {
      const p = fig([200, 200], {output_backend, title: output_backend, x_range: [0.999, 1.001]})
      p.line(x, y, {line_width: 10})
      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("webgl")

    await display(row([p0, p1]))
  })
})
