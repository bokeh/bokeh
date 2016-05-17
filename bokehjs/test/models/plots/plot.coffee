_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")

DataRange1d = utils.require("models/ranges/data_range1d").Model
PlotCanvas = utils.require("models/plots/plot_canvas").Model
Plot = utils.require("models/plots/plot").Model
PlotView = utils.require("models/plots/plot").View
Toolbar = utils.require("models/tools/toolbar").Model

describe "Plot.Model", ->

  beforeEach ->
    @x_range = new DataRange1d()
    @y_range = new DataRange1d()
    toolbar = new Toolbar()
    @p = new Plot({x_range: @x_range, y_range: @y_range, toolbar: toolbar})

  it "should have _horizontal set to false by default", ->
    expect(@p._horizontal).to.false

  it "should have a PlotCanvas set on initialization with all the options passed to Plot", ->
    expect(@p.plot_canvas()).to.exist
    expect(@p.plot_canvas().x_range).to.be.deep.equal @x_range
    expect(@p.plot_canvas().y_range).to.be.deep.equal @y_range

  it "should attach document to plot canvas when document is attached to it", ->
    expect(@p.plot_canvas().document).to.be.null
    doc = new Document()
    @p.attach_document(doc)
    expect(@p.plot_canvas().document).to.be.equal doc
