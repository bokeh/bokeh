_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
Box = utils.require("models/layouts/box").Model
BoxView = utils.require("models/layouts/box").View


describe "Box.Model", ->

  describe "get_edit_variables", ->

    it "should get edit_variables of children", ->
      child1 = new Box(responsive: 'fixed')
      child2 = new Box(responsive: 'fixed')
      parent_box = new Box({children: [child1, child2], responsive: 'fixed'})
      ev = parent_box.get_edit_variables()
      expect(ev.length).to.be.equal 6

      evs = _.pluck(ev, 'edit_variable')
      expect(parent_box._height in evs).is.true
      expect(parent_box._width in evs).is.true
      expect(child1._height in evs).is.true
      expect(child1._width in evs).is.true
      expect(child2._height in evs).is.true
      expect(child2._width in evs).is.true
