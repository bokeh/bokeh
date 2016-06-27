{expect} = require "chai"
utils = require "../../utils"

Paragraph = utils.require("models/widgets/paragraph").Model
ParagraphView = utils.require("models/widgets/paragraph").View
{Document} = utils.require("document")


describe "Paragraph.View render", ->

  afterEach ->
    utils.unstub_solver()

  beforeEach ->
    utils.stub_solver()

  it "should set the margin to 0", ->
    p = new Paragraph()
    p.attach_document(new Document())
    p_view = new p.default_view({ model: p })
    p_view.render()
    expected_style = "margin: 0;"
    expect(p_view.$el.find('p').attr('style')).to.contain expected_style
