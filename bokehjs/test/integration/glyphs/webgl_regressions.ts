import {expect} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig, row} from "#framework/layouts"
import {SeededRandom} from "#framework/random"
import {WebGLScenario, require_glglyph} from "#framework/webgl"
import {linspace, range} from "@bokehjs/core/util/array"
import type {Float32Buffer, NormalizedUint8Buffer, Uint8Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Scatter} from "@bokehjs/models/glyphs/scatter"

describe("WebGL reported interaction regressions", () => {
  it.no_image("should render the minimum positive nonselection alpha", async () => {
    const p = fig([320, 240], {
      output_backend: "webgl", x_range: [-1, 1], y_range: [-1, 1],
      x_axis_type: null, y_axis_type: null, background_fill_color: "white", outline_line_color: null,
    })
    const x = [-0.5, 0.5]
    const y = [0, 0]
    const renderer = p.scatter(x, y, {
      size: 40, fill_color: "black", line_color: null, nonselection_alpha: 0.001,
    })
    renderer.data_source.selected.indices = [0]
    const {view} = await display(p)
    await new WebGLScenario(view).settle()

    const sx = view.frame.x_scale.compute(x[1])
    const sy = view.frame.y_scale.compute(y[1])
    const ratio = view.canvas_view.pixel_ratio
    const side = Math.max(1, Math.round(8*ratio))
    const left = Math.round(ratio*sx - side/2)
    const top = Math.round(ratio*sy - side/2)
    const {data} = view.canvas_view.primary.ctx.getImageData(left, top, side, side)
    let faded_pixels = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] != 255 || data[i + 1] != 255 || data[i + 2] != 255) {
        faded_pixels++
      }
    }
    expect(faded_pixels > 0).to.be.true
  })

  it.no_image("should pan, zoom, hit test, and reset scatter10k without coordinate uploads", async () => {
    const n = 10_000
    const random = new SeededRandom(10).values(2*n)
    const x = range(n).map((i) => 6*(random[i] - 0.5))
    const y = x.map((value, i) => Math.sin(value) + 0.4*(random[n + i] - 0.5))
    const p = fig([650, 420], {
      output_backend: "webgl", x_range: [-4, 4], y_range: [-2, 2],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    const renderer = p.scatter(x, y, {alpha: 0.1, nonselection_alpha: 0.001, size: 6})
    const {view} = await display(p)
    const renderer_view = view.owner.get_one(renderer)
    const glyph = renderer_view.glyph
    const gl = require_glglyph(glyph) as unknown as {_centers: Float32Buffer}
    gl._centers.reset_upload_stats()

    const scenario = new WebGLScenario(view)
    await scenario.pan(xy(0, 0), xy(0.8, -0.4))
    await scenario.zoom(xy(0, 0), 3)

    const index = 5000
    const sx = view.frame.x_scale.compute(x[index])
    const sy = view.frame.y_scale.compute(y[index])
    const hit = glyph.hit_test({type: "point", sx, sy})
    expect(hit != null && [...hit.indices].includes(index)).to.be.true

    await scenario.reset()
    const selected = [10, 20, 30, 40]
    renderer.data_source.selected.indices = selected
    await scenario.settle()

    type ScatterGLState = {
      _show_by_type: Map<string, Uint8Buffer>
      _fill_rgba: NormalizedUint8Buffer
    }
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
    expect(nonselection_gl._fill_rgba.get_array()[3]).to.be.equal(1)
    if (typeof OffscreenCanvas != "undefined") {
      expect(view.canvas_view.webgl?.canvas instanceof OffscreenCanvas).to.be.true
    }

    await scenario.reset()
    expect(gl._centers.upload_stats).to.be.equal({full_uploads: 0, partial_uploads: 0, bytes: 0})
    expect(view.canvas_view.webgl_diagnostics).to.be.equal({dirty: false, compositor_pending: 0, backend: "webgl2"})
  })

  it.no_image("should preserve mixed-marker alpha through stream, patch, zoom, and reset", async () => {
    const n = 2_000
    const values = new SeededRandom(7).values(2*n)
    const markers = ["circle", "square", "triangle", "diamond", "hex", "star"]
    const source = new ColumnDataSource({data: {
      x: values.slice(0, n).map((value) => 4*value - 2),
      y: values.slice(n).map((value) => 4*value - 2),
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
      _fill_rgba: NormalizedUint8Buffer
      _line_rgba: NormalizedUint8Buffer
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

  it.no_image("should remap and frame-clip ellipses and multipolygons after wheel zoom", async () => {
    const p = fig([650, 440], {
      output_backend: "webgl", x_range: [-5, 5], y_range: [-5, 5],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    const ellipse = p.ellipse({
      x: [-2, 2], y: [0, 1], width: [1.5, 2], height: [0.8, 1.2], angle: [0.2, -0.4],
      fill_alpha: 0.5,
    })
    const multi = p.multi_polygons({
      xs: [[[[-0.8, 0.8, 0.8, -0.8]]]], ys: [[[[-0.8, -0.8, 0.8, 0.8]]]], fill_alpha: 0.5,
    })
    const {view} = await display(p)
    const ellipse_gl = require_glglyph(view.owner.get_one(ellipse).glyph) as unknown as {
      _poly_data: {line_rings: {points: Float32Array}[][]}
    }
    const multi_gl = require_glglyph(view.owner.get_one(multi).glyph) as unknown as {
      _poly_data: {line_rings: {points: Float32Array}[][]}
    }
    const initial_ellipse = ellipse_gl._poly_data.line_rings[0][0].points[0]
    const initial_multi = multi_gl._poly_data.line_rings[0][0].points[0]

    const scenario = new WebGLScenario(view)
    await scenario.zoom(xy(0, 0), 4)

    const zoomed_ellipse = ellipse_gl._poly_data.line_rings[0][0].points[0]
    const zoomed_multi = multi_gl._poly_data.line_rings[0][0].points[0]
    expect(zoomed_ellipse).to.not.be.equal(initial_ellipse)
    expect(zoomed_multi).to.not.be.equal(initial_multi)
    expect(zoomed_multi).to.be.similar(view.frame.x_scale.compute(-0.8), 1e-3)

    const {scissor} = view.canvas_view.webgl!.regl_wrapper
    const {bbox, frame} = view
    const ratio = view.canvas_view.pixel_ratio
    expect(scissor.width).to.be.similar(frame.bbox.width*ratio, 1)
    expect(scissor.height).to.be.similar(frame.bbox.height*ratio, 1)
    expect(scissor.x).to.be.similar(bbox.xview.compute(frame.bbox.x)*ratio, 1)
  })

  it.no_image("should paint the complete 8x architectural batch before interaction", async () => {
    const x = linspace(0, 20, 4096)
    const p = fig([720, 460], {
      output_backend: "webgl", x_range: [0, 20], y_range: [-5, 5],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
      background_fill_color: "white",
    })
    for (let i = 0; i < 80; i++) {
      p.line(x, x.map((value) => Math.sin(value + i*0.07) + i*0.035), {
        line_alpha: 0.18, line_color: "#2563eb",
      })
    }
    p.text({x: [10], y: [1.4], text: ["ordering barrier"], text_color: "#dc2626"})
    for (let i = 0; i < 80; i++) {
      p.line(x, x.map((value) => Math.cos(0.7*value + i*0.11) - 1.8 - i*0.025), {
        line_alpha: 0.18, line_color: "#059669",
      })
    }
    const {view} = await display(p)

    const blue_pixels = () => {
      const {canvas, ctx} = view.canvas_view.primary
      const {data} = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height/2))
      let count = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 2] > data[i] + 5 && data[i + 2] > data[i + 1] + 5) {
          count++
        }
      }
      return count
    }
    const initial = blue_pixels()
    expect(initial).to.be.above(1_000)

    const scenario = new WebGLScenario(view)
    await scenario.pan(xy(10, 0), xy(11, 0))
    expect(blue_pixels()).to.be.above(1_000)
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
