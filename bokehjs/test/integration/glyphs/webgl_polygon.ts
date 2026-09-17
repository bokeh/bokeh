import {expect, expect_condition} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig, column, row} from "#framework/layouts"
import {require_glglyph, WebGLScenario} from "#framework/webgl"

import {range} from "@bokehjs/core/util/array"
import {ColumnDataSource, LinearScale, LogScale, Range1d} from "@bokehjs/models"
import type {PlotView} from "@bokehjs/models/plots/plot_canvas"

type PolygonKind = "patch" | "patches"
type Point = [number, number]
type PolygonBuffers = {
  _positions: {length: number}
  _pv_fill_color: {length: number}
}

function polygon_plot(kind: PolygonKind, x: number[], y: number[], bounds: [number, number, number, number]) {
  const [left, right, bottom, top] = bounds
  const x_range = new Range1d({start: left, end: right})
  const y_range = new Range1d({start: bottom, end: top})
  const p = fig([400, 300], {
    output_backend: "webgl", x_range, y_range,
    x_axis_type: null, y_axis_type: null,
    background_fill_color: "white", outline_line_color: null,
    tools: "pan,wheel_zoom,reset", active_drag: "pan", active_scroll: "wheel_zoom",
  })
  p.xgrid.visible = false
  p.ygrid.visible = false
  const source = new ColumnDataSource({data: kind == "patch" ? {x, y} : {xs: [x], ys: [y]}})
  const visuals = {source, fill_color: "black", fill_alpha: 0.5, line_color: null}
  const renderer = kind == "patch" ?
    p.patch({x: {field: "x"}, y: {field: "y"}, ...visuals}) :
    p.patches({xs: {field: "xs"}, ys: {field: "ys"}, ...visuals})
  return {p, renderer, source, x_range, y_range}
}

function pixel(view: PlotView, [x, y]: Point): number[] {
  const {ctx, pixel_ratio} = view.canvas_view.primary
  const sx = Math.floor(view.frame.x_scale.compute(x)*pixel_ratio)
  const sy = Math.floor(view.frame.y_scale.compute(y)*pixel_ratio)
  return Array.from(ctx.getImageData(sx, sy, 1, 1).data)
}

function expect_pixel(view: PlotView, point: Point, expected: number[]): void {
  const actual = pixel(view, point)
  expect_condition(actual.every((value, i) => Math.abs(value - expected[i]) <= 2),
    `pixel at ${point}: expected ${expected}, got ${actual}`)
}

function region_has_ink(view: PlotView, [x0, y0]: Point, [x1, y1]: Point): boolean {
  const {ctx, pixel_ratio} = view.canvas_view.primary
  const sx0 = view.frame.x_scale.compute(x0)*pixel_ratio
  const sy0 = view.frame.y_scale.compute(y0)*pixel_ratio
  const sx1 = view.frame.x_scale.compute(x1)*pixel_ratio
  const sy1 = view.frame.y_scale.compute(y1)*pixel_ratio
  const {data} = ctx.getImageData(
    Math.ceil(Math.min(sx0, sx1)), Math.ceil(Math.min(sy0, sy1)),
    Math.floor(Math.abs(sx1 - sx0)), Math.floor(Math.abs(sy1 - sy0)),
  )
  return data.some((value, i) => i % 4 != 3 && value < 240)
}

