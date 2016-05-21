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
        @p._dom_left = {_value: dom_left}
        @p._dom_top = {_value: dom_top}
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

  it "should return correct constrained_variables", ->
    # Visual alignment is dominated by the plot_canvas so
    # a number of the cosntraints come from there - whilst others
    # come from the plot container.
    plot_canvas = @p.plot_canvas()
    expected_constrainted_variables = {
      # Constraints from Plot
      'width': @p._width
      'height': @p._height
      'origin-x': @p._dom_left
      'origin-y': @p._dom_top
      'whitespace-top' : @p._whitespace_top
      'whitespace-bottom' : @p._whitespace_bottom
      'whitespace-left' : @p._whitespace_left
      'whitespace-right' : @p._whitespace_right
      # Constraints from PlotCanvas
      # edges
      'on-edge-align-top' : plot_canvas._top
      'on-edge-align-bottom' : plot_canvas._height_minus_bottom
      'on-edge-align-left' : plot_canvas._left
      'on-edge-align-right' : plot_canvas._width_minus_right
      # sizing
      'box-equal-size-top' : plot_canvas._top
      'box-equal-size-bottom' : plot_canvas._height_minus_bottom
      'box-equal-size-left' : plot_canvas._left
      'box-equal-size-right' : plot_canvas._width_minus_right
      # align between cells
      'box-cell-align-top' : plot_canvas._top
      'box-cell-align-bottom' : plot_canvas._height_minus_bottom
      'box-cell-align-left' : plot_canvas._left
      'box-cell-align-right' : plot_canvas._width_minus_right
    }
    constrained_variables = @p.get_constrained_variables()
    expect(constrained_variables).to.be.deep.equal expected_constrainted_variables
