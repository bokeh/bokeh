import {expect} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig, row} from "#framework/layouts"
import {SeededRandom} from "#framework/random"
import {WebGLScenario, require_glglyph} from "#framework/webgl"
import {range} from "@bokehjs/core/util/array"
import type {Float32Buffer, Uint8Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Scatter} from "@bokehjs/models/glyphs/scatter"

describe("WebGL legacy interaction regressions", () => {
  it.no_image("should pan, zoom, hit test, select, and reset scatter10k", async () => {
    const n = 10_000
    const random = new SeededRandom(10)
    const x = range(n).map(() => 6*(random.float() - 0.5))
    const y = x.map((value) => Math.sin(value) + 0.4*(random.float() - 0.5))
    const p = fig([650, 420], {
      output_backend: "webgl", x_range: [-4, 4], y_range: [-2, 2],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    const renderer = p.scatter(x, y, {alpha: 0.1, size: 6})
    const {view} = await display(p)
    const renderer_view = view.owner.get_one(renderer)
    const glyph = renderer_view.glyph
    require_glglyph(glyph)

    const initial_range = [p.x_range.start, p.x_range.end, p.y_range.start, p.y_range.end]
    const scenario = new WebGLScenario(view)
    await scenario.pan(xy(0, 0), xy(0.8, -0.4))
    await scenario.zoom(xy(0, 0), 3)
    expect([p.x_range.start, p.x_range.end, p.y_range.start, p.y_range.end]).to.not.be.equal(initial_range)

    const index = 5000
    const sx = view.frame.x_scale.compute(x[index])
    const sy = view.frame.y_scale.compute(y[index])
    const hit = glyph.hit_test({type: "point", sx, sy})
    expect(hit != null && [...hit.indices].includes(index)).to.be.true

    await scenario.reset()
    const selected = [10, 20, 30, 40]
    renderer.data_source.selected.indices = selected
    await scenario.settle()

    type ScatterGLState = {_show_by_type: Map<string, Uint8Buffer>}
    const selection_gl = require_glglyph(renderer_view.selection_glyph) as unknown as ScatterGLState
    const nonselection_gl = require_glglyph(renderer_view.nonselection_glyph) as unknown as ScatterGLState
    const visible = (state: ScatterGLState) => {
      let count = 0
      for (const buffer of state._show_by_type.values()) {
        for (const show of buffer.get_array()) {
          count += show != 0 ? 1 : 0
        }
      }
      return count
    }
    expect(visible(selection_gl)).to.be.equal(selected.length)
    expect(visible(nonselection_gl)).to.be.equal(n - selected.length)
    if (typeof OffscreenCanvas != "undefined") {
      expect(view.canvas_view.webgl?.canvas instanceof OffscreenCanvas).to.be.true
    }
  })

  it.no_image("should preserve mixed-marker visuals through stream, patch, zoom, and reset", async () => {
    const n = 2_000
    const random = new SeededRandom(7)
    const markers = ["circle", "square", "triangle", "diamond", "hex", "star"]
    const source = new ColumnDataSource({data: {
      x: range(n).map(() => 4*random.float() - 2),
      y: range(n).map(() => 4*random.float() - 2),
      marker: range(n).map((i) => markers[i % markers.length]),
      size: range(n).map(() => 7),
      selected_size: range(n).map(() => 18),
      color: range(n).map((i) => i % 2 == 0 ? "#3b82f6" : "#f97316"),
    }})
    source.selected.indices = range(0, n, 199)
    const glyph = new Scatter({
      x: {field: "x"}, y: {field: "y"}, marker: {field: "marker"}, size: {field: "size"},
      fill_color: {field: "color"}, line_color: {field: "color"}, fill_alpha: 0.55, line_alpha: 0.8,
    })
    const selection_glyph = new Scatter({
      size: {field: "selected_size"}, fill_color: {field: "color"}, line_color: "white", line_width: 2,
    })
    const nonselection_glyph = new Scatter({fill_alpha: 0.55, line_alpha: 0.8})
    const renderer = new GlyphRenderer({data_source: source, glyph, selection_glyph, nonselection_glyph})
    const p = fig([650, 420], {
      output_backend: "webgl", x_range: [-3, 3], y_range: [-3, 3],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    p.renderers.push(renderer)
    const {view} = await display(p)
    const renderer_view = view.owner.get_one(renderer)
    const nonselection_gl = require_glglyph(renderer_view.nonselection_glyph) as unknown as {
      _fill_rgba: {get_array(): Uint8Array}
      _line_rgba: {get_array(): Uint8Array}
    }
    const alpha = () => ({
      fill: nonselection_gl._fill_rgba.get_array()[3],
      line: nonselection_gl._line_rgba.get_array()[3],
    })
    expect(alpha()).to.be.equal({fill: 140, line: 204})

    const scenario = new WebGLScenario(view)
    await scenario.mutate(() => {
      source.patch({marker: [[10, "star"]], size: [[10, 12]]})
      source.stream({
        x: [0.25], y: [-0.25], marker: ["hex"], size: [10], selected_size: [22], color: ["#22c55e"],
      }, n + 10)
      source.selected.indices = [10, source.length - 1]
    })
    await scenario.zoom(xy(0, 0), 2)
    await scenario.reset()

    expect(source.length).to.be.equal(n + 1)
    expect(source.selected.indices).to.be.equal([])
    expect(alpha()).to.be.equal({fill: 140, line: 204})
  })

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
