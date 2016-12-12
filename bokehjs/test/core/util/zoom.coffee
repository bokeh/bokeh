{expect} = require "chai"
utils = require "../../utils"

zoom = utils.require "core/util/zoom"

{CartesianFrame} = utils.require("models/canvas/cartesian_frame")
{Range1d} = utils.require("models/ranges/range1d")
{FactorRange} = utils.require("models/ranges/factor_range")
{CategoricalMapper} = utils.require("models/mappers/categorical_mapper")

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
      r = new FactorRange({factors: ['a', 'b', 'c', 'd', 'e']})
      expect(zoom.scale_highlow(r, 0.1)).to.deep.equal([0.75, 5.25])
      expect(zoom.scale_highlow(r, -0.1)).to.deep.equal([0.25, 5.75])
      expect(zoom.scale_highlow(r, 0)).to.deep.equal([0.5, 5.5])

    it "should scale factor ranges around given center if center is provided", ->
      r = new FactorRange({factors: ['a', 'b', 'c', 'd', 'e']})
      expect(zoom.scale_highlow(r, 0.1, 2)).to.deep.equal([0.65, 5.15])
      expect(zoom.scale_highlow(r, -0.1, 2)).to.deep.equal([0.35, 5.85])
      expect(zoom.scale_highlow(r, 0, 2)).to.deep.equal([0.5, 5.5])

  describe "get_info", ->

    it "should work with categorical mappers", ->
      cm = new CategoricalMapper({
        source_range: new FactorRange({factors: ['foo', 'bar', 'baz']})
        target_range: Range1d(20, 80)
      })
      info = zoom.get_info({foo: cm}, [20, 80])
      expect(info).to.deep.equal({foo: {start: 0.5, end: 3.5}})

      info = zoom.get_info({foo: cm}, [50, 60])
      expect(info).to.deep.equal({foo: {start: 2, end: 2.5}})
