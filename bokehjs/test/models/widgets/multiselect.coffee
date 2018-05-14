{expect} = require "chai"

{MultiSelect} = require("models/widgets/multiselect")
{CustomJS} = require("models/callbacks/customjs")
{Document} = require("document")

describe "MultiSelect", ->

  it "view should reflect the initial options", ->
    s = new MultiSelect({
        value: ["foo", "quux"],
        options: [ ["foo", "Foo"], ["bar", "BAR"],  ["baz", "bAz"], ["quux", "quux"] ]
    })
    s.attach_document(new Document())
    sv = new s.default_view({model: s, parent: null})
    sv.render()

    option = sv.el.querySelectorAll('option[value="foo"]')
    expect(option.length).to.be.equal 1
    expect(option[0].selected).to.be.true

    option = sv.el.querySelectorAll('option[value="bar"]')
    expect(option.length).to.be.equal 1
    expect(option[0].selected).to.be.false

    option = sv.el.querySelectorAll('option[value="baz"]')
    expect(option.length).to.be.equal 1
    expect(option[0].selected).to.be.false

    option = sv.el.querySelectorAll('option[value="quux"]')
    expect(option.length).to.be.equal 1
    expect(option[0].selected).to.be.true
