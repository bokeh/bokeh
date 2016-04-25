{expect} = require "chai"
utils = require "../../utils"

Plot = utils.require("models/plots/plot").Model
DataRange1d = utils.require("models/ranges/data_range1d").Model
LayoutCanvas = utils.require("core/layout/layout_canvas").Model
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

describe "Plot.Model", ->

  it "should have a four LayoutCanvass after _doc_attached is called", ->
    p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d()})
    expect(p.above_panel).to.be.undefined
    expect(p.below_panel).to.be.undefined
    expect(p.left_panel).to.be.undefined
    expect(p.right_panel).to.be.undefined
    p.document = new Document()
    p._doc_attached()
    expect(p.above_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.below_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.left_panel).to.be.an.instanceOf(LayoutCanvas)
    expect(p.right_panel).to.be.an.instanceOf(LayoutCanvas)
