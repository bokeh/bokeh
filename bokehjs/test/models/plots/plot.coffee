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
      solver_stubs = utils.stub_solver()
      @solver_suggest = solver_stubs['suggest']
      @p.attach_document(new Document())

    it "render should set the appropriate positions and paddings on the element when it is mode box", ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @p._dom_left = {_value: dom_left}
      @p._dom_top = {_value: dom_top}
      @p._width = {_value: width}
      @p._height = {_value: height}
      @p.responsive = 'box'
      plot_view = new @p.default_view({ model: @p })
      plot_view.render()
      # Note we do not set margin & padding on Plot
      expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
      expect(plot_view.$el.attr('style')).to.be.equal expected_style

    it "should call suggest value with the model height and width if responsive_mode is box_ar", ->
      @p.responsive = 'box_ar'
      plot_view = new @p.default_view({ model: @p })
      sinon.stub(plot_view, 'get_width_height').returns([34, 77])
      @solver_suggest.reset()
      plot_view.render()
      expect(@solver_suggest.callCount).is.equal 2
      expect(@solver_suggest.args[0]).to.be.deep.equal [@p._width, 34]
      expect(@solver_suggest.args[1]).to.be.deep.equal [@p._height, 77]

    it "get_height should return the height from the aspect ratio", ->
      @p.width = 22
      @p.height = 44
      plot_view = new @p.default_view({ model: @p })
      @p._width = {_value: 33}
      expect(plot_view.get_height()).to.be.equal 66

    it "get_width should return the width from the aspect ratio", ->
      @p.width = 2
      @p.height = 10
      plot_view = new @p.default_view({ model: @p })
      @p._height= {_value: 100}
      expect(plot_view.get_width()).to.be.equal 20

    it "get_width should return the width from the aspect ratio", ->
      @p.width = 2
      @p.height = 10
      plot_view = new @p.default_view({ model: @p })
      @p._height= {_value: 100}
      expect(plot_view.get_width()).to.be.equal 20

    it "get_width_height should return a constrained width if plot is landscape oriented", ->
      @p.width = 4
      @p.height = 2
      plot_view = new @p.default_view({ model: @p })
      plot_view.el = {'parentNode': {'clientWidth': 56, 'clientHeight': 49}}
      [w, h] = plot_view.get_width_height()
      expect(w).to.be.equal 56
      expect(h).to.be.equal 56 / (4/2)

    it "get_width_height should return a constrained height if plot is portrait oriented", ->
      @p.width = 3
      @p.height = 5
      plot_view = new @p.default_view({ model: @p })
      plot_view.el = {'parentNode': {'clientWidth': 56, 'clientHeight': 49}}
      [w, h] = plot_view.get_width_height()
      expect(h).to.be.equal 49
      expect(w).to.be.equal 49 * (3/5)
      

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

    describe "get_constrained_variables", ->
      beforeEach ->
        plot_canvas = @p.plot_canvas()
        # Visual alignment is dominated by the plot_canvas so a number of the 
        # constraints come from there - whilst others come from the plot container.
        @expected_constrained_variables = {
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
          'on-edge-align-top' : plot_canvas._top
          'on-edge-align-bottom' : plot_canvas._height_minus_bottom
          'on-edge-align-left' : plot_canvas._left
          'on-edge-align-right' : plot_canvas._width_minus_right
          'box-equal-size-top' : plot_canvas._top
          'box-equal-size-bottom' : plot_canvas._height_minus_bottom
          'box-equal-size-left' : plot_canvas._left
          'box-equal-size-right' : plot_canvas._width_minus_right
          'box-cell-align-top' : plot_canvas._top
          'box-cell-align-bottom' : plot_canvas._height_minus_bottom
          'box-cell-align-left' : plot_canvas._left
          'box-cell-align-right' : plot_canvas._width_minus_right
        }

      it "should return correct constrained_variables in box mode", ->
        @p.responsive = 'box'
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

      it "should return correct constrained_variables in width_ar mode", ->
        @p.responsive = 'width_ar'
        expected_constrained_variables = _.omit(@expected_constrained_variables, ['height'])
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal expected_constrained_variables

      it "should return correct constrained_variables in height_ar mode", ->
        @p.responsive = 'height_ar'
        expected_constrained_variables = _.omit(@expected_constrained_variables, ['width'])
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal expected_constrained_variables

      it "should return correct constrained_variables in fixed mode", ->
        @p.responsive = 'fixed'
        expected_constrained_variables = _.omit(@expected_constrained_variables, ['height', 'width', 'box-equal-size-left', 'box-equal-size-right'])
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal expected_constrained_variables
