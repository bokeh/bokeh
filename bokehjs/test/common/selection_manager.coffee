{expect} = require "chai"
utils = require "../utils"
sinon = require 'sinon'

Selector = utils.require("common/selector")
SelectionManager = utils.require("common/selection_manager")

hittest = utils.require "common/hittest"
SomeMarker = utils.require("models/markers/index").CircleX.Model
{Document} = utils.require("document")
Range1d = utils.require("models/ranges/range1d").Model
Plot = utils.require("models/plots/plot").Model
GlyphRenderer = utils.require("models/renderers/glyph_renderer").Model
ColumnDataSource = utils.require('models/sources/column_data_source').Model
PlotCanvasView = utils.require('models/plots/plot_canvas').View

describe "SelectionManager", ->

  empty_selection = hittest.create_hit_test_result()
  full_selection = hittest.create_hit_test_result()
  full_selection['1d'].indices = [1,2,3]

  it "should set `selector` and `inspector` attrs on initialization", ->
    sm = new SelectionManager()
    expect(sm.selector).to.be.instanceof(Selector)
    expect(sm.inspector).to.be.instanceof(Selector)

  describe "SelectionManager methods", ->

    afterEach ->
      utils.unstub_canvas()

    beforeEach ->
      utils.stub_canvas()

      doc = new Document()
      plot = new Plot({
        x_range: new Range1d({start: 0, end: 1})
        y_range: new Range1d({start: 0, end: 1})
      })
      doc.add_root(plot)
      plot_view = new plot.plot_canvas.default_view({model: plot.plot_canvas })
      sinon.stub(plot_view, 'update_constraints')

      @data_source = new ColumnDataSource()

      @sm = new SelectionManager({source: @data_source})

      glyph_renderer = new GlyphRenderer({
        glyph: new SomeMarker()
        data_source: @data_source
      })

      @glyph_renderer_view = new glyph_renderer.default_view({
        model: glyph_renderer
        plot_model: plot.plot_canvas
        plot_view: plot_view
      })

      sinon.stub(@glyph_renderer_view, 'hit_test').returns(full_selection)

    describe "SelectionManager.select", ->

      it "should update @selector.indices and @source.selected", ->
        did_hit = @sm.select('tool', @glyph_renderer_view, 'geometry', true)

        expect(@sm.selector.indices).to.be.deep.equal(full_selection)
        expect(@sm.source.selected).to.be.deep.equal(full_selection)
        expect(did_hit).to.be.true

    describe "SelectionManager.inspect", ->

      it "should update @inspector.indices and @source.inspected", ->
        did_hit = @sm.inspect('tool', @glyph_renderer_view, 'geometry', true)

        expect(@sm.inspector.indices).to.be.deep.equal(full_selection)
        expect(@sm.source.inspected).to.be.deep.equal(full_selection)
        expect(did_hit).to.be.true

    describe "SelectionManager.clear", ->

      it "should clear @selector.indices and @source.selected", ->
        @sm.select('tool', @glyph_renderer_view, 'geometry', true)
        @sm.clear()

        expect(@sm.selector.indices).to.be.deep.equal(empty_selection)
        expect(@sm.source.selected).to.be.deep.equal(empty_selection)
