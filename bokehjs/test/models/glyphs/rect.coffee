{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{create_glyph_view} = require("./glyph_utils")
{Rect, RectView} = utils.require("models/glyphs/rect")
{PlotCanvasView} = utils.require("models/plots/plot_canvas")
{CanvasView} = utils.require("models/canvas/canvas")
{CartesianFrame} = utils.require("models/canvas/cartesian_frame")
{LinearMapper} = utils.require("models/mappers/linear_mapper")
{Range1d} = utils.require("models/ranges/range1d")

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

    describe "hit-testing", ->

      afterEach ->
        @canvas_set_dims_stub.restore()
        @plot_canvas_resize_stub.restore()

      beforeEach ->
        set_dims = (dims) ->
          @model._width._value = dims[0]
          @model._height._value = dims[1]
        @canvas_set_dims_stub = sinon.stub(CanvasView.prototype, 'set_dims', set_dims)
        
        resize = () ->
          @frame._width._value = @canvas._width._value
          @frame._height._value = @canvas._height._value
        @plot_canvas_resize_stub = sinon.stub(PlotCanvasView.prototype, 'resize', resize)

      describe "_hit_point", ->

        beforeEach ->
          @set_mappers = (glyph_view) ->
            mapper = new LinearMapper({
              source_range: new Range1d({start: 0, end: 100})
              target_range: new Range1d({start: 0, end: 200})
            })
            glyph_view.renderer.xmapper = mapper
            glyph_view.renderer.ymapper = mapper
            glyph_view.renderer.plot_view.frame.x_mappers['default'] = mapper
            glyph_view.renderer.plot_view.frame.y_mappers['default'] = mapper

          @geometry1 = { vx: 190, vy: 220 }
          @geometry2 = { vx: 195, vy: 210 }
          @geometry3 = { vx: 186, vy: 186 }

        it "should return the indices of the rect that was hit", ->
          data = {x: [60, 100, 140], y: [60, 100, 140]}
          @glyph_view = create_glyph_view(@glyph, data)

          @set_mappers(@glyph_view)
          @glyph_view.map_data()

          result1 = @glyph_view._hit_point(@geometry1)
          result2 = @glyph_view._hit_point(@geometry2)
          result3 = @glyph_view._hit_point(@geometry3)

          expect(result1['1d'].indices).to.be.deep.equal([1])
          expect(result2['1d'].indices).to.be.deep.equal([1])
          expect(result3['1d'].indices).to.be.deep.equal([])

        it "should work when width and height units are 'screen'", ->
          data = {x: [60, 100, 140], y: [60, 100, 140]}
          @glyph_view = create_glyph_view(@glyph, data)

          @glyph.properties.width.units = "screen"
          @glyph.properties.height.units = "screen"

          @set_mappers(@glyph_view)
          @glyph_view.map_data()

          result1 = @glyph_view._hit_point(@geometry1)
          result2 = @glyph_view._hit_point(@geometry2)
          result3 = @glyph_view._hit_point(@geometry3)

          expect(result1['1d'].indices).to.be.deep.equal([])
          expect(result2['1d'].indices).to.be.deep.equal([1])
          expect(result3['1d'].indices).to.be.deep.equal([])

        it "should work when rects are rotated", ->
          @glyph = new Rect({
            x: {field: "x"}
            y: {field: "y"}
            width: {value: 10}
            height: {value: 20}
            angle: {value: -0.785398}
          })

          data = {x: [60, 100, 140], y: [60, 100, 140]}
          @glyph_view = create_glyph_view(@glyph, data)

          @set_mappers(@glyph_view)
          @glyph_view.map_data()

          result1 = @glyph_view._hit_point(@geometry1)
          result2 = @glyph_view._hit_point(@geometry2)
          result3 = @glyph_view._hit_point(@geometry3)

          expect(result1['1d'].indices).to.be.deep.equal([])
          expect(result2['1d'].indices).to.be.deep.equal([])
          expect(result3['1d'].indices).to.be.deep.equal([1])
