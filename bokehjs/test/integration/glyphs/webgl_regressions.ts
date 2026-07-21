import {expect} from "#framework/assertions"
import {display, fig, row} from "#framework/layouts"
import {require_glglyph} from "#framework/webgl"
import {range} from "@bokehjs/core/util/array"
import type {Float32Buffer} from "@bokehjs/models/glyphs/webgl/buffer"

describe("WebGL legacy interaction regressions", () => {
  it.no_image("should use 32-bit topology without interior artifacts for a depth-8 Koch patch", async () => {
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
    const canvas_view = view.owner.get_one(canvas.p)
    const webgl_view = view.owner.get_one(webgl.p)
    const gl = require_glglyph(webgl_view.owner.get_one(webgl.renderer).glyph) as unknown as {
      _nvertices: number
      _triangle_count: number
      _positions: Float32Buffer
    }
    expect(gl._nvertices).to.be.above(65_535)
    expect(gl._triangle_count).to.be.above(65_535)
    expect(gl._positions.length/2).to.be.equal(gl._nvertices)

    const {width, height} = canvas_view.canvas_view.primary.canvas
    const canvas_data = canvas_view.canvas_view.primary.ctx.getImageData(0, 0, width, height).data
    const webgl_data = webgl_view.canvas_view.primary.ctx.getImageData(0, 0, width, height).data
    const is_navy = (data: Uint8ClampedArray, pixel: number) => {
      const i = 4*pixel
      return data[i] < 50 && data[i + 1] < 80 && data[i + 2] > 60 && data[i + 2] < 180 && data[i + 3] > 64
    }
    const canvas_navy = new Uint8Array(width*height)
    for (let pixel = 0; pixel < canvas_navy.length; pixel++) {
      canvas_navy[pixel] = is_navy(canvas_data, pixel) ? 1 : 0
    }
    let unmatched = 0
    for (let pixel = 0; pixel < width*height; pixel++) {
      if (!is_navy(webgl_data, pixel)) {
        continue
      }
      const x = pixel % width
      const y = Math.floor(pixel/width)
      let matched = false
      for (let dy = -2; dy <= 2 && !matched; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const cx = x + dx
          const cy = y + dy
          if (cx >= 0 && cx < width && cy >= 0 && cy < height && canvas_navy[cy*width + cx] != 0) {
            matched = true
            break
          }
        }
      }
      if (!matched) {
        unmatched++
      }
    }
    expect(unmatched).to.be.below(50)
  })
})
