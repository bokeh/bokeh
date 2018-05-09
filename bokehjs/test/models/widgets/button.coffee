{expect} = require "chai"
sinon = require "sinon"

{Button} = require("models/widgets/button")
{Document} = require("document")

describe "Button.click", ->

  click = (view) ->
    view.el.querySelector('button').click()

  it "should trigger on click, if enabled", ->
    b = new Button()
    b.attach_document(new Document())
    bv = new b.default_view({model: b, parent: null})

    spy = sinon.spy(b, 'trigger_event')

    expect(spy.called).to.be.false
    expect(b.clicks).to.be.equal 0
    click(bv)
    expect(b.clicks).to.be.equal 1
    expect(spy.callCount).to.be.equal 1

  it "should not trigger on click, if disabled", ->
    b = new Button({disabled: true})
    b.attach_document(new Document())
    bv = new b.default_view({model: b, parent: null})

    spy = sinon.spy(b, 'trigger_event')

    expect(spy.called).to.be.false
    expect(b.clicks).to.be.equal 0
    click(bv)
    expect(b.clicks).to.be.equal 0
    expect(spy.called).to.be.false
