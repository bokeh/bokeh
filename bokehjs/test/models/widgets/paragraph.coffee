{expect} = require "chai"

{Paragraph} = require("models/widgets/paragraph")
{ParagraphView} = require("models/widgets/paragraph")
{Document} = require("document")

describe "Paragraph.View render", ->

  it "should set the margin to 0", ->
    p = new Paragraph()
    p.attach_document(new Document())
    p_view = new p.default_view({ model: p, parent: null })
    p_view.render()
    expected_style = "margin: 0px;"
    expect(p_view.el.querySelector('p').style.cssText).to.contain expected_style
