import {expect} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig} from "#framework/layouts"
import {WebGLScenario, require_glglyph} from "#framework/webgl"
import {linspace} from "@bokehjs/core/util/array"
import type {Float32Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {missing_data_value} from "@bokehjs/models/glyphs/webgl/data_mapping"
import type {DataMapping} from "@bokehjs/models/glyphs/webgl/data_mapping"
import {FactorRange} from "@bokehjs/models/ranges/factor_range"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

describe("WebGL mapping state transitions", () => {
  it.no_image("should keep reversed and extra-range linear coordinates on the GPU", async () => {
    const x = linspace(0, 10, 2_000)
    const y = x.map((value) => Math.sin(value))
    const extra = new Range1d({start: 10, end: -10})
    const p = fig([620, 400], {
      output_backend: "webgl", x_range: [10, 0], y_range: [2, -2], extra_y_ranges: {extra},
      tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
    })
    const line = p.line(x, y)
    const scatter = p.scatter(x, y, {size: 5})
    const extra_scatter = p.scatter(x, y.map((value) => 5*value), {size: 4, color: "red"})
    extra_scatter.y_range_name = "extra"
    const dashed = p.line(x, y.map((value) => value + 0.3), {line_dash: [5, 3]})
    const {view} = await display(p)

    const line_gl = require_glglyph(view.owner.get_one(line).glyph) as unknown as {
      _points: Float32Buffer
      data_mapping: DataMapping | null
    }
    const scatter_gl = require_glglyph(view.owner.get_one(scatter).glyph) as unknown as {
      _centers: Float32Buffer
      data_mapping: DataMapping | null
    }
    const extra_gl = require_glglyph(view.owner.get_one(extra_scatter).glyph) as unknown as {
      _centers: Float32Buffer
      data_mapping: DataMapping | null
    }
    const dashed_gl = require_glglyph(view.owner.get_one(dashed).glyph) as unknown as {_points: Float32Buffer}
    expect(line_gl.data_mapping).to.not.be.null
    expect(scatter_gl.data_mapping).to.not.be.null
    expect(extra_gl.data_mapping).to.not.be.null
    line_gl._points.reset_upload_stats()
    scatter_gl._centers.reset_upload_stats()
    extra_gl._centers.reset_upload_stats()
    dashed_gl._points.reset_upload_stats()

    const scenario = new WebGLScenario(view)
    await scenario.pan(xy(5, 0), xy(6, 0.25))
    await scenario.zoom(xy(5, 0), 2)
    await scenario.reset()

    expect(line_gl._points.upload_stats.bytes).to.be.equal(0)
    expect(scatter_gl._centers.upload_stats.bytes).to.be.equal(0)
    expect(extra_gl._centers.upload_stats.bytes).to.be.equal(0)
    expect(dashed_gl._points.upload_stats.bytes).to.be.above(0)
  })

  it.no_image("should transition from GPU mapping to deep-zoom CPU mapping and back", async () => {
    const p = fig([500, 340], {
      output_backend: "webgl", x_range: [0, 1e12 + 10], y_range: [0, 2], toolbar_location: null,
    })
    const renderer = p.scatter([0, 1e12, 1e12 + 1], [0, 1, 1], {size: 10})
    const {view} = await display(p)
    const glyph = view.owner.get_one(renderer).glyph
    const gl = require_glglyph(glyph) as unknown as {_centers: Float32Buffer, data_mapping: DataMapping | null}
    expect(gl.data_mapping).to.not.be.null
    gl._centers.reset_upload_stats()

    p.x_range.setv({start: 1e12, end: 1e12 + 10})
    await new WebGLScenario(view).settle()
    expect(gl.data_mapping).to.be.null
    expect(gl._centers.upload_stats.bytes).to.be.above(0)
    const sx = view.frame.x_scale.compute(1e12 + 1)
    const sy = view.frame.y_scale.compute(1)
    const hit = glyph.hit_test({type: "point", sx, sy})
    expect(hit != null && [...hit.indices].includes(2)).to.be.true

    p.x_range.setv({start: 0, end: 1e12 + 10})
    await new WebGLScenario(view).settle()
    expect(gl.data_mapping).to.not.be.null
    gl._centers.reset_upload_stats()
    p.x_range.setv({start: 1e9, end: 1e12})
    await new WebGLScenario(view).settle()
    expect(gl._centers.upload_stats.bytes).to.be.equal(0)
  })

  it.no_image("should encode invalid log coordinates without poisoning valid points", async () => {
    const p = fig([450, 320], {
      output_backend: "webgl", x_axis_type: "log", x_range: [1, 1_000], y_range: [0, 5],
      tools: "wheel_zoom", active_scroll: "wheel_zoom",
    })
    const renderer = p.scatter([0, -1, 1, 10, 100], [1, 2, 3, 4, Infinity], {size: 12})
    const {view} = await display(p)
    const glyph = view.owner.get_one(renderer).glyph
    const gl = require_glglyph(glyph) as unknown as {_centers: Float32Buffer, data_mapping: DataMapping | null}
    expect(gl.data_mapping).to.not.be.null
    const centers = gl._centers.get_array()
    expect(centers[0]).to.be.equal(missing_data_value)
    expect(centers[2]).to.be.equal(missing_data_value)
    expect(centers[9]).to.be.equal(missing_data_value)

    await new WebGLScenario(view).zoom(xy(10, 4), 2)
    const sx = view.frame.x_scale.compute(10)
    const sy = view.frame.y_scale.compute(4)
    const hit = glyph.hit_test({type: "point", sx, sy})
    expect(hit != null && [...hit.indices].includes(3)).to.be.true
  })

  it.no_image("should retain the Canvas mapper fallback for categorical coordinates", async () => {
    const factors = new FactorRange({factors: ["a", "b", "c", "d"]})
    const source = new ColumnDataSource({data: {x: ["a", "b", "c", "d"], y: [1, 3, 2, 4]}})
    const p = fig([450, 320], {output_backend: "webgl", x_range: factors, y_range: [0, 5]})
    const renderer = p.scatter({x: {field: "x"}, y: {field: "y"}, source, size: 12})
    const {view} = await display(p)
    const gl = require_glglyph(view.owner.get_one(renderer).glyph) as unknown as {
      _centers: Float32Buffer
      data_mapping: DataMapping | null
    }
    expect(gl.data_mapping).to.be.null
    gl._centers.reset_upload_stats()

    factors.factors = ["d", "c", "b", "a"]
    await new WebGLScenario(view).settle()
    expect(gl.data_mapping).to.be.null
    expect(gl._centers.upload_stats.bytes).to.be.above(0)
  })
})
