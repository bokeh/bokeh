_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"

SidePanel = utils.require("core/layout/side_panel").Model

describe "SidePanel.Model", ->

  it "should should return 8 constraints", ->
    p = new SidePanel()
    p._doc_attached()
    expect(p.get_constraints().length).to.be.equal 8
    # TODO (bird) - it would be good if we could actually assert about the
    # constraints, but this is hard (impossible?) at the moment, so will have to do some
    # visual testing to make sure things line up.

