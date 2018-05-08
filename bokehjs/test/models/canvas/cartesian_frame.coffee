{expect} = require "chai"

{CategoricalScale} = require("models/scales/categorical_scale")
{LinearScale} = require("models/scales/linear_scale")
{LogScale} = require("models/scales/log_scale")
{CartesianFrame} = require("models/canvas/cartesian_frame")
{DataRange1d} = require("models/ranges/data_range1d")
{FactorRange} = require("models/ranges/factor_range")
{Range1d} = require("models/ranges/range1d")
{Document} = require "document"
{Variable}  = require("core/layout/solver")

describe "CartesianFrame", ->

  it "should have 6 variables", ->
    c = new CartesianFrame({x_range: new Range1d({start: 0, end: 1}), y_range: new Range1d({start: 0, end: 1}), x_scale: new LinearScale(), y_scale: new LinearScale()})
    # These are inherited from LayoutDOM
    expect(c._top).to.be.an.instanceOf(Variable)
    expect(c._bottom).to.be.an.instanceOf(Variable)
    expect(c._left).to.be.an.instanceOf(Variable)
    expect(c._right).to.be.an.instanceOf(Variable)
    expect(c._width).to.be.an.instanceOf(Variable)
    expect(c._height).to.be.an.instanceOf(Variable)

  it "should report default scales", ->
    c = new CartesianFrame({x_range: new Range1d({start: 0, end: 1}), y_range: new Range1d({start: 0, end: 1}), x_scale: new LinearScale(), y_scale: new LinearScale()})

    expect(c.xscales.default).to.not.be.undefined
    expect(c.yscales.default).to.not.be.undefined

  describe "_get_scales method", ->

    beforeEach ->
      @frame = new CartesianFrame({x_range: new Range1d(), y_range: new Range1d(), x_scale: new LinearScale(), y_scale: new LinearScale()})
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
