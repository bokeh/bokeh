import {expect} from "assertions"

import {Axis} from "@bokehjs/models/axes/axis"
import {BasicTicker} from "@bokehjs/models/tickers/basic_ticker"
import {BasicTickFormatter} from "@bokehjs/models/formatters/basic_tick_formatter"
import {FixedTicker} from "@bokehjs/models/tickers/fixed_ticker"
import {Grid, GridView} from "@bokehjs/models/grids/grid"
import {Plot} from "@bokehjs/models/plots/plot"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {build_view} from "@bokehjs/core/build_views"

describe("Grid", () => {

  it("use axis computed bounds when range names and dimension match, and bounds='auto'", async () => {
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
    const plot_view = (await build_view(plot)).build()
    const grid_view = plot_view.renderer_views.get(grid)! as GridView

    expect(grid_view.computed_bounds()).to.be.equal([2, 8])
  })

  it("use axis computed bounds when dimensions doesn't match, and bounds='auto'", async () => {
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
    const plot_view = (await build_view(plot)).build()
    const grid_view = plot_view.renderer_views.get(grid)! as GridView

    expect(grid_view.computed_bounds()).to.be.equal([0, 10])
  })

  it("use user bounds when set'", async () => {
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
    const plot_view = (await build_view(plot)).build()
    const grid_view = plot_view.renderer_views.get(grid)! as GridView

    expect(grid_view.computed_bounds()).to.be.equal([1, 9])
  })

  it("should return major grid_coords without ends by default", async () => {
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
    const plot_view = (await build_view(plot)).build()
    const grid_view = plot_view.renderer_views.get(grid)! as GridView

    expect(grid_view.grid_coords('major')).to.be.equal([
      [[2, 2],     [4, 4],     [6, 6],     [8, 8]    ],
      [[0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9]],
    ])
  })

  it("should return major grid_coords with ends when asked", async () => {
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
    const plot_view = (await build_view(plot)).build()
    const grid_view = plot_view.renderer_views.get(grid)! as GridView

    expect(grid_view.grid_coords('major', false)).to.be.equal([
      [[0.1, 0.1], [2, 2],     [4, 4],     [6, 6],     [8, 8],     [9.9, 9.9]],
      [[0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9]],
    ])
  })

  it("should delegate to an Axis ticker", async () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0.1, end: 9.9}),
      y_range: new Range1d({start: 0.1, end: 9.9}),
    })
    const ticker = new BasicTicker()
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker, formatter})
    plot.add_layout(axis, 'below')
    const grid = new Grid({axis})
    plot.add_layout(grid, 'center')
    const plot_view = (await build_view(plot)).build()
    const grid_view = plot_view.renderer_views.get(grid)! as GridView

    expect(grid_view.grid_coords('major', false)).to.be.equal([
      [[0.1, 0.1], [2, 2],     [4, 4],     [6, 6],     [8, 8],     [9.9, 9.9]],
      [[0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9]],
    ])
  })

  it("should prefer an explicit ticker to an Axis ticker", async () => {
    const plot = new Plot({
      x_range: new Range1d({start: 0.1, end: 9.9}),
      y_range: new Range1d({start: 0.1, end: 9.9}),
    })

    const axis_ticker = new FixedTicker({ticks: [1, 2, 3, 4]})
    const formatter = new BasicTickFormatter()
    const axis = new Axis({ticker: axis_ticker, formatter})

    plot.add_layout(axis, 'below')
    const ticker = new BasicTicker()
    const grid = new Grid({axis, ticker})
    plot.add_layout(grid, 'center')
    const plot_view = (await build_view(plot)).build()
    const grid_view = plot_view.renderer_views.get(grid)! as GridView

    expect(grid_view.grid_coords('major', false)).to.be.equal([
      [[0.1, 0.1], [2, 2],     [4, 4],     [6, 6],     [8, 8],     [9.9, 9.9]],
      [[0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9], [0.1, 9.9]],
    ])
  })
})
