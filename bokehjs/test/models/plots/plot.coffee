_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

DataRange1d = utils.require("models/ranges/data_range1d").Model
PlotCanvas = utils.require("models/plots/plot_canvas").Model
Plot = utils.require("models/plots/plot").Model
PlotView = utils.require("models/plots/plot").View

describe "Plot.Model", ->

  it "should have _horizontal set to false by default", ->
    x_range = new DataRange1d()
    y_range = new DataRange1d()
    p = new Plot({x_range: x_range, y_range: y_range})
    expect(p._horizontal).to.false

  it "should have a PlotCanvas set on initialization with all the options passed to Plot", ->
    x_range = new DataRange1d()
    y_range = new DataRange1d()
    p = new Plot({x_range: x_range, y_range: y_range})
    expect(p.plot_canvas).to.exist
    expect(p.plot_canvas.x_range).to.be.deep.equal x_range
    expect(p.plot_canvas.y_range).to.be.deep.equal y_range
