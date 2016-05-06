{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

SidePanel = utils.require("core/layout/side_panel").Model

{Document} = utils.require "document"

Annotation = utils.require("models/annotations/annotation").Model


describe "Annotation.Model", ->

  it "should have a SidePanel after add_panel is called; and panel should have document attached", ->
    annotation = new Annotation()
    annotation.attach_document(new Document())
    expect(annotation.panel).to.be.undefined
    annotation.add_panel('left')
    expect(annotation.panel).to.be.an.instanceOf(SidePanel)
    expect(annotation.panel.document).to.be.equal annotation.document
