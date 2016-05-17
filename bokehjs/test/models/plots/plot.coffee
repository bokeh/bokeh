_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")

DataRange1d = utils.require("models/ranges/data_range1d").Model
Range1d = utils.require("models/ranges/range1d").Model
PlotCanvas = utils.require("models/plots/plot_canvas").Model
Plot = utils.require("models/plots/plot").Model
PlotView = utils.require("models/plots/plot").View
Toolbar = utils.require("models/tools/toolbar").Model

describe "Plot", ->
  beforeEach ->
    @x_range = new Range1d({start: 0, end:10})
    @y_range = new Range1d({start: 0, end: 10})
    toolbar = new Toolbar()
    @p = new Plot({x_range: @x_range, y_range: @y_range, toolbar: toolbar})

  describe "Plot.View", ->
    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()
      @p.attach_document(new Document())

    describe "render", ->

      it "should set the appropriate positions and paddings on the element", ->
        dom_left = 12
        dom_top = 13
        width = 80
        height = 100
        @p.set('dom_left', dom_left)
        @p.set('dom_top', dom_top)
        @p._width = {_value: width}
        @p._height = {_value: height}

        plot_view = new @p.default_view({ model: @p })
        plot_view.render()
        # Note we do not set margin & padding on Plot
        expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
        expect(plot_view.$el.attr('style')).to.be.equal expected_style

  describe "Plot.Model", ->

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
