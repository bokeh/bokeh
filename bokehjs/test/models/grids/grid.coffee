{expect} = require "chai"

{Axis} = require("models/axes/axis")
{BasicTicker} = require("models/tickers/basic_ticker")
{BasicTickFormatter} = require("models/formatters/basic_tick_formatter")
{Grid} = require("models/grids/grid")
{Plot} = require("models/plots/plot")
{Range1d} = require("models/ranges/range1d")
{Document} = require "document"

describe "Grid", ->

  it "use axis computed bounds when range names and dimension match, and bounds='auto'", ->
    doc = new Document()
    p = new Plot({
      x_range: new Range1d({start: 0, end: 10})
      y_range: new Range1d({start: 0, end: 10})
    })
    doc.add_root(p)
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    axis = new Axis({
      ticker: ticker
      formatter: formatter
      plot: p
      bounds: [2, 8]
    })
    axis.attach_document(p.document)
    p.add_layout(axis, 'below')
    grid = new Grid({
      ticker: ticker
      plot: p
    })

    expect(grid.computed_bounds()).to.be.deep.equal [2, 8]

it "use axis computed bounds when dimensions doesn't match, and bounds='auto'", ->
    doc = new Document()
    p = new Plot({
      x_range: new Range1d({start: 0, end: 10})
      y_range: new Range1d({start: 0, end: 10})
    })
    doc.add_root(p)
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    axis = new Axis({
      ticker: ticker
      formatter: formatter
      plot: p
      bounds: [2, 8]
    })
    axis.attach_document(p.document)
    p.add_layout(axis, 'left')
    grid = new Grid({
      ticker: ticker
      plot: p
    })

    expect(grid.computed_bounds()).to.be.deep.equal [0, 10]

it "use user bounds when set'", ->
    doc = new Document()
    p = new Plot({
      x_range: new Range1d({start: 0, end: 10})
      y_range: new Range1d({start: 0, end: 10})
    })
    doc.add_root(p)
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    axis = new Axis({
      ticker: ticker
      formatter: formatter
      plot: p
      bounds: [2, 8]
    })
    axis.attach_document(p.document)
    p.add_layout(axis, 'below')
    grid = new Grid({
      ticker: ticker
      plot: p
      bounds: [1, 9]
    })

    expect(grid.computed_bounds()).to.be.deep.equal [1, 9]

  it "should return major grid_coords without ends by default", ->
    doc = new Document()
    p = new Plot({
      x_range: new Range1d({start: 0.1, end: 9.9})
      y_range: new Range1d({start: 0.1, end: 9.9})
    })
    doc.add_root(p)
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    axis = new Axis({
      ticker: ticker
      formatter: formatter
      plot: p
    })
    axis.attach_document(p.document)
    p.add_layout(axis, 'below')
    grid = new Grid({
      ticker: ticker
      plot: p
    })

    expect(grid.grid_coords('major')).to.be.deep.equal [[[2,2], [4,4], [6,6], [8,8]], [[0.1,9.9], [0.1,9.9], [0.1,9.9], [0.1,9.9]]]

    it "should return major grid_coords with ends when asked", ->
    doc = new Document()
    p = new Plot({
      x_range: new Range1d({start: 0.1, end: 9.9})
      y_range: new Range1d({start: 0.1, end: 9.9})
    })
    doc.add_root(p)
    ticker = new BasicTicker()
    formatter = new BasicTickFormatter()
    axis = new Axis({
      ticker: ticker
      formatter: formatter
      plot: p
    })
    axis.attach_document(p.document)
    p.add_layout(axis, 'below')
    grid = new Grid({
      ticker: ticker
      plot: p
    })

    expect(grid.grid_coords('major', false)).to.be.deep.equal [
      [[0.1,0.1], [2,2], [4,4], [6,6], [8,8], [9.9,9.9]], [[0.1,9.9], [0.1,9.9], [0.1,9.9], [0.1,9.9], [0.1,9.9], [0.1,9.9]]
     ]
