{expect} = require "chai"

{CategoricalScale} = require("models/scales/categorical_scale")
{LinearScale} = require("models/scales/linear_scale")
{LogScale} = require("models/scales/log_scale")
{CartesianFrame} = require("models/canvas/cartesian_frame")
{DataRange1d} = require("models/ranges/data_range1d")
{FactorRange} = require("models/ranges/factor_range")
{Range1d} = require("models/ranges/range1d")
{Document} = require "document"

describe "CartesianFrame", ->

  it "should report default scales", ->
    frame = new CartesianFrame(
      new LinearScale(),
      new LinearScale(),
      new Range1d({start: 0, end: 1}),
      new Range1d({start: 0, end: 1}))

    expect(frame.xscales.default).to.not.be.undefined
    expect(frame.yscales.default).to.not.be.undefined

  describe "_get_scales method", ->

    beforeEach ->
      @frame = new CartesianFrame(
        new LinearScale(),
        new LinearScale(),
        new Range1d(),
        new Range1d())
      @frame_range = new Range1d({start: 0, end: 100})

    it "should return scale if defined", ->
      # scale = new LinearScale()
      ranges = {"default": new Range1d()}
      scales = @frame._get_scales(@frame.x_scale, ranges, @frame_range)
      expect(scales["default"]).to.be.instanceof(LinearScale)
      expect(scales["default"].source_range).to.be.instanceof(Range1d)
      expect(scales["default"].target_range).to.be.instanceof(Range1d)

    it "should throw error for incompatible numeric scale and factor range", ->
      ranges = {"default": new FactorRange()}
      scale = new LinearScale()
      expect(() -> @frame._get_scales(scale, ranges, @frame_range)).to.throw(Error)

    it "should throw error for incompatible factor scale and numeric range", ->
      ranges = {"default": new Range1d()}
      scale = new CategoricalScale()
      expect(() -> @frame._get_scales(scale, ranges, @frame_range)).to.throw(Error)
