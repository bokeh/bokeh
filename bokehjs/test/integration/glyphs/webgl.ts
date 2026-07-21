import {expect} from "#framework/assertions"
import {display, fig, row} from "#framework/layouts"
import type {OutputBackend} from "@bokehjs/core/enums"
import {settings} from "@bokehjs/core/settings"
import {linspace} from "@bokehjs/core/util/array"
import type {Float32Buffer} from "@bokehjs/models/glyphs/webgl/buffer"

describe("webgl", () => {
  it.no_image("should rebuild expanded ellipse visuals when adaptive geometry changes", async () => {
    const p = fig([500, 350], {
      output_backend: "webgl", x_range: [0, 100], y_range: [0, 100], toolbar_location: null,
    })
    const renderer = p.ellipse({
      x: [49, 51], y: [50, 50], width: [5, 5], height: [3, 3],
      fill_color: ["#dc2626", "#2563eb"], fill_alpha: [0.4, 0.8], line_alpha: 0,
    })
    const {view} = await display(p)
    const glyph_view = view.owner.get_one(renderer).glyph
    const gl = (glyph_view as unknown as {glglyph: {
      _poly_data: {fill_nvertices: number[]}
      _pv_fill_color: {length: number}
      _layout_revision: number
    }}).glglyph
    const initial_nvertices = gl._poly_data.fill_nvertices.reduce((total, count) => total + count, 0)
    const initial_revision = gl._layout_revision

    p.x_range.setv({start: 45, end: 55})
    p.y_range.setv({start: 45, end: 55})
    await view.ready
    await view.ready

    const zoomed_nvertices = gl._poly_data.fill_nvertices.reduce((total, count) => total + count, 0)
    expect(zoomed_nvertices).to.be.above(initial_nvertices)
    expect(gl._layout_revision).to.be.above(initial_revision)
    expect(gl._pv_fill_color.length).to.be.equal(4*zoomed_nvertices)
  })

  it.no_image("should remap and compact GPU-equivalent MultiPolygon vertices", async () => {
    const p = fig([400, 300], {
      output_backend: "webgl", x_range: [0, 4], y_range: [0, 4], toolbar_location: null,
    })
    const renderer = p.multi_polygons({
      xs: [[[[1, 3, 3, 1, 1 + 1e-12]]]],
      ys: [[[[1, 1, 3, 3, 1 + 1e-12]]]],
      fill_color: ["#2563eb"], line_color: ["#e0f2fe"], line_width: [2],
    })
    const {view} = await display(p)
    const glyph_view = view.owner.get_one(renderer).glyph
    const gl = (glyph_view as unknown as {glglyph: {
      _poly_data: {line_rings: {nline: number, points: Float32Array}[][]}
    }}).glglyph

    const initial_ring = gl._poly_data.line_rings[0][0]
    const initial_x = initial_ring.points[2]
    const initial_y = initial_ring.points[3]
    expect(initial_ring.nline).to.be.equal(5)

    p.x_range.setv({start: 0.5, end: 3.5})
    p.y_range.setv({start: 0.5, end: 3.5})
    await view.ready
    await view.ready

    const remapped_ring = gl._poly_data.line_rings[0][0]
    expect(remapped_ring.nline).to.be.equal(5)
    expect(remapped_ring.points[2]).to.not.be.equal(initial_x)
    expect(remapped_ring.points[3]).to.not.be.equal(initial_y)
    expect(remapped_ring.points[2]).to.be.similar(view.frame.x_scale.compute(1), 1e-4)
    expect(remapped_ring.points[3]).to.be.similar(view.frame.y_scale.compute(1), 1e-4)
  })

  it.no_image("should update line and scatter ranges without re-uploading coordinates", async () => {
    const x = linspace(1_720_000_000_000, 1_720_000_001_000, 10_000)
    const y = x.map((_, i) => Math.sin(i/100))
    const p = fig([600, 400], {
      output_backend: "webgl",
      x_range: [x[0], x[x.length - 1]],
      y_range: [-1.2, 1.2],
      toolbar_location: null,
    })
    const line = p.line(x, y)
    const scatter = p.scatter(x, y, {size: 3})

    const {view} = await display(p)
    const line_view = view.owner.get_one(line).glyph
    const scatter_view = view.owner.get_one(scatter).glyph
    const line_gl = (line_view as unknown as {glglyph: {_points: Float32Buffer}}).glglyph
    const scatter_gl = (scatter_view as unknown as {glglyph: {_centers: Float32Buffer}}).glglyph
    const line_revision = line_gl._points.uploaded_revision
    const scatter_revision = scatter_gl._centers.uploaded_revision

    p.x_range.setv({start: x[1000], end: x[9000]})
    p.y_range.setv({start: -0.5, end: 0.5})
    await view.ready
    await view.ready

    expect(line_gl._points.uploaded_revision).to.be.equal(line_revision)
    expect(scatter_gl._centers.uploaded_revision).to.be.equal(scatter_revision)

    // Hit testing remains a CPU operation. It must materialize current screen
    // coordinates lazily without invalidating the immutable GPU buffer.
    const index = 5000
    const sx = view.frame.x_scale.compute(x[index])
    const sy = view.frame.y_scale.compute(y[index])
    const hit = scatter_view.hit_test({type: "point", sx, sy})
    expect(hit != null && [...hit.indices].includes(index)).to.be.true
    expect(scatter_gl._centers.uploaded_revision).to.be.equal(scatter_revision)
  })

  it.no_image("should retain screen-coordinate remapping for dashed lines", async () => {
    const x = linspace(0, 10, 1000)
    const p = fig([400, 300], {
      output_backend: "webgl", x_range: [0, 10], y_range: [-1.2, 1.2], toolbar_location: null,
    })
    const line = p.line(x, x.map((value) => Math.sin(value)), {line_dash: [6, 3]})
    const {view} = await display(p)
    const line_view = view.owner.get_one(line).glyph
    const line_gl = (line_view as unknown as {glglyph: {_points: Float32Buffer}}).glglyph
    const revision = line_gl._points.uploaded_revision

    p.x_range.setv({start: 1, end: 9})
    await view.ready
    await view.ready

    expect(line_gl._points.uploaded_revision > revision).to.be.true
  })

  it.no_image("should fall back when deep zoom exposes Float32 rebasing error", async () => {
    const p = fig([400, 300], {
      output_backend: "webgl", x_range: [0, 1e12 + 10], y_range: [0, 2], toolbar_location: null,
    })
    const scatter = p.scatter([0, 1e12, 1e12 + 1], [0, 1, 1], {size: 8})
    const {view} = await display(p)
    const scatter_view = view.owner.get_one(scatter).glyph
    const scatter_gl = (scatter_view as unknown as {glglyph: {_centers: Float32Buffer}}).glglyph
    const revision = scatter_gl._centers.uploaded_revision

    p.x_range.setv({start: 1e12, end: 1e12 + 10})
    await view.ready
    await view.ready

    expect(scatter_gl._centers.uploaded_revision > revision).to.be.true
    const sx = view.frame.x_scale.compute(1e12 + 1)
    const sy = view.frame.y_scale.compute(1)
    const hit = scatter_view.hit_test({type: "point", sx, sy})
    expect(hit != null && [...hit.indices].includes(2)).to.be.true
  })

  it.no_image("should complete large WebGL batches before a Canvas ordering barrier", async () => {
    const x = linspace(0, 20, 4096)
    const p = fig([600, 400], {
      output_backend: "webgl", x_range: [0, 20], y_range: [-5, 5], toolbar_location: null,
    })

    for (let i = 0; i < 80; i++) {
      const phase = i*0.07
      p.line(x, x.map((value) => Math.sin(value + phase) + i*0.035), {
        line_alpha: 0.18, line_color: "#2563eb",
      })
    }
    p.text({
      x: [10], y: [1.4], text: ["Canvas ordering barrier"],
      text_align: "center", text_font_size: "22px", text_color: "#dc2626",
    })
    for (let i = 0; i < 80; i++) {
      const phase = i*0.11
      p.line(x, x.map((value) => Math.cos(0.7*value + phase) - 1.8 - i*0.025), {
        line_alpha: 0.18, line_color: "#059669",
      })
    }

    const force_webgl = settings.force_webgl
    settings.force_webgl = false
    try {
      const {view} = await display(p)
      const {canvas} = view.canvas_view.primary
      const ctx = canvas.getContext("2d")!
      const {data} = ctx.getImageData(0, 0, canvas.width, Math.floor(canvas.height/2))
      let blue_pixels = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 2] > data[i] + 5 && data[i + 2] > data[i + 1] + 5) {
          blue_pixels++
        }
      }
      expect(blue_pixels > 1000).to.be.true

      const {submitted, draw_calls} = view.canvas_view.webgl!.regl_wrapper.batch_stats
      expect(submitted).to.be.equal(160)
      expect(draw_calls).to.be.equal(2)
    } finally {
      settings.force_webgl = force_webgl
    }
  })

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
