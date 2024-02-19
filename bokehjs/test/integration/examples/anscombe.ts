import {display} from "../_util"

import {gridplot} from "@bokehjs/api/gridplot"
import {transpose, linspace} from "@bokehjs/core/util/array"
import {Plot, ColumnDataSource, Range1d, LinearAxis, Grid, Line, Scatter, Pane, Column} from "@bokehjs/models"
import {Text} from "@bokehjs/models/dom"

describe("Examples", () => {
  it("should support Anscombe", async () => {
    const anscombe_quartet = transpose([
      [10.0,  8.04, 10.0, 9.14, 10.0,  7.46,  8.0,  6.58],
      [ 8.0,  6.95,  8.0, 8.14,  8.0,  6.77,  8.0,  5.76],
      [13.0,  7.58, 13.0, 8.74, 13.0, 12.74,  8.0,  7.71],
      [ 9.0,  8.81,  9.0, 8.77,  9.0,  7.11,  8.0,  8.84],
      [11.0,  8.33, 11.0, 9.26, 11.0,  7.81,  8.0,  8.47],
      [14.0,  9.96, 14.0, 8.10, 14.0,  8.84,  8.0,  7.04],
      [ 6.0,  7.24,  6.0, 6.13,  6.0,  6.08,  8.0,  5.25],
      [ 4.0,  4.26,  4.0, 3.10,  4.0,  5.39, 19.0, 12.50],
      [12.0, 10.84, 12.0, 9.13, 12.0,  8.15,  8.0,  5.56],
      [ 7.0,  4.82,  7.0, 7.26,  7.0,  6.42,  8.0,  7.91],
      [ 5.0,  5.68,  5.0, 4.74,  5.0,  5.73,  8.0,  6.89]])

    const circles = new ColumnDataSource({
      data: {
        xi: anscombe_quartet[0],
        yi: anscombe_quartet[1],
        xii: anscombe_quartet[2],
        yii: anscombe_quartet[3],
        xiii: anscombe_quartet[4],
        yiii: anscombe_quartet[5],
        xiv: anscombe_quartet[6],
        yiv: anscombe_quartet[7],
      },
    })

    const x = linspace(-0.5, 20.5, 10)
    const y = x.map((v) => v*0.5 + 3.0)

    const lines = new ColumnDataSource({data: {x, y}})

    const xdr = new Range1d({start: -0.5, end: 20.5})
    const ydr = new Range1d({start: -0.5, end: 20.5})

    function make_plot(title: string, xname: string, yname: string): Plot {
      const plot = new Plot({
        x_range: xdr,
        y_range: ydr,
        title,
        width: 400,
        height: 400,
        background_fill_color: "#F2F2F7",
      })
      const xaxis = new LinearAxis({axis_line_color: null})
      const yaxis = new LinearAxis({axis_line_color: null})
      plot.add_layout(xaxis, "below")
      plot.add_layout(yaxis, "left")
      const xgrid = new Grid({ticker: xaxis.ticker, dimension: 0})
      const ygrid = new Grid({ticker: yaxis.ticker, dimension: 1})
      plot.add_layout(xgrid)
      plot.add_layout(ygrid)
      const line = new Line({x: {field: "x"}, y: {field: "y"}, line_color: "#666699", line_width: 2})
      plot.add_glyph(line, lines)
      const scatter = new Scatter({x: {field: xname}, y: {field: yname}, size: 12, fill_color: "#cc6633", line_color: "#cc6633", fill_alpha: 0.5})
      plot.add_glyph(scatter, circles)

      return plot
    }

    const I   = make_plot("I",   "xi",   "yi")
    const II  = make_plot("II",  "xii",  "yii")
    const III = make_plot("III", "xiii", "yiii")
    const IV  = make_plot("IV",  "xiv",  "yiv")

    const grid = gridplot([[I, II], [III, IV]], {toolbar_location: null})

    const header = new Pane({
      elements: [new Text({content: "Anscombe's Quartet"})],
      styles: {
        font_size: "150%",
        font_weight: "bold",
      },
    })

    const column = new Column({children: [header, grid]})
    await display(column, [900, 900])
  })
})
