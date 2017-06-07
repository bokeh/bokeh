{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Button} = utils.require("models/widgets/button")
{Document} = utils.require("document")

describe "Button.click", ->

  it "should trigger on click, if enabled", ->
    b = new Button()
    b.attach_document(new Document())

    spy = sinon.spy(b, 'trigger_event')

    expect(spy.called).to.be.false
    expect(b.clicks).to.be.equal 0
    b.click()
    expect(b.clicks).to.be.equal 1
    expect(spy.callCount).to.be.equal 1

  it "should not trigger on click, if disabled", ->
    b = new Button()
    b.disabled = true
    b.attach_document(new Document())

    spy = sinon.spy(b, 'trigger_event')

    expect(spy.called).to.be.false
    expect(b.clicks).to.be.equal 0
    b.click()
    expect(b.clicks).to.be.equal 0
    expect(spy.called).to.be.false
