import {display} from "./_util"

import {
  At,
  BasicTicker,
  BoxAnnotation,
  Canvas,
  CanvasBox,
  CartesianFrame,
  Circle,
  ColumnDataSource,
  CoordinateMapping,
  GlyphRenderer,
  Grid,
  LinearColorMapper,
  PolyAnnotation,
  Range1d,
  Size,
  Span,
  XY,
} from "@bokehjs/models"

import {OutputBackend} from "@bokehjs/core/enums"
import {range} from "@bokehjs/core/util/array"
import {Random} from "@bokehjs/core/util/random"
import {Spectral11} from "@bokehjs/api/palettes"

describe("Canvas", () => {

  it("should support various configurations of renderers and coordinates", async () => {
    const canvas_box = new CanvasBox({width: 600, height: 600})
    const {canvas} = canvas_box

    const grid0_d0 = new Grid({dimension: 0, ticker: new BasicTicker()})
    const grid0_d1 = new Grid({dimension: 1, ticker: new BasicTicker()})
    canvas.renderers.push(grid0_d0, grid0_d1)

    const grid1_coords = new CoordinateMapping({
      x_source: new Range1d({start: 0, end: 100}),
      y_source: new Range1d({start: 0, end: 100}),
      x_target: new Range1d({start: 100, end: 200}),
      y_target: new Range1d({start: 400, end: 500}),
    })
    const grid1_d0 = new Grid({dimension: 0, ticker: new BasicTicker(), coordinates: grid1_coords, grid_line_color: "green"})
    const grid1_d1 = new Grid({dimension: 1, ticker: new BasicTicker(), coordinates: grid1_coords, grid_line_color: "green"})
    canvas.renderers.push(grid1_d0, grid1_d1)

    const span0 = new Span({location: 200, dimension: "width", editable: true, line_color: "red"})
    const span1 = new Span({location: 300, dimension: "width", editable: false, line_color: "blue"})
    const span2 = new Span({location: 200, dimension: "height", editable: true, line_color: "red"})
    const span3 = new Span({location: 300, dimension: "height", editable: false, line_color: "blue"})
    canvas.renderers.push(span0, span1, span2, span3)

    const box0 = new BoxAnnotation({left: 10, top: 10, right: 200, bottom: 100})
    canvas.renderers.push(box0)

    const box1 = new BoxAnnotation({left: 10, top: 110, right: 200, bottom: 210, editable: true, fill_color: "blue"})
    canvas.renderers.push(box1)

    const box2_coords = new CoordinateMapping({
      x_source: new Range1d({start: 0, end: 1}),
      y_source: new Range1d({start: 0, end: 1}),
    })
    const box2 = new BoxAnnotation({
      left: 0.5,
      top: 0.5,
      right: 0.8,
      bottom: 0.8,
      editable: true,
      fill_color: "green",
      coordinates: box2_coords,
    })
    canvas.renderers.push(box2)

    const poly0_coords = new CoordinateMapping({
      x_source: new Range1d({start: 0, end: 100}),
      y_source: new Range1d({start: 0, end: 100}),
    })
    const poly0 = new PolyAnnotation({
      xs: [40, 60, 60, 80, 60, 40],
      ys: [0, 0, 20, 40, 40, 20],
      editable: true,
      fill_color: "blue",
      coordinates: poly0_coords,
    })
    canvas.renderers.push(poly0)

    await display(canvas_box)
  })

  function circles({N=100, R=1.0}: {N?: number, R?: number} = {}) {
    const random = new Random(1)

    const x = range(0, N)
    const y = random.floats(N, 0, 100)
    const r = random.floats(N, 0.1, R)

    const cm = new LinearColorMapper({palette: Spectral11})
    const ds = new ColumnDataSource({data: {x, y, r}})
    const cg = new Circle({
      x: {field: "x"}, y: {field: "y"}, radius: {field: "r"},
      fill_color: {field: "y", transform: cm}, fill_alpha: 0.6, line_color: null,
    })
    const gr = new GlyphRenderer({data_source: ds, glyph: cg})
    return gr
  }

  function viz(output_backend: OutputBackend) {
    const cb = new CanvasBox({width: 400, height: 400, canvas: new Canvas({output_backend})})

    const cx_grid = new Grid({dimension: 0, ticker: new BasicTicker()})
    const cy_grid = new Grid({dimension: 1, ticker: new BasicTicker()})
    cb.canvas.renderers.push(cx_grid, cy_grid)

    const at0 = new At({loc: new XY({x: 50, y: 50}), size: new Size({width: 100, height: 100})})
    const cf0 = new CartesianFrame({position: at0, renderers: [circles({R: 3.0})]})

    const at1 = new At({loc: new XY({x: 150, y: 150}), size: new Size({width: 100, height: 100})})
    const cf1 = new CartesianFrame({position: at1, renderers: [circles({R: 4.5})]})

    const at2 = new At({loc: new XY({x: 250, y: 250}), size: new Size({width: 100, height: 100})})
    const cf2 = new CartesianFrame({position: at2, renderers: [circles({R: 6.0})]})

    cb.canvas.renderers.push(cf0, cf1, cf2)
    return cb
  }

  describe("should support manual frame positioning", () => {
    it("with canvas backend", async () => {
      const cb = viz("canvas")
      await display(cb)
    })

    it("with webgl backend", async () => {
      const cb = viz("webgl")
      await display(cb)
    })
  })
})
