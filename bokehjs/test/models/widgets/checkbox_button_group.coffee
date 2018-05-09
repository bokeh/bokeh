{expect} = require "chai"
sinon = require "sinon"

{CheckboxButtonGroup} = require("models/widgets/checkbox_button_group")
{CustomJS} = require("models/callbacks/customjs")
{Document} = require("document")

describe "CheckboxButtonGroup", ->

  describe "change_input", ->

    it "should add arg to active if not present", ->
      g = new CheckboxButtonGroup({active: [0,2]})
      g.change_input(1)
      expect(g.active).to.deep.equal [0,1,2]

    it "should remove arg from active if is present", ->
      g = new CheckboxButtonGroup({active: [0,1,2]})
      g.change_input(1)
      expect(g.active).to.deep.equal [0,2]
      g.change_input(2)
      expect(g.active).to.deep.equal [0]

    it "should call a callback if present", ->
      cb = new CustomJS()
      spy = sinon.spy(cb, 'execute')
      g = new CheckboxButtonGroup({active: [0,1,2], callback: cb})
      g.change_input(1)
      expect(spy.calledOnce).to.be.true
      expect(spy.calledWith(g)).to.be.true

    it "should trigger on change", ->
      g = new CheckboxButtonGroup({active: [0,1,2], labels: ["foo", "bar", "baz"]})
      g.attach_document(new Document())
      gv = new g.default_view({model: g, parent: null})
      spy = sinon.spy(g, 'change_input')
      gv.render()
      expect(spy.called).to.be.false
      expect(g.active).to.be.deep.equal [0,1,2]

      input = gv.el.querySelectorAll('input[value="0"]')
      expect(input.length).to.be.equal 1
      input[0].click()

      expect(spy.callCount).to.be.equal 1
      expect(g.active).to.be.deep.equal [1,2]
