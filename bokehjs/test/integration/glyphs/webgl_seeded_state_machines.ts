import {expect} from "#framework/assertions"
import {xy} from "#framework/interactive"
import {display, fig, row} from "#framework/layouts"
import {SeededRandom} from "#framework/random"
import {WebGLScenario, require_glglyph} from "#framework/webgl"
import {range} from "@bokehjs/core/util/array"
import type {Float32Buffer} from "@bokehjs/models/glyphs/webgl/buffer"
import {ColumnDataSource} from "@bokehjs/models/sources/column_data_source"

function sorted(values: Iterable<number>): number[] {
  return [...values].sort((a, b) => a - b)
}

describe("WebGL seeded state machines", () => {
  it.no_image("should match the Canvas hit-test oracle through mixed interaction and mutation traces", async () => {
    const random = new SeededRandom(0x5eed)
    const n = 240
    const marker_types = ["circle", "square", "triangle", "diamond", "hex", "star"]
    const source = new ColumnDataSource({data: {
      x: range(n).map(() => 8*random.float() - 4),
      y: range(n).map(() => 8*random.float() - 4),
      size: range(n).map(() => 6 + random.int(8)),
      marker: range(n).map(() => marker_types[random.int(marker_types.length)]),
      color: range(n).map(() => `hsl(${random.int(360)} 70% 45%)`),
    }})
    const attrs = {
      x_range: [-5, 5] as [number, number], y_range: [-5, 5] as [number, number],
      tools: "pan,wheel_zoom,reset", active_drag: "pan" as const, active_scroll: "wheel_zoom" as const,
      x_axis_type: null, y_axis_type: null,
    }
    const webgl = fig([430, 350], {...attrs, output_backend: "webgl"})
    const canvas = fig([430, 350], {...attrs, output_backend: "canvas"})
    const add = (plot: typeof webgl) => plot.scatter({
      x: {field: "x"}, y: {field: "y"}, size: {field: "size"}, marker: {field: "marker"},
      fill_color: {field: "color"}, line_color: null, source,
    })
    const webgl_renderer = add(webgl)
    const canvas_renderer = add(canvas)
    const {view} = await display(row([webgl, canvas]))
    const webgl_view = view.owner.get_one(webgl)
    const canvas_view = view.owner.get_one(canvas)
    const webgl_glyph = webgl_view.owner.get_one(webgl_renderer).glyph
    const canvas_glyph = canvas_view.owner.get_one(canvas_renderer).glyph
    const gl = require_glglyph(webgl_glyph)
    const resources = gl.diagnostics.resources
    const webgl_scenario = new WebGLScenario(webgl_view)
    const canvas_scenario = new WebGLScenario(canvas_view)

    for (let step = 0; step < 2; step++) {
      for (let mutation = 0; mutation < 8; mutation++) {
        const index = random.int(n)
        source.patch({
          x: [[index, 8*random.float() - 4]],
          y: [[index, 8*random.float() - 4]],
          size: [[index, 5 + random.int(12)]],
          marker: [[index, marker_types[random.int(marker_types.length)]]],
        })
      }
      source.selected.indices = range(6).map(() => random.int(n))
      await Promise.all([webgl_scenario.settle(), canvas_scenario.settle()])

      if (step == 0) {
        await Promise.all([
          webgl_scenario.pan(xy(0, 0), xy(0.4, -0.25)),
          canvas_scenario.pan(xy(0, 0), xy(0.4, -0.25)),
        ])
      } else if (step == 1) {
        await Promise.all([
          webgl_scenario.zoom(xy(0, 0), 2),
          canvas_scenario.zoom(xy(0, 0), 2),
        ])
      }

      expect(webgl.x_range.start).to.be.similar(canvas.x_range.start, 1e-10)
      expect(webgl.x_range.end).to.be.similar(canvas.x_range.end, 1e-10)
      expect(webgl.y_range.start).to.be.similar(canvas.y_range.start, 1e-10)
      expect(webgl.y_range.end).to.be.similar(canvas.y_range.end, 1e-10)
      for (let query = 0; query < 8; query++) {
        const index = random.int(n)
        const x = source.get("x")[index] as number
        const y = source.get("y")[index] as number
        const webgl_hit = webgl_glyph.hit_test({
          type: "point", sx: webgl_view.frame.x_scale.compute(x), sy: webgl_view.frame.y_scale.compute(y),
        })
        const canvas_hit = canvas_glyph.hit_test({
          type: "point", sx: canvas_view.frame.x_scale.compute(x), sy: canvas_view.frame.y_scale.compute(y),
        })
        expect(sorted(webgl_hit?.indices ?? [])).to.be.equal(sorted(canvas_hit?.indices ?? []))
      }
      expect(gl.diagnostics.resources).to.be.equal(resources)
      expect(webgl_view.canvas_view.webgl_diagnostics.compositor_pending).to.be.equal(0)
    }
  })

  it.no_image("should preserve randomized polygon topology across range and data state changes", async () => {
    const random = new SeededRandom(0xc0ffee)
    const source = new ColumnDataSource({data: {xs: [], ys: []}})
    const attrs = {
      x_range: [-6, 6] as [number, number], y_range: [-6, 6] as [number, number],
      x_axis_type: null, y_axis_type: null,
    }
    const webgl = fig([430, 350], {...attrs, output_backend: "webgl"})
    const canvas = fig([430, 350], {...attrs, output_backend: "canvas"})
    const add = (plot: typeof webgl) => plot.multi_polygons({
      xs: {field: "xs"}, ys: {field: "ys"}, source,
      fill_color: "#3b82f6", fill_alpha: 0.55, line_color: "#1d4ed8", line_width: 2,
    })
    const webgl_renderer = add(webgl)
    const canvas_renderer = add(canvas)
    const {view} = await display(row([webgl, canvas]))
    const webgl_view = view.owner.get_one(webgl)
    const canvas_view = view.owner.get_one(canvas)
    const webgl_glyph = webgl_view.owner.get_one(webgl_renderer).glyph
    const canvas_glyph = canvas_view.owner.get_one(canvas_renderer).glyph
    const gl = require_glglyph(webgl_glyph) as unknown as {
      _poly_data: {
        line_rings: {nline: number, points: Float32Array}[][]
        fill_element_counts: number[]
      }
      _positions: Float32Buffer
    }
    const webgl_scenario = new WebGLScenario(webgl_view)
    const canvas_scenario = new WebGLScenario(canvas_view)

    for (let generation = 0; generation < 3; generation++) {
      const npolygons = 8 + generation
      const counts: number[] = []
      const centers: [number, number][] = []
      const xs: number[][][][] = []
      const ys: number[][][][] = []
      for (let i = 0; i < npolygons; i++) {
        const count = 3 + random.int(8)
        const cx = -4.5 + 9*random.float()
        const cy = -4.5 + 9*random.float()
        const radius = 0.15 + 0.35*random.float()
        const angles = range(count).map((j) => 2*Math.PI*j/count + 0.08*(random.float() - 0.5))
        counts.push(count)
        centers.push([cx, cy])
        xs.push([[[...angles.map((angle) => cx + radius*Math.cos(angle))]]])
        ys.push([[[...angles.map((angle) => cy + radius*Math.sin(angle))]]])
      }
      source.data = {xs, ys}
      if (generation % 2 == 0) {
        webgl.x_range.setv({start: -6, end: 6})
        canvas.x_range.setv({start: -6, end: 6})
      } else {
        webgl.x_range.setv({start: 6, end: -6})
        canvas.x_range.setv({start: 6, end: -6})
      }
      await Promise.all([webgl_scenario.settle(), canvas_scenario.settle()])

      expect(gl._poly_data.line_rings.length).to.be.equal(npolygons)
      const actual_counts = gl._poly_data.line_rings.map((rings) => rings.map(({nline}) => nline))
      if (!gl._poly_data.line_rings.every((rings, i) => rings.length == 1 && rings[0].nline == counts[i] + 1)) {
        throw new Error(`unexpected ring topology: ${JSON.stringify({counts, actual_counts})}`)
      }
      if (!gl._poly_data.fill_element_counts.every((count) => count > 0)) {
        throw new Error(`empty polygon fill: ${gl._poly_data.fill_element_counts.join(",")}`)
      }
      const positions = gl._positions.get_array()
      const invalid = positions.findIndex((value) => !Number.isFinite(value))
      if (invalid != -1) {
        throw new Error(`non-finite polygon position at ${invalid} in generation ${generation}`)
      }
      for (let i = 0; i < centers.length; i++) {
        const [x, y] = centers[i]
        const webgl_hit = webgl_glyph.hit_test({
          type: "point", sx: webgl_view.frame.x_scale.compute(x), sy: webgl_view.frame.y_scale.compute(y),
        })
        const canvas_hit = canvas_glyph.hit_test({
          type: "point", sx: canvas_view.frame.x_scale.compute(x), sy: canvas_view.frame.y_scale.compute(y),
        })
        expect(sorted(webgl_hit?.indices ?? [])).to.be.equal(sorted(canvas_hit?.indices ?? []))
      }
      expect(webgl_view.canvas_view.webgl_diagnostics.compositor_pending).to.be.equal(0)
    }
  })
})
