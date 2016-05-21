{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
Box = utils.require("models/layouts/box").Model
BoxView = utils.require("models/layouts/box").View

dom_left = 12
dom_top = 13
width = 100
height = 100
wl = 5
wr = 10
wt = 22
wb = 33

describe "Box.View", ->

  describe "initialize", ->
    afterEach ->
      utils.unstub_solver()

    beforeEach ->
      utils.stub_solver()

    # TODO(bird) - responsive is wip
    it.skip "should call model.variables_updated on initialization", ->
      # This seems to be very important for fixed layouts 
      # rendering properly, otherwise they end up with no height.
      test_box = new Box()
      test_box.attach_document(new Document())
      spy = sinon.spy(test_box, 'variables_updated')
      box_view = new test_box.default_view({ model: test_box })
      expect(spy.calledOnce).is.true

  describe "render", ->
    afterEach ->
      utils.unstub_solver()
      BoxView.prototype.initialize.restore()

    beforeEach ->
      solver_stubs = utils.stub_solver()
      @solver_suggest = solver_stubs['suggest']
      @test_box = new Box()
      @test_box.attach_document(new Document())
      @test_box._dom_left = {_value: dom_left}
      @test_box._dom_top = {_value: dom_top}
      @test_box._width = {_value: width}
      @test_box._height = {_value: height}
      @test_box._whitespace_left = {_value: wl}
      @test_box._whitespace_right = {_value: wr}
      @test_box._whitespace_top = {_value: wt}
      @test_box._whitespace_bottom = {_value: wb}
      sinon.stub(BoxView.prototype, 'initialize')

    # TODO(bird) - responsive is wip
    it.skip "should call update_constraints if the responsive mode is 'width'", ->
      box_view = new @test_box.default_view({ model: @test_box })
      spy = sinon.spy(box_view, 'update_constraints')
      box_view.render()
      expect(spy.calledOnce).is.true
      
    it "should set the appropriate positions and paddings on the element", ->
      box_view = new @test_box.default_view({ model: @test_box })
      box_view.render()
      expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
      expect(box_view.$el.attr('style')).to.be.equal expected_style

  describe "update_constraints", ->
    afterEach ->
      utils.unstub_solver()

    beforeEach ->
      solver_stubs = utils.stub_solver()
      @solver_suggest = solver_stubs['suggest']
      @test_box = new Box()
      @test_box.attach_document(new Document())

    # TODO(bird) - responsive is wip
    it.skip "should call suggest value with the elements scrollHeight if responsive_mode is width", ->
      @solver_suggest.reset()
      @test_box.responsive = 'width'
      box_view = new @test_box.default_view({ model: @test_box })
      box_view.child_views = {'child_view_1': {'el': {'scrollHeight': 222}}}
      expect(@solver_suggest.callCount).is.equal 1
      box_view.update_constraints()
      expect(@solver_suggest.callCount).is.equal 2
      expect(@solver_suggest.args[1]).to.be.deep.equal [@test_box._height, 222]

    # TODO(bird) - responsive is wip
    it.skip "should call suggest value with the model height and width if responsive_mode is fixed", ->
      @solver_suggest.reset()
      @test_box.responsive = 'fixed'
      @test_box.width = 22
      @test_box.height = 33
      box_view = new @test_box.default_view({ model: @test_box })
      expect(@solver_suggest.callCount).is.equal 2
      box_view.update_constraints()
      expect(@solver_suggest.callCount).is.equal 4
      expect(@solver_suggest.args[2]).to.be.deep.equal [@test_box._width, 22]
      expect(@solver_suggest.args[3]).to.be.deep.equal [@test_box._height, 33]


describe "Box.Model", ->

  describe "get_edit_variables", ->

    # TODO(bird) - responsive is wip so there's nothing with edit variables at the moment
    it.skip "should get edit_variables of children", ->
      child1 = new Box()
      child2 = new Box()
      parent_box = new Box({children: [child1, child2]})
      ev = parent_box.get_edit_variables()
      expect(ev.length).to.be.equal 3

      expect(ev[0].edit_variable).to.be.equal parent_box._height
      expect(ev[1].edit_variable).to.be.equal child1._height
      expect(ev[2].edit_variable).to.be.equal child2._height
