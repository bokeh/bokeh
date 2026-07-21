import {expect, expect_not_null} from "#framework/assertions"
import {actions, xy} from "#framework/interactive"
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

  it.no_image("should initialize and remap every non-text WebGL glyph", async () => {
    const p = fig([600, 400], {
      output_backend: "webgl", x_range: [0, 10], y_range: [0, 10], toolbar_location: null,
    })
    const image = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath fill='%23059669' d='M0 0h8v8H0z'/%3E%3C/svg%3E"

    const renderers = [
      p.arc({x: [1], y: [8], radius: [0.7], start_angle: [0], end_angle: [4.5]}),
      p.bezier({x0: [2], y0: [7], x1: [4], y1: [7], cx0: [2], cy0: [9], cx1: [4], cy1: [5]}),
      p.ellipse({x: [5], y: [8], width: [1.5], height: [0.8], angle: [0.4]}),
      p.quadratic({x0: [6], y0: [7], x1: [8], y1: [7], cx: [7], cy: [9]}),
      p.ray({x: [1], y: [6], length: [1.5], angle: [0.3]}),
      p.segment({x0: [3], y0: [6], x1: [4.5], y1: [5.5]}),
      p.spline([5, 6, 7, 8], [6, 5.5, 6.5, 6]),
      p.harea({x1: [1, 1.5, 1], x2: [2, 2.5, 2], y: [3, 4, 5]}),
      p.harea_step({x1: [3, 3.5, 3], x2: [4, 4.5, 4], y: [3, 4, 5], step_mode: "center"}),
      p.varea({x: [5, 6, 7], y1: [3, 3.5, 3], y2: [4, 4.5, 4]}),
      p.varea_step({x: [7, 8, 9], y1: [3, 3.5, 3], y2: [4, 4.5, 4], step_mode: "after"}),
      p.multi_polygons({
        xs: [[[[1, 2.5, 2.5, 1]], [[1.4, 2.1, 2.1, 1.4]]]],
        ys: [[[[0.5, 0.5, 2, 2]], [[0.9, 0.9, 1.6, 1.6]]]],
      }),
      p.hspan([2.5], {line_dash: "dashed"}),
      p.vspan([9.5], {line_dash: "dotted"}),
      p.image_url({url: [image], x: [5], y: [2], w: [1.5], h: [1], angle: [0.25]}),
    ]

    const {view} = await display(p)
    for (const renderer of renderers) {
      const glyph_view = view.owner.get_one(renderer).glyph
      expect(glyph_view.has_webgl()).to.be.true
    }

    p.x_range.setv({start: 0.5, end: 9.5})
    p.y_range.setv({start: 0.5, end: 9.5})
    await view.ready
    await view.ready

    for (const renderer of renderers) {
      const glyph_view = view.owner.get_one(renderer).glyph
      expect(glyph_view.has_webgl()).to.be.true
    }
  })

  it.no_image("should atlas-render Text, TeX, and MathML through WebGL", async () => {
    const p = fig([600, 400], {
      output_backend: "webgl", x_range: [0, 10], y_range: [0, 10], toolbar_location: null,
      x_axis_type: null, y_axis_type: null, background_fill_color: "white",
    })
    const renderers = [
      p.text({
        x: [2, 5, 8], y: [8, 8, 8], text: ["WebGL", "multi\nline", "rotated"],
        text_color: "#dc2626", text_font_size: "28px", angle: [0, 0, Math.PI/6],
        anchor: "center", background_fill_color: "#fef2f2", border_line_color: "#991b1b", padding: 6,
      }),
      p.tex({
        x: [3, 7], y: [5, 5], text: [String.raw`\frac{1}{x^2}`, String.raw`\int_0^\infty e^{-x} dx`],
        text_color: "#2563eb", text_font_size: "24px", anchor: "center", display: "inline",
      }),
      p.mathml({
        x: [4, 6], y: [2, 2],
        text: [
          "<math><msup><mi>x</mi><mn>2</mn></msup></math>",
          "<math><mrow><msup><mi>a</mi><mn>2</mn></msup><mo>+</mo><msup><mi>b</mi><mn>2</mn></msup></mrow></math>",
        ],
        text_color: "#16a34a", text_font_size: "24px", anchor: "center",
      }),
    ]

    const {view} = await display(p)
    const atlas_state: {textures: unknown[], bounds_revisions: number[]}[] = []
    for (const renderer of renderers) {
      const glyph_view = view.owner.get_one(renderer).glyph
      expect(glyph_view.has_webgl()).to.be.true
      const label_views = (glyph_view as unknown as {
        _label_views?: Map<unknown, {
          svg_image: HTMLImageElement | null
          svg_url: string | null
          svg_element: SVGElement
        }>
      })._label_views
      if (label_views != null) {
        for (const label_view of label_views.values()) {
          expect_not_null(label_view.svg_image)
          expect_not_null(label_view.svg_url)
          expect(label_view.svg_url.startsWith("blob:")).to.be.true
          expect(label_view.svg_image.crossOrigin).to.be.null
          expect(label_view.svg_element.querySelector(`[data-mml-node="merror"]`)).to.be.null
        }
      }
      const gl = (glyph_view as unknown as {glglyph: {
        _pages: {texture: unknown, bounds: {uploaded_revision: number}}[]
      }}).glglyph
      expect(gl._pages.length).to.be.above(0)
      atlas_state.push({
        textures: gl._pages.map(({texture}) => texture),
        bounds_revisions: gl._pages.map(({bounds}) => bounds.uploaded_revision),
      })
    }

    p.x_range.setv({start: 1, end: 9})
    p.y_range.setv({start: 1, end: 9})
    await view.ready
    await view.ready

    for (let i = 0; i < renderers.length; i++) {
      const glyph_view = view.owner.get_one(renderers[i]).glyph
      const gl = (glyph_view as unknown as {glglyph: {
        _pages: {texture: unknown, bounds: {uploaded_revision: number}}[]
      }}).glglyph
      expect(gl._pages.map(({texture}) => texture)).to.be.equal(atlas_state[i].textures)
      for (let page = 0; page < gl._pages.length; page++) {
        expect(gl._pages[page].bounds.uploaded_revision).to.be.above(atlas_state[i].bounds_revisions[page])
      }
    }

    const ctx = view.canvas_view.primary.ctx
    const {data} = ctx.getImageData(0, 0, view.canvas_view.primary.canvas.width, view.canvas_view.primary.canvas.height)
    let red = 0
    let blue = 0
    let green = 0
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = data.subarray(i, i + 4)
      if (a > 32 && r > g + 30 && r > b + 30) {
        red++
      }
      if (a > 32 && b > r + 20 && b > g + 10) {
        blue++
      }
      if (a > 32 && g > r + 20 && g > b + 10) {
        green++
      }
    }
    expect(red).to.be.above(100)
    expect(blue).to.be.above(50)
    expect(green).to.be.above(20)
  })

  it.no_image("should isolate two atlas plots while one is wheel-zoomed", async () => {
    function atlas_plot() {
      return fig([300, 260], {
        output_backend: "webgl", x_range: [-5, 5], y_range: [-5, 5],
        x_axis_type: null, y_axis_type: null, background_fill_color: "black",
        border_fill_color: "black", outline_line_color: null,
        tools: "wheel_zoom", active_scroll: "wheel_zoom", toolbar_location: null,
        styles: {margin: "0px"},
      })
    }

    const left = atlas_plot()
    const values = linspace(-4, 4, 80)
    left.text({
      x: values, y: values.map((value) => 2*Math.sin(value)),
      text: values.map((_, i) => `${i}`), text_color: "red", text_font_size: "12px",
    })

    const right = atlas_plot()
    right.text({
      x: values, y: values.map((value) => 2*Math.cos(value)),
      text: values.map((_, i) => `${i}`), text_color: "lime", text_font_size: "12px",
    })
    right.tex({
      x: [-2, 0, 2], y: [3, 3, 3],
      text: [String.raw`\frac{1}{x}`, String.raw`e^{i\pi}+1=0`, String.raw`\sqrt{x^2+y^2}`],
      text_color: "lime", text_font_size: "18px", anchor: "center",
    })
    right.mathml({
      x: [-2, 0, 2], y: [-3, -3, -3],
      text: [
        "<math><mfrac><mn>1</mn><mi>x</mi></mfrac></math>",
        "<math><msup><mi>x</mi><mn>2</mn></msup></math>",
        "<math><msqrt><mrow><mi>x</mi><mo>+</mo><mi>y</mi></mrow></msqrt></math>",
      ],
      text_color: "lime", text_font_size: "18px", anchor: "center",
    })

    const {view} = await display(row([left, right], {spacing: 0}))
    const left_view = view.owner.get_one(left)
    const right_view = view.owner.get_one(right)
    expect(left_view.canvas_view.webgl === right_view.canvas_view.webgl).to.be.true

    await actions(right_view).scroll_up(xy(0, 0), 4)
    await right_view.ready
    await right_view.ready

    function color_counts(plot_view: typeof left_view) {
      const {canvas, ctx} = plot_view.canvas_view.primary
      const {data} = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let red = 0
      let green = 0
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = data.subarray(i, i + 4)
        if (a > 32 && r > 100 && g < 80 && b < 80) {
          red++
        }
        if (a > 32 && g > 100 && r < 80 && b < 120) {
          green++
        }
      }
      return {red, green}
    }

    const left_colors = color_counts(left_view)
    const right_colors = color_counts(right_view)
    expect(left_colors.red).to.be.above(5)
    expect(left_colors.green).to.be.equal(0)
    expect(right_colors.green).to.be.above(5)
    expect(right_colors.red).to.be.equal(0)
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

  it.no_image("should complete large WebGL batches before the canvas blit", async () => {
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
      x: [10], y: [1.4], text: ["WebGL atlas batch"],
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
      expect(submitted).to.be.equal(161)
      expect(draw_calls).to.be.equal(3)
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
