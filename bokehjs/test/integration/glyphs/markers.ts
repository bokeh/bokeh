import {display, fig, row} from "../utils"

import {MarkerType, OutputBackend} from "@bokehjs/core/enums"
import {Random} from "@bokehjs/core/util/random"
import {radians} from "@bokehjs/core/util/math"
import {assert} from "@bokehjs/core/util/assert"

describe("Marker glyph", () => {
  const random = new Random(1)
  const N = 10

  const x = random.floats(N)
  const y = random.floats(N)

  for (const marker_type of MarkerType) {
    it(`should support '${marker_type}' marker type`, async () => {
      function* plots() {
        for (const output_backend of OutputBackend) {
          const p = fig([150, 150], {
            output_backend,
            title: `${marker_type} - ${output_backend}`,
            x_axis_type: null,
            y_axis_type: null,
          })
          p.scatter({
            x, y, marker: marker_type, size: 14,
            line_color: "navy", fill_color: "orange", alpha: 0.5,
          })
          yield p
        }
      }
      await display(row([...plots()]), [3*150 + 50, 150 + 50])
    })
  }

  it("should support glyph methods and rotation", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 600], {output_backend, title: output_backend})

      let y = 0
      const X = [1, 2, 3, 4, 5]
      const Y = () => [++y + 0, y + 1, y + 2, y + 3, y + 4]

      const attrs = {
        angle: [0, 30, 45, 60, 90].map((a) => radians(a)),
        size: 12,
        line_color: "navy",
        fill_color: "orange",
        alpha: 0.7,
      }

      p.asterisk(X, Y(), attrs)
      p.circle(X, Y(), attrs)
      p.circle_cross(X, Y(), attrs)
      p.circle_dot(X, Y(), attrs)
      p.circle_x(X, Y(), attrs)
      p.circle_y(X, Y(), attrs)
      p.cross(X, Y(), attrs)
      p.dash(X, Y(), attrs)
      p.diamond(X, Y(), attrs)
      p.diamond_cross(X, Y(), attrs)
      p.diamond_dot(X, Y(), attrs)
      p.dot(X, Y(), attrs)
      p.hex(X, Y(), attrs)
      p.hex_dot(X, Y(), attrs)
      p.inverted_triangle(X, Y(), attrs)
      p.plus(X, Y(), attrs)
      p.square(X, Y(), attrs)
      p.square_cross(X, Y(), attrs)
      p.square_dot(X, Y(), attrs)
      p.square_pin(X, Y(), attrs)
      p.square_x(X, Y(), attrs)
      p.triangle(X, Y(), attrs)
      p.triangle_dot(X, Y(), attrs)
      p.triangle_pin(X, Y(), attrs)
      p.x(X, Y(), attrs)
      p.y(X, Y(), attrs)

      const N = [...MarkerType].length
      assert(p.renderers.length == N)

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")

    await display(row([p0, p1]), [650, 650])
  })
})
