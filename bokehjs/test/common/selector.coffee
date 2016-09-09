{expect} = require "chai"
utils = require "../utils"
sinon = require 'sinon'

Selector = utils.require "common/selector"
hittest = utils.require "common/hittest"

hittest = utils.require "common/hittest"
SomeMarker = utils.require("models/markers/index").CircleX.Model
{Document} = utils.require("document")
Range1d = utils.require("models/ranges/range1d").Model
Plot = utils.require("models/plots/plot").Model
GlyphRenderer = utils.require("models/renderers/glyph_renderer").Model
ColumnDataSource = utils.require('models/sources/column_data_source').Model
# PlotCanvasView = utils.require('models/plots/plot_canvas').View

empty_selection = hittest.create_hit_test_result()
full_selection = hittest.create_hit_test_result()
full_selection['1d'].indices = [1,2,3]

describe "Selector module", ->

  afterEach ->
    utils.unstub_canvas()

  beforeEach ->
    utils.stub_canvas()

    @hit_indices_1 = hittest.create_hit_test_result()
    @hit_indices_1['1d'].indices = [0, 1, 2]

    @hit_indices_2 = hittest.create_hit_test_result()
    @hit_indices_2['1d'].indices = [7, 8, 9]

    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    doc.add_root(plot)
    plot_view = new plot.plot_canvas.default_view({model: plot.plot_canvas })
    sinon.stub(plot_view, 'update_constraints')

    @data_source = new ColumnDataSource()

    @selector = new Selector({source: @data_source})

    glyph_renderer = new GlyphRenderer({
      glyph: new SomeMarker()
      data_source: @data_source
    })

    @glyph_renderer_view = new glyph_renderer.default_view({
      model: glyph_renderer
      plot_model: plot.plot_canvas
      plot_view: plot_view
    })

  describe "Selector initialization", ->

    it "should set `indices` attribute as empty HitTestResult", ->
      expect(@selector.indices).to.deep.equal(empty_selection)

  describe "Selector._update method", ->

    it "should reset the `indices` attributes if append arg is false", ->
      # function signature is: _update(indices, final, append)
      @selector._update(@hit_indices_1, false, false)
      expect(@selector.indices).to.be.deep.equal(@hit_indices_1)

      @selector._update(@hit_indices_2, false, false)
      expect(@selector.indices).to.be.deep.equal(@hit_indices_2)

    it "should union the `1d` indices if append arg is true", ->
      # function signature is `Selector._update(indices, append, final)`
      @selector._update(@hit_indices_1, true, false)
      @selector._update(@hit_indices_2, true, false)
      expect(@selector.indices['1d'].indices).to.be.deep.equal([0,1,2,7,8,9])

      # also shouldn't mutate either indices arguments
      expect(@hit_indices_1['1d'].indices).to.be.deep.equal([0,1,2])
      expect(@hit_indices_2['1d'].indices).to.be.deep.equal([7,8,9])

    it "should concat the `2d` indices along key if append arg is true", ->
      hit_indices_1 = hittest.create_hit_test_result()
      hit_indices_1['2d'] = {3: [5, 6], 4: [7]}
      hit_indices_2 = hittest.create_hit_test_result()
      hit_indices_2['2d'] = {2: [1, 2], 3: [3]}

      # function signature is `Selector._update(indices, append, final)`
      @selector._update(hit_indices_1, true, false)
      expect(@selector.indices['2d']).to.be.deep.equal( {3: [5, 6], 4: [7]} )

      @selector._update(hit_indices_2, true, false)
      expect(@selector.indices['2d']).to.be.deep.equal( {3: [3, 5, 6], 2: [1, 2], 4: [7]})

  describe "SelectionManager.select", ->

    it "should update @selector.indices and @source.selected", ->
      sinon.stub(@glyph_renderer_view, 'hit_test').returns(full_selection)
      did_hit = @selector.select('tool', @glyph_renderer_view, 'geometry', true)

      expect(@selector.indices).to.be.deep.equal(full_selection)
      expect(@data_source.selected).to.be.deep.equal(full_selection)
      expect(did_hit).to.be.true

  describe "SelectionManager.inspect", ->

    it "should update @selector.indices and @source.inspected", ->
      sinon.stub(@glyph_renderer_view, 'hit_test').returns(full_selection)
      did_hit = @selector.inspect('tool', @glyph_renderer_view, 'geometry', true)

      expect(@selector.indices).to.be.deep.equal(full_selection)
      expect(@data_source.inspected).to.be.deep.equal(full_selection)
      expect(did_hit).to.be.true

  describe "Selector.clear method", ->
    it "should set `indices` attribute as empty HitTestResult", ->
      @selector.select('tool', @glyph_renderer_view, 'geometry', true)
      @selector.clear()

      expect(@selector.indices).to.deep.equal(empty_selection)
      expect(@data_source.selected).to.be.deep.equal(empty_selection)
