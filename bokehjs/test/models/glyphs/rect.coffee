{expect} = require "chai"
sinon = require "sinon"

{create_glyph_view, set_scales} = require("./glyph_utils")
{Rect, RectView} = require("models/glyphs/rect")
{LinearScale} = require("models/scales/linear_scale")
{Range1d} = require("models/ranges/range1d")

describe "Glyph (using Rect as a concrete Glyph)", ->

  describe "GlyphView", ->

    afterEach ->
      @stub.restore()

    beforeEach ->
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

    it "should hit test rects against an index", ->

      data = {x: [20, 40, 60], y: [10, 10, 50]}
      glyph = new Rect({
        x: {field: "x"}
        y: {field: "y"}
        width: {value: 10}
        height: {value: 20}
      })

      glyph_view = create_glyph_view(glyph, data)
      set_scales(glyph_view, "linear")
      glyph_view.map_data()

      # rect is XYGlyph, will only put centers in index, box glyphs will put entire box
      geometry1 = { sx0: 0,  sy0: 200, sx1: 40,  sy1: 180}
      geometry2 = { sx0: 60, sy0: 210, sx1: 80,  sy1: 150}
      geometry3 = { sx0: 0,  sy0:  50, sx1: 200, sy1:  59}

      result1 = glyph_view._hit_rect_against_index(geometry1)
      result2 = glyph_view._hit_rect_against_index(geometry2)
      result3 = glyph_view._hit_rect_against_index(geometry3)

      expect(result1['1d'].indices).to.be.deep.equal([0])
      expect(result2['1d'].indices).to.be.deep.equal([1])
      expect(result3['1d'].indices).to.be.deep.equal([])

describe "Rect", ->

  describe "RectView", ->

    beforeEach ->
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

    it "`_map_data` should correctly map data if width and height units are 'data'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      set_scales(glyph_view, "linear")
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal(Float64Array.of(20))
      expect(glyph_view.sh).to.be.deep.equal(Float64Array.of(40))

    it "`_map_data` should correctly map data if width and height units are 'screen'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      glyph_view.model.properties.width.units = "screen"
      glyph_view.model.properties.height.units = "screen"

      set_scales(glyph_view, "linear")
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal([10])
      expect(glyph_view.sh).to.be.deep.equal([20])

    it "`_map_data` should map values for x0 and y1 when width/height units are 'data'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal(Float64Array.of([0]))
      expect(glyph_view.sy1).to.be.deep.equal(Float64Array.of([0]))

    it "`_map_data` should map values for x0 and y1 when width/height units are 'screen'", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      glyph_view.model.properties.width.units = "screen"
      glyph_view.model.properties.height.units = "screen"

      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal(Float64Array.of(-5))
      expect(glyph_view.sy1).to.be.deep.equal(Float64Array.of(-10))

    it "`_map_data` should map values for x0 and y1 with reversed ranges", ->
      data = {x: [1], y: [2]}
      glyph_view = create_glyph_view(@glyph, data)

      set_scales(glyph_view, "linear", true)
      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal(Float64Array.of([188]))
      # XXX? expect(glyph_view.sy1).to.be.deep.equal({'0': -216})

    ### XXX
    it "`_map_data` should map values for x0 and y1 with FactorRanges", ->
      glyph = new Rect({
        x: {field: "x"}
        y: {field: "y"}
        width: {value: 0.5}
        height: {value: 0.5}
      })
      data = {x: ['a'], y: ['b']}
      glyph_view = create_glyph_view(glyph, data)
      glyph_view.map_data()
      expect(glyph_view.sx0).to.be.deep.equal({'0': 25})
      expect(glyph_view.sy1).to.be.deep.equal({'0': 25})
    ###

    it "`_map_data` should map values for sw and sh when a height is 0", ->
      glyph = new Rect({
        x: {field: "x"}
        y: {field: "y"}
        width: {value: 10}
        height: {field: "h"}
      })
      data = {x: [5], y: [5], h: [0]}
      glyph_view = create_glyph_view(glyph, data)

      set_scales(glyph_view, "linear")
      glyph_view.map_data()
      expect(glyph_view.sw).to.be.deep.equal(Float64Array.of(20))
      expect(glyph_view.sh).to.be.deep.equal(Float64Array.of(0))

    describe "hit-testing", ->

      describe "_hit_point", ->

        beforeEach ->
          @geometry1 = { sx: 190, sy: -20 }
          @geometry2 = { sx: 195, sy: -10 }
          @geometry3 = { sx: 186, sy:  14 }

          @geometry4 = { sx: 201.0, sy: 4.5 }
          @geometry5 = { sx: 197.8, sy:  -4 }

        it "should return the indices of the rect that was hit", ->
          data = {x: [60, 100, 140], y: [60, 100, 140]}
          glyph_view = create_glyph_view(@glyph, data)

          set_scales(glyph_view, "linear")
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

          set_scales(glyph_view, "linear")
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

          set_scales(glyph_view, "linear")
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
            target_range: new Range1d({start: 200, end: 0})
          })

          glyph_view.renderer.xscale = xscale
          glyph_view.renderer.yscale = yscale
          glyph_view.renderer.plot_view.frame.xscales['default'] = xscale
          glyph_view.renderer.plot_view.frame.yscales['default'] = yscale
          glyph_view.map_data()

          result1 = glyph_view._hit_point({sx: 105, sy:   0})
          result2 = glyph_view._hit_point({sx: 105, sy: -20})
          result3 = glyph_view._hit_point({sx: 91,  sy:  14})

          expect(result1['1d'].indices).to.be.deep.equal([1])
          expect(result2['1d'].indices).to.be.deep.equal([])
          expect(result3['1d'].indices).to.be.deep.equal([1])

        it "should work when axis is log", ->
          data = {x: [1, 10, 100, 1000], y: [1, 10, 100, 1000]}
          glyph_view = create_glyph_view(@glyph, data)

          set_scales(glyph_view, "log")
          glyph_view.map_data()

          result4 = glyph_view._hit_point({ sx: 66.666,  sy: 133.333 })
          result5 = glyph_view._hit_point({ sx: 133.333, sy:  66.666 })

          expect(result4['1d'].indices).to.be.deep.equal([])
          expect(result5['1d'].indices).to.be.deep.equal([])
