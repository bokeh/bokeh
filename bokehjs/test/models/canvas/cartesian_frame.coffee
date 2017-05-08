{expect} = require "chai"
utils = require "../../utils"

{CategoricalScale} = utils.require("models/scales/categorical_scale")
{LinearScale} = utils.require("models/scales/linear_scale")
{LogScale} = utils.require("models/scales/log_scale")
{CartesianFrame} = utils.require("models/canvas/cartesian_frame")
{DataRange1d} = utils.require("models/ranges/data_range1d")
{FactorRange} = utils.require("models/ranges/factor_range")
{Range1d} = utils.require("models/ranges/range1d")
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

describe "CartesianFrame", ->

  it "should have 6 variables", ->
    c = new CartesianFrame({x_range: Range1d(0, 1), y_range: Range1d(0, 1)})
    # These are inherited from LayoutDOM
    expect(c._top).to.be.an.instanceOf(Variable)
    expect(c._bottom).to.be.an.instanceOf(Variable)
    expect(c._left).to.be.an.instanceOf(Variable)
    expect(c._right).to.be.an.instanceOf(Variable)
    expect(c._width).to.be.an.instanceOf(Variable)
    expect(c._height).to.be.an.instanceOf(Variable)

  it "should should return 8 constraints", ->
    c = new CartesianFrame({x_range: Range1d(0, 1), y_range: Range1d(0, 1)})
    expect(c.get_constraints().length).to.be.equal 8

  it "should report default scales", ->
    c = new CartesianFrame({x_range: Range1d(0, 1), y_range: Range1d(0, 1)})

    expect(c.xscales.default).to.not.be.undefined
    expect(c.yscales.default).to.not.be.undefined

  it "should report deprecated *_mappers", ->
    c = new CartesianFrame({x_range: Range1d(0, 1), y_range: Range1d(0, 1)})

    expect(c.x_mappers).to.be.deep.equal c.xscales
    expect(c.y_mappers).to.be.deep.equal c.yscales

  describe "_get_scales method", ->

    beforeEach ->
      @frame = new CartesianFrame({x_range: Range1d(), y_range: Range1d()})
      @frame_range = Range1d(0, 100)

    it "should return scale if defined", ->
      scale = new LogScale()
      ranges = {"default": new Range1d()}
      scales = @frame._get_scales(scale, ranges, @frame_range)
      expect(scales["default"]).to.be.instanceof(LogScale)

    it "should return LinearScale as default for Range1d", ->
      scale = undefined
      ranges = {"default": new Range1d()}
      scales = @frame._get_scales(scale, ranges, @frame_range)
      expect(scales["default"]).to.be.instanceof(LinearScale)

    it "should return LinearScale as default for DataRange1d", ->
      scale = undefined
      ranges = {"default": new DataRange1d()}
      scales = @frame._get_scales(scale, ranges, @frame_range)
      expect(scales["default"]).to.be.instanceof(LinearScale)

    it "should return CategoricalScale as default for FactorRange", ->
      scale = undefined
      ranges = {"default": new FactorRange()}
      scales = @frame._get_scales(scale, ranges, @frame_range)
      expect(scales["default"]).to.be.instanceof(CategoricalScale)
