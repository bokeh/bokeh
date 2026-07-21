import {expect} from "#framework/assertions"
import {display, fig, row} from "#framework/layouts"
import {require_glglyph} from "#framework/webgl"
import {range} from "@bokehjs/core/util/array"
import type {Float32Buffer} from "@bokehjs/models/glyphs/webgl/buffer"

describe("WebGL patch topology regressions", () => {
  it("should preserve antialiasing topology for a depth-8 Koch patch", async () => {
    type Point = [number, number]
    function koch(a: Point, b: Point, depth: number, points: Point[]): void {
      if (depth == 0) {
        points.push(a)
        return
      }
      const [x0, y0] = a
      const [x1, y1] = b
      const ax = x0 + (x1 - x0)/3
      const ay = y0 + (y1 - y0)/3
      const bx = x0 + 2*(x1 - x0)/3
      const by = y0 + 2*(y1 - y0)/3
      const px = (ax + bx)/2 + Math.sqrt(3)*(y0 - y1)/6
      const py = (ay + by)/2 + Math.sqrt(3)*(x1 - x0)/6
      koch(a, [ax, ay], depth - 1, points)
      koch([ax, ay], [px, py], depth - 1, points)
      koch([px, py], [bx, by], depth - 1, points)
      koch([bx, by], b, depth - 1, points)
    }
    const vertices = range(3).map((i): Point => {
      const angle = Math.PI/2 + i*2*Math.PI/3
      return [Math.cos(angle), Math.sin(angle)]
    })
    const boundary: Point[] = []
    for (let i = 0; i < 3; i++) {
      koch(vertices[i], vertices[(i + 1) % 3], 8, boundary)
    }
    expect(boundary.length).to.be.equal(3*4**8)

    const xs = boundary.map(([x]) => x)
    const ys = boundary.map(([, y]) => y)
    function koch_plot(output_backend: "canvas" | "webgl") {
      const p = fig([520, 520], {
        output_backend, x_range: [-1.1, 1.1], y_range: [-1.1, 1.1],
        x_axis_type: null, y_axis_type: null, background_fill_color: "white",
      })
      const renderer = p.patch(xs, ys, {
        fill_color: "steelblue", fill_alpha: 0.7, line_color: "navy", line_width: 1,
      })
      return {p, renderer}
    }
    const canvas = koch_plot("canvas")
    const webgl = koch_plot("webgl")
    const {view} = await display(row([canvas.p, webgl.p]))
    const webgl_view = view.owner.get_one(webgl.p)
    const gl = require_glglyph(webgl_view.owner.get_one(webgl.renderer).glyph) as unknown as {
      _nvertices: number
      _triangle_count: number
      _positions: Float32Buffer
    }
    expect(gl._nvertices).to.be.above(65_535)
    expect(gl._triangle_count).to.be.above(65_535)
    expect(gl._positions.length/2).to.be.equal(gl._nvertices)
  })
})
