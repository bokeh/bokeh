{expect} = require "chai"

{Plot} = require("models/plots/plot")
{Range1d} = require("models/ranges/range1d")

describe "CanvasView", ->

  beforeEach ->
    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    doc.add_root(plot)
    @plot_view = new plot.default_view({model: plot, parent: null})