describe("WebGL self-intersecting polygons", () => {
  const filled = [127, 127, 127, 255]
  const empty = [255, 255, 255, 255]

  for (const kind of ["patch", "patches"] as const) {
    it(`should visually match canvas for self-intersecting ${kind} fills and hatches`, async () => {
      const samples = range(40).map((i) => i*4*Math.PI/39)
      const cases = [
        {
          name: "sine lobes", bounds: [-1, 14, -1.5, 1.5],
          x: [...samples, ...samples.toReversed()],
          y: [...samples.map(() => 0), ...samples.toReversed().map(Math.sin)],
        },
        {name: "bow-tie", bounds: [-0.5, 2.5, -0.5, 2.5], x: [0, 2, 0, 2], y: [0, 2, 2, 0]},
        {
          name: "overlapping contours", bounds: [-0.5, 4.5, -0.5, 4.5],
          x: [0, 3, 3, 0, NaN, 1, 4, 4, 1], y: [0, 0, 3, 3, NaN, 1, 1, 4, 4],
        },
      ]
      const plots = cases.map(({name, bounds: [left, right, bottom, top], x, y}) => {
        return (["canvas", "webgl"] as const).map((output_backend) => {
          const p = fig([320, 240], {
            output_backend, title: `${name}: ${output_backend}`,
            x_range: [left, right], y_range: [bottom, top],
            background_fill_color: "white", outline_line_color: null,
          })
          p.xgrid.visible = false
          p.ygrid.visible = false
          const visuals = {
            fill_color: "steelblue", fill_alpha: 0.6,
            line_color: name == "sine lobes" ? null : "navy", line_width: 2,
          }
          const renderer = kind == "patch" ? p.patch(x, y, visuals) : p.patches([x], [y], visuals)
          if (name == "overlapping contours") {
            renderer.glyph.setv({hatch_pattern: "/", hatch_color: "navy", hatch_alpha: 0.7, hatch_scale: 8})
          }
          return {p, renderer}
        })
      })
      const {view} = await display(column(plots.map((plots) => row(plots.map(({p}) => p)))))
      for (const [_, {renderer}] of plots) {
        require_glglyph(view.owner.get_one(renderer).glyph)
      }
    })

    it(`should recompute ${kind} intersections when replacing a linear scale with a logarithmic scale`, async () => {
      const {p, renderer} = polygon_plot(kind, [1, 100, 1, 10], [1, 100, 100, 1], [0.5, 110, 0, 110])
      const {view} = await display(p)
      const gl = require_glglyph(view.owner.get_one(renderer).glyph) as unknown as {_elements: unknown}
      const linear_elements = gl._elements
      const scenario = new WebGLScenario(view)
      expect_pixel(view, [2, 12], empty)
      expect_pixel(view, [5, 2], filled)

      // All source vertices stay finite, but the edge intersection moves from
      // (9.25,9.25) to (10**(2/3),34) in data coordinates.
      await scenario.mutate(() => {
        p.x_scale = new LogScale()
      })
      expect(gl._elements).to.not.be.identical(linear_elements)
      expect_pixel(view, [2, 12], filled)
      expect_pixel(view, [3, 40], empty)

      const log_elements = gl._elements
      await scenario.mutate(() => {
        p.x_scale = new LinearScale()
      })
      expect(gl._elements).to.not.be.identical(log_elements)
      expect_pixel(view, [2, 12], empty)
      expect_pixel(view, [5, 2], filled)
    })

    it(`should resize ${kind} visual buffers when a scale change restores finite vertices`, async () => {
      const {p, renderer, source, x_range} = polygon_plot(kind, [-2, 2, 4, 2, 0.5], [1, 1, 3, 5, 4], [0.1, 5, 0, 6])
      p.x_scale = new LogScale()
      const {view} = await display(p)
      const renderer_view = view.owner.get_one(renderer)
      const gl = require_glglyph(renderer_view.glyph) as unknown as PolygonBuffers
      const scenario = new WebGLScenario(view)
      expect(gl._pv_fill_color.length).to.be.equal(32)

      // Initialize both visual variants before rebuilding the shared topology.
      const selected = kind == "patch" ? range(5) : [0]
      await scenario.mutate(() => {
        source.selected.indices = selected
      })
      const selection_gl = require_glglyph(renderer_view.selection_glyph) as unknown as PolygonBuffers
      expect(selection_gl._pv_fill_color.length).to.be.equal(32)
      await scenario.mutate(() => {
        source.selected.indices = []
      })

      await scenario.mutate(() => {
        p.x_scale = new LinearScale()
        x_range.start = -3
      })
      expect(gl._positions.length).to.be.equal(20)
      expect(gl._pv_fill_color.length).to.be.equal(40)
      expect_pixel(view, [-1, 1.5], filled)

      // The main glyph consumed the mapping change before selection is drawn.
      await scenario.mutate(() => {
        source.selected.indices = selected
      })
      expect(selection_gl._pv_fill_color.length).to.be.equal(40)
      expect_pixel(view, [-1, 1.5], filled)
    })

    it(`should preserve all ${kind} sine lobes through pan, zoom, and data updates in issue #15453`, async () => {
      const samples = range(40).map((i) => i*4*Math.PI/39)
      const x = [...samples, ...samples.toReversed()]
      const y = [...samples.map(() => 0), ...samples.toReversed().map(Math.sin)]
      const {p, renderer, source, x_range, y_range} = polygon_plot(kind, x, y, [-1, 14, -1.5, 1.5])
      const {view} = await display(p)
      const gl = require_glglyph(view.owner.get_one(renderer).glyph) as unknown as {_elements: unknown}
      const elements = gl._elements
      expect(elements).to.not.be.null
      const scenario = new WebGLScenario(view)

      function check_lobes(): void {
        for (let i = 0; i < 4; i++) {
          const x = (i + 0.5)*Math.PI
          const y = i % 2 == 0 ? 0.4 : -0.4
          expect_pixel(view, [x, y], filled)
          expect_pixel(view, [x, -y], empty)
        }
      }
      check_lobes()
      const initial_start = x_range.start
      await scenario.pan(xy(6, 0), xy(6.3, 0.1))
      expect(x_range.start).to.not.be.equal(initial_start)
      check_lobes()
      expect(gl._elements).to.be.identical(elements)
      const initial_width = x_range.end - x_range.start
      await scenario.zoom(xy(6, 0), 2)
      expect(x_range.end - x_range.start).to.not.be.equal(initial_width)
      check_lobes()
      expect(gl._elements).to.be.identical(elements)

      // Replacing the data also changes the number and positions of crossings.
      await scenario.mutate(() => {
        const x = [0, 2, 0, 2]
        const y = [0, 2, 2, 0]
        source.data = kind == "patch" ? {x, y} : {xs: [x], ys: [y]}
        x_range.setv({start: -0.5, end: 2.5})
        y_range.setv({start: -0.5, end: 2.5})
      })
      require_glglyph(view.owner.get_one(renderer).glyph)
      expect_pixel(view, [1, 0.4], filled)
      expect_pixel(view, [1, 1.6], filled)
      expect_pixel(view, [0.25, 1], empty)
      expect_pixel(view, [1.75, 1], empty)
    })

    it(`should hatch only the even-odd interior of intersecting ${kind} contours`, async () => {
      const x = [0, 3, 3, 0, NaN, 1, 4, 4, 1]
      const y = [0, 0, 3, 3, NaN, 1, 1, 4, 4]
      const {p, renderer} = polygon_plot(kind, x, y, [-0.5, 4.5, -0.5, 4.5])
      renderer.glyph.setv({
        fill_color: "white", fill_alpha: 1,
        hatch_pattern: "/", hatch_color: "black", hatch_alpha: 0.5, hatch_scale: 8,
      })
      const {view} = await display(p)
      require_glglyph(view.owner.get_one(renderer).glyph)

      expect(region_has_ink(view, [0.3, 0.3], [0.7, 2.7])).to.be.true
      expect(region_has_ink(view, [3.3, 1.3], [3.7, 3.7])).to.be.true
      expect(region_has_ink(view, [1.3, 1.3], [2.7, 2.7])).to.be.false
      expect(region_has_ink(view, [0.3, 3.3], [0.7, 3.7])).to.be.false
    })

    it(`should retain original ${kind} strokes when coincident contours cancel the fill`, async () => {
      const x = [0, 2, 2, 0, NaN, 0, 2, 2, 0]
      const y = [0, 0, 2, 2, NaN, 0, 0, 2, 2]
      const {p, renderer} = polygon_plot(kind, x, y, [-0.5, 2.5, -0.5, 2.5])
      renderer.glyph.setv({line_color: "red", line_width: 6})
      const {view} = await display(p)
      require_glglyph(view.owner.get_one(renderer).glyph)

      expect_pixel(view, [1, 1], empty)
      for (const point of [[0, 1], [1, 0], [2, 1], [1, 2]] as Point[]) {
        expect_pixel(view, point, [255, 0, 0, 255])
      }
    })
  }

  it("should preserve Patches visual and element offsets with different resolved polygon sizes", async () => {
    const source = new ColumnDataSource({data: {
      xs: [[0, 2, 2, 0, NaN, 0, 2, 2, 0], [3, 5, 3, 5], [6, 8, 7]],
      ys: [[0, 0, 2, 2, NaN, 0, 0, 2, 2], [0, 2, 2, 0], [0, 0, 2]],
      color: ["red", "#00ff00", "blue"],
      alpha: [1, 0.5, 0.25],
    }})
    const p = fig([600, 300], {
      output_backend: "webgl", x_range: [-0.5, 8.5], y_range: [-0.5, 2.5],
      x_axis_type: null, y_axis_type: null,
      background_fill_color: "white", outline_line_color: null,
    })
    p.xgrid.visible = false
    p.ygrid.visible = false
    const renderer = p.patches({
      source, xs: {field: "xs"}, ys: {field: "ys"},
      fill_color: {field: "color"}, fill_alpha: {field: "alpha"}, line_color: null,
    })
    const {view} = await display(p)
    require_glglyph(view.owner.get_one(renderer).glyph)

    function check_pixels(first: number[]): void {
      expect_pixel(view, [1, 1], first)
      expect_pixel(view, [4, 0.4], [127, 255, 127, 255])
      expect_pixel(view, [4, 1.6], [127, 255, 127, 255])
      expect_pixel(view, [3.25, 1], empty)
      expect_pixel(view, [7, 0.5], [191, 191, 255, 255])
    }
    check_pixels(empty)

    // Restoring the first polygon shifts the following element/visual offsets.
    await new WebGLScenario(view).mutate(() => {
      source.patch({xs: [[0, [0, 2, 2, 0]]], ys: [[0, [0, 0, 2, 2]]]})
    })
    check_pixels([255, 0, 0, 255])
  })
})
