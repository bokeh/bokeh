{expect} = require "chai"
sinon = require 'sinon'

{Document} = require("document")

{clone} = require("core/util/object")
{CustomJS} = require("models/callbacks/customjs")
{DataRange1d} = require("models/ranges/data_range1d")
{Range1d} = require("models/ranges/range1d")
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

    it "should not execute range callbacks on initialization", sinon.test () ->
      cb = new CustomJS()
      spy = this.spy(cb, 'execute')

      plot = new Plot({
         x_range: new Range1d({callback: cb})
         y_range: new Range1d({callback: cb})
      })
      expect(spy.called).to.be.false
