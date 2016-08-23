{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

ImageURL = utils.require("models/glyphs/image_url")
{Document} = utils.require "document"
Range1d = utils.require("models/ranges/range1d").Model
Plot = utils.require("models/plots/plot").Model
PlotCanvasView = utils.require("models/plots/plot_canvas").View
GlyphRenderer = utils.require("models/renderers/glyph_renderer").Model
ColumnDataSource = utils.require('models/sources/column_data_source').Model

describe "image_url renderer", ->

  describe "default creation", ->
    r = new ImageURL.Model()

    it "should have global_alpha=1.0", ->
      expect(r.get('global_alpha')).to.be.equal 1.0

    it "should have retry_attempts=0", ->
      expect(r.get('retry_attempts')).to.be.equal 0

    it "should have retry_timeout=0", ->
      expect(r.get('retry_timeout')).to.be.equal 0

describe "image_url view creation", ->

  afterEach ->
    utils.unstub_canvas()
    utils.unstub_solver()
    @stub.restore()

  beforeEach ->
    utils.stub_canvas()
    utils.stub_solver()
    @stub = sinon.stub(PlotCanvasView.prototype, 'update_constraints')

    doc = new Document()
    plot = new Plot({
      x_range: new Range1d({start: 0, end: 1})
      y_range: new Range1d({start: 0, end: 1})
    })
    doc.add_root(plot)
    plot_view = new plot.plot_canvas.default_view({ 'model': plot.plot_canvas })

    @image_url = new ImageURL.Model({
      x: 1
      y: 2
      w: 10
      h: 20
      url: 'photo.png'
    })

    @data_source = new ColumnDataSource()

    glyph_renderer = new GlyphRenderer({
      glyph: @image_url
      data_source: @data_source
    })

    glyph_renderer_view = new glyph_renderer.default_view({
      model: glyph_renderer
      plot_model: plot.plot_canvas
      plot_view: plot_view
    })

    @image_url_view = glyph_renderer_view.glyph

  describe "stuff", ->

    it "should do stuff", ->
      expect(@image_url_view._w).to.be.equal 5
