{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{Axis} = utils.require("models/axes/axis")
{BasicTicker} = utils.require("models/tickers/basic_ticker")
{BasicTickFormatter} = utils.require("models/formatters/basic_tick_formatter")
{Grid} = utils.require("models/grids/grid")
{Plot} = utils.require("models/plots/plot")
{Range1d} = utils.require("models/ranges/range1d")
{Document} = utils.require "document"

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
