import {expect} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig} from "#framework/layouts"
import {WebGLScenario, buffer_upload_totals, require_glglyph, reset_buffer_upload_stats} from "#framework/webgl"
import {range} from "@bokehjs/core/util/array"
import type {BaseGLGlyph} from "@bokehjs/models/glyphs/webgl/base"
import type {Float32Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"
import {GlyphRenderer} from "@bokehjs/models/renderers/glyph_renderer"
import {Scatter} from "@bokehjs/models/glyphs/scatter"

function values(n: number): number[] {
  return range(n).map((i) => 4*Math.sin(i*12.9898) % 2)
}

describe("WebGL mutation state sequences", () => {
  it.no_image("should survive replace, stream, patch, select, hover, mute, reset, and removal", async () => {
    const n = 1_000
    const x = values(n)
    const y = range(n).map((i) => Math.cos(i/17))
    const markers = ["circle", "square", "triangle", "diamond"]
    const source = new ColumnDataSource({data: {
      x, y,
      size: range(n).map((i) => 6 + i % 3),
      marker: range(n).map((i) => markers[i % markers.length]),
      color: range(n).map((i) => i % 2 == 0 ? "#2563eb" : "#f97316"),
    }})
    const glyph = new Scatter({
      x: {field: "x"}, y: {field: "y"}, size: {field: "size"}, marker: {field: "marker"},
      fill_color: {field: "color"}, line_color: {field: "color"}, fill_alpha: 0.7,
    })
    const renderer = new GlyphRenderer({
      data_source: source,
      glyph,
      selection_glyph: new Scatter({size: 14, fill_color: "yellow", line_color: "black"}),
      nonselection_glyph: new Scatter({fill_alpha: 0.15, line_alpha: 0.2}),
      hover_glyph: new Scatter({size: 16, fill_color: "lime", line_color: "black"}),
      muted_glyph: new Scatter({fill_alpha: 0.08, line_alpha: 0.1}),
    })
    const p = fig([620, 400], {
      output_backend: "webgl", x_range: [-3, 3], y_range: [-2, 2],
      tools: "pan,wheel_zoom,hover,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    p.renderers.push(renderer)
    const {view} = await display(p)
    const renderer_view = view.owner.get_one(renderer)
    const glyphs = [
      renderer_view.glyph, renderer_view.selection_glyph, renderer_view.nonselection_glyph,
      renderer_view.hover_glyph!, renderer_view.muted_glyph,
    ]
    const glglyphs = glyphs.map(require_glglyph)
    const main_gl = glglyphs[0] as unknown as {_centers: Float32Buffer, diagnostics: BaseGLGlyph["diagnostics"]}
    const initial_geometry = main_gl.diagnostics.revisions.geometry
    main_gl._centers.reset_upload_stats()
    const scenario = new WebGLScenario(view)

    await scenario.mutate(() => source.patch({
      x: [[10, 0.25]], y: [[10, -0.25]], marker: [[10, "star"]], size: [[10, 12]],
    }))
    expect(main_gl.diagnostics.revisions.geometry).to.be.above(initial_geometry)
    expect(main_gl._centers.upload_stats.bytes).to.be.above(0)

    await scenario.mutate(() => {
      source.data = {
        ...source.data,
        x: Array.from(source.get<number>("x")),
        y: Array.from(source.get<number>("y"), (value, i) => value + 0.02*Math.sin(i)),
      }
    })
    await scenario.mutate(() => source.stream({
      x: [0.5], y: [-0.5], size: [9], marker: ["hex"], color: ["#22c55e"],
    }, n + 20))
    expect(source.length).to.be.equal(n + 1)

    source.selected.indices = [10, 20, 30]
    await scenario.settle()
    for (const gl of glglyphs) {
      reset_buffer_upload_stats(gl)
    }
    source.selected.indices = [10, 21, 30]
    await scenario.settle()
    const selection_uploads = glglyphs.slice(1, 3).map(buffer_upload_totals)
    expect(selection_uploads.some(({partial_uploads}) => partial_uploads > 0)).to.be.true
    expect(selection_uploads.reduce((total, {bytes}) => total + bytes, 0)).to.be.below(100)

    const hover_x = source.get<number>("x")[10]
    const hover_y = source.get<number>("y")[10]
    await scenario.hover(xy(hover_x, hover_y))
    expect(Array.from(source.inspected.indices).includes(10)).to.be.true

    renderer.muted = true
    await scenario.settle()
    await scenario.pan(xy(0, 0), xy(0.5, 0.25))
    await scenario.zoom(xy(0, 0), 2)
    await scenario.reset()
    expect(source.selected.indices).to.be.equal([])

    p.renderers = []
    await scenario.settle()
    for (const gl of glglyphs) {
      expect(gl.diagnostics.destroyed).to.be.true
      expect(gl.diagnostics.resources).to.be.equal(0)
    }
  })

  it.no_image("should update polygon holes and adaptive paths through mutation and interaction", async () => {
    const source = new ColumnDataSource({data: {
      x: [-2, 2], y: [1, -1], width: [1.5, 1], height: [0.8, 1.4], angle: [0.2, -0.4],
      xs: [
        [-4, -1, -1, -4],
        [1, 4, 4, 1, NaN, 2, 3, 3, 2],
      ],
      ys: [
        [-4, -4, -1, -1],
        [1, 1, 4, 4, NaN, 2, 2, 3, 3],
      ],
      mxs: [
        [[[-4, -1, -1, -4]]],
        [[[1, 4, 4, 1], [2, 3, 3, 2]]],
      ],
      mys: [
        [[[-4, -4, -1, -1]]],
        [[[1, 1, 4, 4], [2, 2, 3, 3]]],
      ],
    }})
    const p = fig([650, 440], {
      output_backend: "webgl", x_range: [-5, 5], y_range: [-5, 5],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    const ellipse = p.ellipse({
      x: {field: "x"}, y: {field: "y"}, width: {field: "width"}, height: {field: "height"},
      angle: {field: "angle"}, source, fill_alpha: 0.5,
    })
    const patches = p.patches({xs: {field: "xs"}, ys: {field: "ys"}, source, fill_alpha: 0.4})
    const multi = p.multi_polygons({xs: {field: "mxs"}, ys: {field: "mys"}, source, fill_alpha: 0.4})
    const paths = [
      p.bezier({x0: [-4], y0: [0], x1: [4], y1: [0], cx0: [-2], cy0: [4], cx1: [2], cy1: [-4]}),
      p.quadratic({x0: [-4], y0: [-3], x1: [4], y1: [-3], cx: [0], cy: [4]}),
      p.ray({x: [0], y: [0], length: [8], angle: [0.35]}),
      p.hspan([-4.5, 4.5]),
      p.vspan([-4.5, 4.5]),
    ]
    const {view} = await display(p)
    const ellipse_gl = require_glglyph(view.owner.get_one(ellipse).glyph) as unknown as {
      _poly_data: {line_rings: {points: Float32Array}[][]}
    }
    const patches_gl = require_glglyph(view.owner.get_one(patches).glyph) as unknown as {
      _elements: unknown
      _poly_data: {line_rings: {points: Float32Array}[][]}
    }
    const multi_gl = require_glglyph(view.owner.get_one(multi).glyph) as unknown as {
      _elements: unknown
      _poly_data: {line_rings: {points: Float32Array}[][]}
    }
    for (const renderer of paths) {
      expect(view.owner.get_one(renderer).glyph.has_webgl()).to.be.true
    }
    const initial_patches_elements = patches_gl._elements
    const initial_multi_elements = multi_gl._elements
    const initial_ellipse = ellipse_gl._poly_data.line_rings[0][0].points[0]
    const initial_patch = patches_gl._poly_data.line_rings[0][0].points[0]

    const scenario = new WebGLScenario(view)
    await scenario.mutate(() => source.patch({
      x: [[0, -2.5]],
      xs: [[0, [-4.5, -1, -1, -4.5]]],
      mxs: [[0, [[[-4.5, -1, -1, -4.5]]]]],
    }))
    expect(patches_gl._elements).to.not.be.identical(initial_patches_elements)
    expect(multi_gl._elements).to.not.be.identical(initial_multi_elements)
    const patches_elements = patches_gl._elements
    const multi_elements = multi_gl._elements
    source.selected.indices = [1]
    await scenario.settle()
    await scenario.zoom(xy(0, 0), 2)
    await scenario.pan(xy(0, 0), xy(0.5, -0.5))

    expect(ellipse_gl._poly_data.line_rings[0][0].points[0]).to.not.be.equal(initial_ellipse)
    expect(patches_gl._poly_data.line_rings[0][0].points[0]).to.not.be.equal(initial_patch)
    expect(patches_gl._elements).to.be.identical(patches_elements)
    expect(multi_gl._elements).to.be.identical(multi_elements)
    await scenario.reset()
  })

  it.dpr(2)("should resize and interact at devicePixelRatio 2", async () => {
    const p = fig([320, 240], {
      output_backend: "webgl", x_range: [-2, 2], y_range: [-2, 2],
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    const renderer = p.ellipse({x: [-1, 1], y: [0, 0], width: [1, 1], height: [0.5, 0.75]})
    const {view} = await display(p, [550, 370])
    expect(view.canvas_view.pixel_ratio).to.be.equal(2)
    expect(view.owner.get_one(renderer).glyph.has_webgl()).to.be.true
    const scenario = new WebGLScenario(view)
    await scenario.zoom(xy(0, 0), 2)
    await scenario.pan(xy(0, 0), xy(0.5, 0.25))

    p.width = 480
    p.height = 300
    await scenario.settle()
    const {canvas} = view.canvas_view.webgl!
    expect(canvas.width).to.be.equal(Math.floor(2*view.canvas_view.bbox.width))
    expect(canvas.height).to.be.equal(Math.floor(2*view.canvas_view.bbox.height))
    await scenario.reset()
  })
})
