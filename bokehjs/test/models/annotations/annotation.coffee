{expect} = require "chai"

{SidePanel} = require("core/layout/side_panel")

{Document} = require "document"

{Annotation} = require("models/annotations/annotation")


describe "Annotation", ->

  beforeEach ->
    @annotation = new Annotation()
    @annotation.attach_document(new Document())

  it "should have a SidePanel after add_panel is called; and panel should have document attached", ->
    expect(@annotation.panel).to.be.undefined
    @annotation.add_panel('left')
    expect(@annotation.panel).to.be.an.instanceOf(SidePanel)
    expect(@annotation.panel.document).to.be.equal @annotation.document

  it "should have level of overlay if in side panel", ->
    expect(@annotation.level).to.be.equal "annotation"
    @annotation.add_panel('left')
    expect(@annotation.level).to.be.equal "overlay"
