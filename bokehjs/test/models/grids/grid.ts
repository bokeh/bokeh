import {expect} from "chai"

import {Axis} from "models/axes/axis"
import {BasicTicker} from "models/tickers/basic_ticker"
import {BasicTickFormatter} from "models/formatters/basic_tick_formatter"
import {Grid, GridView} from "models/grids/grid"
import {Plot} from "models/plots/plot"
import {Range1d} from "models/ranges/range1d"

describe("Grid", () => {

  it("use axis computed bounds when range names and dimension match, and bounds='auto'", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker, formatter, bounds: [2, 8]})
    plot.add_layout(axis, 'below')
    const grid = new Grid({ticker})
    plot.add_layout(grid, 'center')
    const plot_view = new plot.default_view({model: plot, parent: null}).build()
    const grid_view = plot_view.renderer_views[grid.id] as GridView

    expect(grid_view.computed_bounds()).to.be.deep.equal([2, 8])
  })

  it("use axis computed bounds when dimensions doesn't match, and bounds='auto'", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker, formatter, bounds: [2, 8]})
    plot.add_layout(axis, 'left')
    const grid = new Grid({ticker})
    plot.add_layout(grid, 'center')
    const plot_view = new plot.default_view({model: plot, parent: null}).build()
    const grid_view = plot_view.renderer_views[grid.id] as GridView

    expect(grid_view.computed_bounds()).to.be.deep.equal([0, 10])
  })

  it("use user bounds when set'", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0, end: 10}),
      y_range: new Range1d({start: 0, end: 10}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker, formatter, bounds: [2, 8]})
    plot.add_layout(axis, 'below')
    const grid = new Grid({ticker, bounds: [1, 9]})
    plot.add_layout(grid, 'center')
    const plot_view = new plot.default_view({model: plot, parent: null}).build()
    const grid_view = plot_view.renderer_views[grid.id] as GridView

    expect(grid_view.computed_bounds()).to.be.deep.equal([1, 9])
  })

  it("should return major grid_coords without ends by default", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0.1, end: 9.9}),
      y_range: new Range1d({start: 0.1, end: 9.9}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker, formatter})
    plot.add_layout(axis, 'below')
    const grid = new Grid({ticker})
    plot.add_layout(grid, 'center')
    const plot_view = new plot.default_view({model: plot, parent: null}).build()
    const grid_view = plot_view.renderer_views[grid.id] as GridView

    expect(grid_view.grid_coords('major')).to.be.deep.equal([
      [[2,2],      [4,4],      [6,6],      [8,8]     ],
      [[0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9]],
    ])
  })

  it("should return major grid_coords with ends when asked", () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0.1, end: 9.9}),
      y_range: new Range1d({start: 0.1, end: 9.9}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker: ticker, formatter: formatter})
    plot.add_layout(axis, 'below')
    const grid = new Grid({ticker})
    plot.add_layout(grid, 'center')
    const plot_view = new plot.default_view({model: plot, parent: null}).build()
    const grid_view = plot_view.renderer_views[grid.id] as GridView

    expect(grid_view.grid_coords('major', false)).to.be.deep.equal([
      [[0.1, 0.1], [2, 2],     [4, 4],     [6, 6],     [8, 8],     [9.9, 9.9]],
      [[0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9]],
    ])
  })
})
