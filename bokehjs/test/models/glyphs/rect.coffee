{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{create_glyph_view} = require("./glyph_utils")
{Rect, RectView} = utils.require('models/glyphs/rect')

describe "Glyph (using Rect as a concrete Glyph)", ->

  describe "GlyphView", ->

    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()
      @stub.restore()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()

      @stub = sinon.stub(RectView.prototype, '_bounds', (bounds) -> bounds )

      @glyph = new Rect({
        x: {field: "x"}
        y: {field: "y"}
      })

    it "should calculate bounds based on data", ->
      data = {x: [1, 2, 3, 4], y: [-20, 10, 0, 30]}
      glyph_view = create_glyph_view(@glyph, data)
      bounds = glyph_view.bounds()

      expect(bounds).to.be.deep.equal({ minX: 1, minY: -20, maxX: 4, maxY: 30 })

    it "should calculate log bounds based on data values > 0", ->
      data = {x: [1, 2, 3, 4], y: [-20, 0, 10, 30]}
      glyph_view = create_glyph_view(@glyph, data)
      log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.deep.equal({ minX: 1, minY: 10, maxX: 4, maxY: 30 })

    it "should calculate log bounds when NaNs are present", ->
      data = {x: [1, 2, 3, 4], y: [-20, 0, 10, NaN]}
      glyph_view = create_glyph_view(@glyph, data)
      log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.deep.equal({ minX: 1, minY: 10, maxX: 3, maxY: 10 })

describe "Rect", ->

  describe "RectView", ->

    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()

      @glyph = new Rect({
        x: {field: "x"}
        y: {field: "y"}
        width: {value: 10}
        height: {value: 20}
      })

    it "should calculate bounds based on data including width and height", ->
      data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      glyph_view = create_glyph_view(@glyph, data)
      bounds = glyph_view.bounds()

      expect(bounds).to.be.deep.equal({ minX: -5, minY: -10, maxX: 8, maxY: 13 })

    it "should calculate log bounds based on data including width and height", ->
      data = {x: [0, 1, 2, 3], y: [0, 1, 2, 3]}
      glyph_view = create_glyph_view(@glyph, data)
      log_bounds = glyph_view.log_bounds()

      expect(log_bounds).to.be.deep.equal({ minX: -4, minY: -9, maxX: 8, maxY: 13 })
