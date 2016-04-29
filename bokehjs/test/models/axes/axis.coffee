{expect} = require "chai"
utils = require "../../utils"

Axis = utils.require("models/axes/axis").Model
SidePanel = utils.require("core/layout/side_panel").Model
{Document} = utils.require "document"
{Variable}  = utils.require("core/layout/solver")

describe "Axis.Model", ->

  it "should have a SidePanel after _doc_attached is called", ->
    a = new Axis()
    a.document = new Document()
    expect(a.panel).to.be.undefined
    a._doc_attached()
    expect(a.panel).to.be.an.instanceOf(SidePanel)
