{expect} = require "chai"
utils = require "../../utils"

Paragraph = utils.require("models/widgets/paragraph").Model
ParagraphView = utils.require("models/widgets/paragraph").View


describe "Paragraph.View render", ->
  it "should set the margin to 0", ->
    p = new Paragraph()
    p_view = new p.default_view({ model: p })
    p_view.render()
    expected_style = "margin: 0px;"
    expect(p_view.$el.attr('style')).to.contain expected_style
