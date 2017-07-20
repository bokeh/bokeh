{expect} = require "chai"
utils = require "../../utils"

zoom = utils.require "core/util/zoom"

{CartesianFrame} = utils.require("models/canvas/cartesian_frame")
{Range1d} = utils.require("models/ranges/range1d")
{FactorRange} = utils.require("models/ranges/factor_range")
{CategoricalScale} = utils.require("models/scales/categorical_scale")

describe "zoom module", ->

  describe "scale_highlow", ->

    it "should scale continuous ranges around average center if no center is provided", ->
      r = Range1d(10, 20)
      expect(zoom.scale_highlow(r, 0.1)).to.deep.equal([10.5, 19.5])
      expect(zoom.scale_highlow(r, -0.1)).to.deep.equal([9.5, 20.5])
      expect(zoom.scale_highlow(r, 0)).to.deep.equal([10, 20])

    it "should scale continuous ranges around given center if center is provided", ->
      r = Range1d(10, 20)
      expect(zoom.scale_highlow(r, 0.1, 12)).to.deep.equal([10.2, 19.2])
      expect(zoom.scale_highlow(r, -0.1, 12)).to.deep.equal([9.8, 20.8])
      expect(zoom.scale_highlow(r, 0, 12)).to.deep.equal([10, 20])

    it "should scale factor ranges around average center if no center is provided", ->
      r = new FactorRange({factors: ['a', 'b', 'c', 'd', 'e'], range_padding: 0 })
      expect(zoom.scale_highlow(r, 0.1)).to.deep.equal([0.25, 4.75])
      expect(zoom.scale_highlow(r, -0.1)).to.deep.equal([-0.25, 5.25])
      expect(zoom.scale_highlow(r, 0)).to.deep.equal([0.0, 5.0])

    it "should scale factor ranges around given center if center is provided", ->
      r = new FactorRange({factors: ['a', 'b', 'c', 'd', 'e'], range_padding: 0 })
      expect(zoom.scale_highlow(r, 0.1, 2)).to.deep.equal([0.2, 4.7])
      expect(zoom.scale_highlow(r, -0.1, 2)).to.deep.equal([-0.2, 5.3])
      expect(zoom.scale_highlow(r, 0, 2)).to.deep.equal([0, 5])

  describe "get_info", ->

    it "should work with categorical scales", ->
      cm = new CategoricalScale({
        source_range: new FactorRange({factors: ['foo', 'bar', 'baz'], range_padding: 0 })
        target_range: Range1d(20, 80)
      })
      info = zoom.get_info({foo: cm}, [20, 80])
      expect(info).to.deep.equal({foo: {start: 0, end: 3}})

      info = zoom.get_info({foo: cm}, [50, 60])
      expect(info).to.deep.equal({foo: {start: 1.5, end: 2}})
