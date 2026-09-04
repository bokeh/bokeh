import {expect} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig, row} from "#framework/layouts"
import {WebGLScenario, require_glglyph} from "#framework/webgl"
import {range} from "@bokehjs/core/util/array"
import {LCGRandom} from "@bokehjs/core/util/random"
import type {Float32Buffer, Uint8Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Scatter} from "@bokehjs/models/glyphs/scatter"

describe("in issue #15279", () => {
  it("should preserve mixed-marker selection sizes through patch, stream, and equal-length selection changes", async () => {
    const source = ColumnDataSource.create({data: {
      x: [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5],
      y: [0.2, 1.0, -0.7, 0.8, -0.9, 0.0],
      marker: ["circle", "circle", "square", "square", "triangle", "triangle"],
      size: [12, 12, 12, 12, 12, 12],
      selected_size: [26, 26, 26, 26, 26, 26],
      color: ["#3b82f6", "#f4a261", "#55a868", "#c9a0dc", "#e76f51", "#7ec8e3"],
    }})
    source.selected.indices = [0, 2, 4]
    const glyph = Scatter.create({
      x: {field: "x"}, y: {field: "y"}, marker: {field: "marker"}, size: {field: "size"},
      fill_color: {field: "color"}, line_color: {field: "color"}, fill_alpha: 0.8,
    })
    const selection_glyph = Scatter.create({
      size: {field: "selected_size"}, fill_color: {field: "color"}, line_color: "black", line_width: 2,
    })
    const nonselection_glyph = Scatter.create({fill_alpha: 0.35, line_alpha: 0.35})
    const renderer = GlyphRenderer.create({data_source: source, glyph, selection_glyph, nonselection_glyph})
    const p = fig([450, 260], {
      output_backend: "webgl", x_range: [-3, 3], y_range: [-1.5, 1.5],
      title: "Mixed markers: streamed selection-size overrides",
    })
    p.renderers.push(renderer)
    const {view} = await display(p)
    const renderer_view = view.owner.get_one(renderer)

    type ScatterGLState = {_show_by_type: Map<string, Uint8Buffer>}
    const selection_gl = require_glglyph(renderer_view.selection_glyph) as unknown as ScatterGLState
    const nonselection_gl = require_glglyph(renderer_view.nonselection_glyph) as unknown as ScatterGLState
    function visibility(state: ScatterGLState): [string, number[]][] {
      const result: [string, number[]][] = []
      for (const [marker_type, buffer] of state._show_by_type) {
        const indices: number[] = []
        for (const [index, show] of buffer.get_array().entries()) {
          if (show != 0) {
            indices.push(index)
          }
        }
        if (indices.length != 0) {
          result.push([marker_type, indices])
        }
      }
      return result.sort(([left], [right]) => left.localeCompare(right))
    }

    expect(visibility(selection_gl)).to.be.equal([
      ["circle", [0]], ["square", [2]], ["triangle", [4]],
    ])
    expect(visibility(nonselection_gl)).to.be.equal([
      ["circle", [1]], ["square", [3]], ["triangle", [5]],
    ])

    const scenario = new WebGLScenario(view)
    await scenario.mutate(() => {
      source.patch({marker: [[0, "star"]], size: [[0, 16]]})
    })
    expect(visibility(selection_gl)).to.be.equal([
      ["square", [2]], ["star", [0]], ["triangle", [4]],
    ])
    expect(visibility(nonselection_gl)).to.be.equal([
      ["circle", [1]], ["square", [3]], ["triangle", [5]],
    ])

    await scenario.mutate(() => {
      source.stream({
        x: [0], y: [1.3], marker: ["hex"], size: [14], selected_size: [30], color: ["#8b5cf6"],
      })
    })
    expect(visibility(selection_gl)).to.be.equal([
      ["square", [2]], ["star", [0]], ["triangle", [4]],
    ])
    expect(visibility(nonselection_gl)).to.be.equal([
      ["circle", [1]], ["hex", [6]], ["square", [3]], ["triangle", [5]],
    ])

    await scenario.mutate(() => {
      source.selected.indices = [1, 3, 6]
    })
    expect(visibility(selection_gl)).to.be.equal([
      ["circle", [1]], ["hex", [6]], ["square", [3]],
    ])
    expect(visibility(nonselection_gl)).to.be.equal([
      ["square", [2]], ["star", [0]], ["triangle", [4, 5]],
    ])
  })

  it.no_image("should preserve mixed-marker visuals through stream, patch, zoom, and reset", async () => {
    const n = 2_000
    const random = new LCGRandom(7)
    const markers = ["circle", "square", "triangle", "diamond", "hex", "star"]
    const source = ColumnDataSource.create({data: {
      x: range(n).map(() => 4*random.float() - 2),
      y: range(n).map(() => 4*random.float() - 2),
      marker: range(n).map((i) => markers[i % markers.length]),
      size: range(n).map(() => 7),
      selected_size: range(n).map(() => 18),
      color: range(n).map((i) => i % 2 == 0 ? "#3b82f6" : "#f97316"),
    }})
    source.selected.indices = range(0, n, 199)
    const glyph = Scatter.create({
      x: {field: "x"}, y: {field: "y"}, marker: {field: "marker"}, size: {field: "size"},
      fill_color: {field: "color"}, line_color: {field: "color"}, fill_alpha: 0.55, line_alpha: 0.8,
    })
    const selection_glyph = Scatter.create({
      size: {field: "selected_size"}, fill_color: {field: "color"}, line_color: "white", line_width: 2,
    })
    const nonselection_glyph = Scatter.create({fill_alpha: 0.55, line_alpha: 0.8})
    const renderer = GlyphRenderer.create({data_source: source, glyph, selection_glyph, nonselection_glyph})
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
})

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
    const glyph = webgl_view.owner.get_one(webgl.renderer).glyph as unknown as {
      glglyph: {
        _nvertices: number
        _triangle_count: number
        _positions: Float32Buffer
      }
    }
    const {glglyph: gl} = glyph
    expect(gl._nvertices).to.be.above(65_535)
    expect(gl._triangle_count).to.be.above(65_535)
    expect(gl._positions.length/2).to.be.equal(gl._nvertices)
  })
})
