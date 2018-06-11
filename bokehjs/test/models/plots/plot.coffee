{expect} = require "chai"
sinon = require 'sinon'

{Document} = require("document")

{clone} = require("core/util/object")
{CustomJS} = require("models/callbacks/customjs")
{DataRange1d} = require("models/ranges/data_range1d")
{Range1d} = require("models/ranges/range1d")
{PlotCanvas} = require("models/plots/plot_canvas")
{Plot} = require("models/plots/plot")
{PlotView} = require("models/plots/plot")
{Toolbar} = require("models/tools/toolbar")

describe "Plot", ->
  beforeEach ->
    @x_range = new Range1d({start: 0, end:10})
    @y_range = new Range1d({start: 0, end: 10})
    toolbar = new Toolbar()
    @p = new Plot({x_range: @x_range, y_range: @y_range, toolbar: toolbar, title: null})

  describe "PlotView", ->

    beforeEach ->
      doc = new Document()
      doc.add_root(@p)

    it "render should set the appropriate positions and paddings on the element when it is mode box", sinon.test () ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @p._dom_left.setValue(dom_left)
      @p._dom_top.setValue(dom_top)
      @p._width.setValue(width)
      @p._height.setValue(height)
      @p.sizing_mode = 'stretch_both'
      plot_view = new @p.default_view({ model: @p, parent: null })
      plot_view.render()
      # Note we do not set margin & padding on Plot
      expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
      expect(plot_view.el.style.cssText).to.be.equal expected_style

    ###
    it "should call suggest value with the model height and width if sizing_mode is scale_both", sinon.test () ->
      @p.sizing_mode = 'scale_both'
      plot_view = new @p.default_view({ model: @p, parent: null })
      this.stub(plot_view, 'get_width_height').returns([34, 77])
      @solver_suggest.reset()
      plot_view.render()
      expect(@solver_suggest.callCount).is.equal 2
      expect(@solver_suggest.args[0]).to.be.deep.equal [@p._width, 34]
      expect(@solver_suggest.args[1]).to.be.deep.equal [@p._height, 77]
    ###

    it "get_height should return the height from the aspect ratio", sinon.test () ->
      @p.width = 22
      @p.height = 44
      plot_view = new @p.default_view({ model: @p, parent: null })
      @p._width.setValue(33)
      expect(plot_view.get_height()).to.be.equal 66

    it "get_width should return the width from the aspect ratio", sinon.test () ->
      @p.width = 2
      @p.height = 10
      plot_view = new @p.default_view({ model: @p, parent: null })
      @p._height.setValue(100)
      expect(plot_view.get_width()).to.be.equal 20

    it "get_width should return the width from the aspect ratio", sinon.test () ->
      @p.width = 2
      @p.height = 10
      plot_view = new @p.default_view({ model: @p, parent: null })
      @p._height.setValue(100)
      expect(plot_view.get_width()).to.be.equal 20

    ### XXX: If you write tests like this, expect this to change every time implementation changes.
    #        This needs to be updated, but that means rewriting this to use an actual DOM node.

    it "get_width_height should return a constrained width if plot is landscape oriented", sinon.test () ->
      @p.width = 4
      @p.height = 2
      plot_view = new @p.default_view({ model: @p, parent: null })
      plot_view.el = {'parentElement': {'clientWidth': 56, 'clientHeight': 49}}
      [w, h] = plot_view.get_width_height()
      expect(w).to.be.equal 56
      expect(h).to.be.equal 56 / (4/2)

    it "get_width_height should return a constrained height if plot is portrait oriented", sinon.test () ->
      @p.width = 3
      @p.height = 5
      plot_view = new @p.default_view({ model: @p, parent: null })
      plot_view.el = {'parentElement': {'clientWidth': 56, 'clientHeight': 49}}
      [w, h] = plot_view.get_width_height()
      expect(h).to.be.equal 49
      expect(w).to.be.equal 49 * (3/5)
    ###

    it "should set min_border_x to value of min_border if min_border_x is not specified", sinon.test () ->
      p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33})
      expect(p.min_border_top).to.be.equal 33.33
      expect(p.min_border_bottom).to.be.equal 33.33
      expect(p.min_border_left).to.be.equal 33.33
      expect(p.min_border_right).to.be.equal 33.33

    it "should set min_border_x to value of specified, and others to value of min_border", sinon.test () ->
      p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border: 33.33, min_border_left: 66.66})
      expect(p.min_border_top).to.be.equal 33.33
      expect(p.min_border_bottom).to.be.equal 33.33
      expect(p.min_border_left).to.be.equal 66.66
      expect(p.min_border_right).to.be.equal 33.33

    it "should set min_border_x to value of specified, and others to default min_border", sinon.test () ->
      p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), min_border_left: 4})
      # MIN_BORDER is 5
      expect(p.min_border_top).to.be.equal 5
      expect(p.min_border_bottom).to.be.equal 5
      expect(p.min_border_left).to.be.equal 4
      expect(p.min_border_right).to.be.equal 5

    it "should add the title to the list of renderers", sinon.test () ->
      # TODO(bird) Write this test.
      null

  describe "Plot", ->

    it "should have a PlotCanvas set on initialization with plot on it", sinon.test () ->
      expect(@p.plot_canvas).to.exist
      expect(@p.plot_canvas.plot).to.be.deep.equal @p

    it "should attach document to plot canvas when document is attached to it", sinon.test () ->
      expect(@p.plot_canvas.document).to.be.null
      doc = new Document()
      @p.attach_document(doc)
      expect(@p.plot_canvas.document).to.be.equal doc

    it "should not execute range callbacks on initialization", sinon.test () ->
      cb = new CustomJS()
      spy = this.spy(cb, 'execute')

      plot = new Plot({
         x_range: new Range1d({callback: cb})
         y_range: new Range1d({callback: cb})
      })
      expect(spy.called).to.be.false

    describe "get_constrained_variables", ->

      beforeEach ->
        plot_canvas = @p.plot_canvas
        # Visual alignment is dominated by the plot_canvas so a number of the
        # constraints come from there - whilst others come from the plot container.
        @expected_constrained_variables = {
          # Constraints from Plot
          width: @p._width
          height: @p._height
          origin_x: @p._dom_left
          origin_y: @p._dom_top
          whitespace_top : @p._whitespace_top
          whitespace_bottom : @p._whitespace_bottom
          whitespace_left : @p._whitespace_left
          whitespace_right : @p._whitespace_right
          # Constraints from PlotCanvas
          on_edge_align_top : plot_canvas._top
          on_edge_align_bottom : plot_canvas._height_minus_bottom
          on_edge_align_left : plot_canvas._left
          on_edge_align_right : plot_canvas._width_minus_right
          box_equal_size_top : plot_canvas._top
          box_equal_size_bottom : plot_canvas._height_minus_bottom
          box_equal_size_left : plot_canvas._left
          box_equal_size_right : plot_canvas._width_minus_right
          box_cell_align_top : plot_canvas._top
          box_cell_align_bottom : plot_canvas._height_minus_bottom
          box_cell_align_left : plot_canvas._left
          box_cell_align_right : plot_canvas._width_minus_right
        }

      it "should return correct constrained_variables in box mode", sinon.test () ->
        @p.sizing_mode = 'stretch_both'
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

      it "should return correct constrained_variables in scale_width mode", sinon.test () ->
        @p.sizing_mode = 'scale_width'
        expected_constrained_variables = clone(@expected_constrained_variables)
        delete expected_constrained_variables.height
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal expected_constrained_variables

      it "should return correct constrained_variables in scale_height mode", sinon.test () ->
        @p.sizing_mode = 'scale_height'
        expected_constrained_variables = clone(@expected_constrained_variables)
        delete expected_constrained_variables.width
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal expected_constrained_variables

      it "should return correct constrained_variables in fixed mode", sinon.test () ->
        @p.sizing_mode = 'fixed'
        expected_constrained_variables = clone(@expected_constrained_variables)
        delete expected_constrained_variables.height
        delete expected_constrained_variables.width
        delete expected_constrained_variables.box_equal_size_left
        delete expected_constrained_variables.box_equal_size_right
        constrained_variables = @p.get_constrained_variables()
        expect(constrained_variables).to.be.deep.equal expected_constrained_variables
