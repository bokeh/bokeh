{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{create_glyph_view} = require("./glyph_utils")
{Rect, RectView} = utils.require("models/glyphs/rect")
{PlotCanvasView} = utils.require("models/plots/plot_canvas")
{CanvasView} = utils.require("models/canvas/canvas")
{CartesianFrame} = utils.require("models/canvas/cartesian_frame")
{LinearScale} = utils.require("models/scales/linear_scale")
{LogScale} = utils.require("models/scales/log_scale")
{CategoricalScale} = utils.require("models/scales/categorical_scale")
{Range1d} = utils.require("models/ranges/range1d")
{FactorRange} = utils.require("models/ranges/factor_range")

describe "Glyph (using Rect as a concrete Glyph)", ->

  describe "GlyphView", ->

    afterEach ->
      utils.unstub_canvas()
      @stub.restore()

    beforeEach ->
      utils.stub_canvas()

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

    beforeEach ->
      utils.stub_canvas()

      @glyph = new Rect({
        x: {field: "x"}
        y: {field: "y"}
        width: {value: 10}
        height: {value: 20}
      })

      @set_scales = (glyph_view, type="linear") ->
        if type == "linear"
          scale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100})
            target_range: new Range1d({start: 0, end: 200})
          })
        else if type == "reverse"
          scale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100})
            target_range: new Range1d({start: 200, end: 0})
          })
        else if type == "log"
          scale = new LogScale({
            source_range: new Range1d({start: 1, end: 1000})
            target_range: new Range1d({start: 0, end: 200})
          })
        else
          scale = new CategoricalScale({
            source_range: new FactorRange({factors:['a', 'b'], range_padding: 0})
            target_range: new Range1d({start: 0, end: 200})
          })
        glyph_view.renderer.xscale = scale
        glyph_view.renderer.yscale = scale
        glyph_view.renderer.plot_view.frame.xscales['default'] = scale
        glyph_view.renderer.plot_view.frame.yscales['default'] = scale

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

    it "`_map_data` should correctly map data if width and height units are 'data'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      @set_scales(glyph_view)
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal([20])
      expect(glyph_view.sh).to.be.deep.equal([40])

    it "`_map_data` should correctly map data if width and height units are 'screen'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      glyph_view.model.properties.width.units = "screen"
      glyph_view.model.properties.height.units = "screen"

      @set_scales(glyph_view)
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal([10])
      expect(glyph_view.sh).to.be.deep.equal([20])

    it "`_map_data` should map values for x0 and y1 when width/height units are 'data'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal({'0': 0})
      expect(glyph_view.sy1).to.be.deep.equal({'0': 0})

    it "`_map_data` should map values for x0 and y1 when width/height units are 'screen'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      glyph_view.model.properties.width.units = "screen"
      glyph_view.model.properties.height.units = "screen"

      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal([-5])
      expect(glyph_view.sy1).to.be.deep.equal([-10])

    it "`_map_data` should map values for x0 and y1 with reversed ranges", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      @set_scales(glyph_view, "reverse")
      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal({'0': 188})
      expect(glyph_view.sy1).to.be.deep.equal({'0': -216})

    it "`_map_data` should map values for x0 and y1 with FactorRanges", ->
      glyph = new Rect({
        x: {field: "x"}
        y: {field: "y"}
        width: {value: 0.5}
        height: {value: 0.5}
      })
      data = {x: ['a'], y: ['b']}
      glyph_view = create_glyph_view(glyph, data)

      @set_scales(glyph_view, "categorical")
      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal({'0': 25})
      expect(glyph_view.sy1).to.be.deep.equal({'0': -175})

    describe "hit-testing", ->

      describe "_hit_point", ->

        beforeEach ->
          @geometry1 = { vx: 190, vy: 220 }
          @geometry2 = { vx: 195, vy: 210 }
          @geometry3 = { vx: 186, vy: 186 }

          @geometry4 = { vx: 201, vy: 195.5 }
          @geometry5 = { vx: 197.8, vy: 204 }

        it "should return the indices of the rect that was hit", ->
          data = {x: [60, 100, 140], y: [60, 100, 140]}
          glyph_view = create_glyph_view(@glyph, data)

          @set_scales(glyph_view)
          glyph_view.map_data()

          result1 = glyph_view._hit_point(@geometry1)
          result2 = glyph_view._hit_point(@geometry2)
          result3 = glyph_view._hit_point(@geometry3)

          expect(result1['1d'].indices).to.be.deep.equal([1])
          expect(result2['1d'].indices).to.be.deep.equal([1])
          expect(result3['1d'].indices).to.be.deep.equal([])

        it "should work when width and height units are 'screen'", ->
          data = {x: [60, 100, 140], y: [60, 100, 140]}
          glyph_view = create_glyph_view(@glyph, data)

          glyph_view.model.properties.width.units = "screen"
          glyph_view.model.properties.height.units = "screen"

          @set_scales(glyph_view)
          glyph_view.map_data()

          result1 = glyph_view._hit_point(@geometry1)
          result2 = glyph_view._hit_point(@geometry2)
          result3 = glyph_view._hit_point(@geometry3)

          expect(result1['1d'].indices).to.be.deep.equal([])
          expect(result2['1d'].indices).to.be.deep.equal([1])
          expect(result3['1d'].indices).to.be.deep.equal([])

        it "should work when rects are rotated", ->
          glyph = new Rect({
            x: {field: "x"}
            y: {field: "y"}
            width: {value: 10}
            height: {value: 20}
            angle: {value: -0.785398}
          })

          data = {x: [60, 100, 140], y: [60, 100, 140]}
          glyph_view = create_glyph_view(glyph, data)

          @set_scales(glyph_view)
          glyph_view.map_data()

          result1 = glyph_view._hit_point(@geometry1)
          result2 = glyph_view._hit_point(@geometry2)
          result3 = glyph_view._hit_point(@geometry3)

          expect(result1['1d'].indices).to.be.deep.equal([])
          expect(result2['1d'].indices).to.be.deep.equal([])
          expect(result3['1d'].indices).to.be.deep.equal([1])

        it "should work when rects are rotated and axes ranges are very different", ->
          glyph = new Rect({
            x: {field: "x"}
            y: {field: "y"}
            width: {value: 10}
            height: {value: 20}
            angle: {value: -0.785398}
          })

          data = {x: [60, 100, 140], y: [60, 100, 140]}
          glyph_view = create_glyph_view(glyph, data)

          xscale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100})
            target_range: new Range1d({start: 95, end: 105})
          })

          yscale = new LinearScale({
            source_range: new Range1d({start: 0, end: 100})
            target_range: new Range1d({start: 0, end: 200})
          })

          glyph_view.renderer.xscale = xscale
          glyph_view.renderer.yscale = yscale
          glyph_view.renderer.plot_view.frame.xscales['default'] = xscale
          glyph_view.renderer.plot_view.frame.yscales['default'] = yscale
          glyph_view.map_data()

          result1 = glyph_view._hit_point({vx: 105, vy: 200})
          result2 = glyph_view._hit_point({vx: 105, vy: 220})
          result3 = glyph_view._hit_point({vx: 91, vy: 186})

          expect(result1['1d'].indices).to.be.deep.equal([1])
          expect(result2['1d'].indices).to.be.deep.equal([])
          expect(result3['1d'].indices).to.be.deep.equal([1])

        it "should work when axis is log", ->
          data = {x: [1, 10, 100, 1000], y: [1, 10, 100, 1000]}
          glyph_view = create_glyph_view(@glyph, data)

          @set_scales(glyph_view, type="log")
          glyph_view.map_data()

          result4 = glyph_view._hit_point({ vx: 66.666, vy: 66.666 })
          result5 = glyph_view._hit_point({ vx: 133.333, vy: 133.333 })

          expect(result4['1d'].indices).to.be.deep.equal([])
          expect(result5['1d'].indices).to.be.deep.equal([])
