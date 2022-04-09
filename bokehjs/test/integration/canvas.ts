import {display} from "./_util"

import {
  BasicTicker,
  BoxAnnotation,
  CanvasBox,
  CoordinateMapping,
  Grid,
  PolyAnnotation,
  Range1d,
  Span,
} from "@bokehjs/models"

describe("Canvas", () => {

  it("should support various configurations of renderers and coordinates", async () => {
    const box = new CanvasBox({width: 600, height: 600})
    const {canvas} = box

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

    await display(box)
  })
})
