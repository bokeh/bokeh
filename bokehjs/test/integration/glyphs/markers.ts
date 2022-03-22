import {display, fig, row} from "../_util"

import {HatchPattern} from "@bokehjs/core/property_mixins"
import {LineJoin, MarkerType, OutputBackend} from "@bokehjs/core/enums"
import {Random} from "@bokehjs/core/util/random"
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
      await display(row([...plots()]))
    })
  }

  it("should support glyph methods and rotation", async () => {
    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 600], {output_backend, title: output_backend})

      let y = 0
      const X = [1, 2, 3, 4, 5]
      const Y = () => [++y + 0, y + 1, y + 2, y + 3, y + 4]

      const attrs = {
        angle: [0, 30, 45, 60, 90],
        angle_units: "deg" as const,
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
      p.star(X, Y(), attrs)
      p.star_dot(X, Y(), attrs)
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
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support multiple marker types in scatter", async () => {
    const marker: MarkerType[] = [
      "asterisk", "circle", "square_dot", "triangle_pin", "star",
      "x", "diamond_cross", "star", "circle_cross", "hex_dot",
    ]

    function make_plot(output_backend: OutputBackend) {
      const p = fig([150, 150], {output_backend, title: output_backend})
      p.scatter({
        x, y, marker, size: 14,
        line_color: "navy", fill_color: "orange", alpha: 0.5,
      })
      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support hatch", async () => {
    const hatch_patterns: HatchPattern[] = [
      "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash",
      "vertical_dash", "spiral", "right_diagonal_line", "left_diagonal_line", "diagonal_cross",
      "right_diagonal_dash", "left_diagonal_dash", "horizontal_wave", "vertical_wave",
      "criss_cross", "dot", "ring", "horizontal_line", "vertical_line", "cross", "horizontal_dash",
    ]

    const markers: MarkerType[] = [
      "circle", "circle_cross", "circle_dot", "circle_x", "circle_y", "diamond", "diamond_cross",
      "diamond_dot", "hex", "hex_dot", "inverted_triangle", "square", "square_cross", "square_dot",
      "square_pin", "square_x", "star", "star_dot", "triangle", "triangle_dot", "triangle_pin",
      "plus",
    ]

    function make_plot(output_backend: OutputBackend) {
      const p = fig([300, 300], {
        output_backend, title: output_backend, x_range: [-0.5, 4.7], y_range: [-0.6, 4.6],
      })
      const n = hatch_patterns.length
      for (let i = 0; i < n; i++) {
        p.scatter({
          x: i / 5, y: i % 5, marker: markers[i], size: 45, hatch_pattern: hatch_patterns[i],
          line_color: "red", line_alpha: 0.5, line_width: 2, fill_color: "gainsboro",
          hatch_color: "blue",
        })
      }
      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })

  it("should support line join", async () => {
    const markers: MarkerType[] = [
      "diamond", "hex", "plus", "square", "square_pin", "star", "triangle", "triangle_pin",
    ]
    const line_joins: LineJoin[] = ["round", "miter", "bevel"]

    function make_plot(output_backend: OutputBackend) {
      const p = fig([175, 420], {
        output_backend, title: output_backend, x_range: [-0.05, 0.25], y_range: [-0.05, 0.76],
      })
      p.grid.visible = false
      for (let i = 0; i < markers.length; i++) {
        p.scatter({
          x: [0, 0.1, 0.2], y: 0.1*(7-i), marker: markers[i], size: 35, line_width: 7,
          line_join: line_joins, line_alpha: 0.5, fill_color: "bisque",
        })
      }
      return p
    }

    const p0 = make_plot("canvas")
    const p1 = make_plot("svg")
    const p2 = make_plot("webgl")

    await display(row([p0, p1, p2]))
  })
})
