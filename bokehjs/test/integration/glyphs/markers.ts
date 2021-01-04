import {display, fig, row} from "../_util"

import {MarkerGL} from "@bokehjs/models/glyphs/webgl/markers"
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
          if (output_backend == "webgl" && !MarkerGL.is_supported(marker_type))
            continue
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

      function supported(marker_type: MarkerType) {
        return output_backend != "webgl" || MarkerGL.is_supported(marker_type)
      }

      let y = 0
      const X = (marker_type: MarkerType) => supported(marker_type) ? [1, 2, 3, 4, 5] : NaN
      const Y = () => [++y + 0, y + 1, y + 2, y + 3, y + 4]

      const attrs = {
        angle: [0, 30, 45, 60, 90].map((a) => radians(a)),
        size: 12,
        line_color: "navy",
        fill_color: "orange",
        alpha: 0.7,
      }

      p.asterisk(X("asterisk"), Y(), attrs)
      p.circle(X("circle"), Y(), attrs)
      p.circle_cross(X("circle_cross"), Y(), attrs)
      p.circle_dot(X("circle_dot"), Y(), attrs)
      p.circle_x(X("circle_x"), Y(), attrs)
      p.circle_y(X("circle_y"), Y(), attrs)
      p.cross(X("cross"), Y(), attrs)
      p.dash(X("dash"), Y(), attrs)
      p.diamond(X("diamond"), Y(), attrs)
      p.diamond_cross(X("diamond_cross"), Y(), attrs)
      p.diamond_dot(X("diamond_dot"), Y(), attrs)
      p.dot(X("dot"), Y(), attrs)
      p.hex(X("hex"), Y(), attrs)
      p.hex_dot(X("hex_dot"), Y(), attrs)
      p.inverted_triangle(X("inverted_triangle"), Y(), attrs)
      p.plus(X("plus"), Y(), attrs)
      p.square(X("square"), Y(), attrs)
      p.square_cross(X("square_cross"), Y(), attrs)
      p.square_dot(X("square_dot"), Y(), attrs)
      p.square_pin(X("square_pin"), Y(), attrs)
      p.square_x(X("square_x"), Y(), attrs)
      p.triangle(X("triangle"), Y(), attrs)
      p.triangle_dot(X("triangle_dot"), Y(), attrs)
      p.triangle_pin(X("triangle_pin"), Y(), attrs)
      p.x(X("x"), Y(), attrs)
      p.y(X("y"), Y(), attrs)

      const N = [...MarkerType].length
      assert(p.renderers.length == N)

      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]), [950, 650])
  })
})
