{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
{Toolbar} = utils.require("models/tools/toolbar")
{HoverTool} = utils.require("models/tools/inspectors/hover_tool")

describe "ToolbarView", ->

  afterEach ->
    utils.unstub_solver()

  beforeEach ->
    solver_stubs = utils.stub_solver()
    @solver_suggest = solver_stubs['suggest']
    doc = new Document()
    @test_tb = new Toolbar()
    @test_tb.attach_document(doc)

  it "render should set the appropriate positions and paddings on the element in box mode", ->
    dom_left = 12
    dom_top = 44
    width = 111
    height = 123
    @test_tb._dom_left.setValue(dom_left)
    @test_tb._dom_top.setValue(dom_top)
    @test_tb._width.setValue(width)
    @test_tb._height.setValue(height)
    @test_tb.sizing_mode = 'stretch_both'

    tb_view = new @test_tb.default_view({ model: @test_tb, parent: null })
    tb_view.render()
    expected_style = "left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
    expect(tb_view.el.style.cssText).to.be.equal expected_style

  it "render should not render any styling in fixed mode", ->
    dom_left = 12
    dom_top = 44
    width = 111
    height = 123
    @test_tb._dom_left.setValue(dom_left)
    @test_tb._dom_top.setValue(dom_top)
    @test_tb._width.setValue(width)
    @test_tb._height.setValue(height)
    @test_tb.sizing_mode = 'fixed'

    tb_view = new @test_tb.default_view({ model: @test_tb, parent: null })
    tb_view.render()
    expect(tb_view.el.style.cssText).to.be.equal("")


describe "Toolbar", ->

  it "should have 6 variables", ->
    tb = new Toolbar()
    expect(tb._top).to.be.an.instanceOf(Variable)
    expect(tb._bottom).to.be.an.instanceOf(Variable)
    expect(tb._left).to.be.an.instanceOf(Variable)
    expect(tb._right).to.be.an.instanceOf(Variable)
    expect(tb._width).to.be.an.instanceOf(Variable)
    expect(tb._height).to.be.an.instanceOf(Variable)

  it "should should return 9 constraints", ->
    # 9 constraints - 8 from LayoutDOM + 1 for sizeable
    tb = new Toolbar()
    tb._sizeable = tb._width
    expect(tb.get_constraints().length).to.be.equal 9

  it "should not set edit_variables", ->
    tb = new Toolbar()
    ev = tb.get_editables()
    expect(ev.length).to.be.equal 0

  describe "_init_tools method", ->

    beforeEach ->
      @hover_1 = new HoverTool()
      @hover_2 = new HoverTool()
      @hover_3 = new HoverTool()

    it "should set inspect tools as array on Toolbar.inspector property", ->
      toolbar = new Toolbar({tools:[@hover_1, @hover_2, @hover_3]})
      expect(toolbar.inspectors).to.deep.equal([@hover_1, @hover_2, @hover_3])

    it "should have all inspect tools active when active_inspect='auto'", ->
      toolbar = new Toolbar({tools:[@hover_1, @hover_2, @hover_3], active_inspect: 'auto'})
      expect(@hover_1.active).to.be.true
      expect(@hover_2.active).to.be.true
      expect(@hover_3.active).to.be.true

    it "should have arg inspect tool active when active_inspect=tool instance", ->
      toolbar = new Toolbar({tools:[@hover_1, @hover_2, @hover_3], active_inspect: @hover_1})
      expect(@hover_1.active).to.be.true
      expect(@hover_2.active).to.be.false
      expect(@hover_3.active).to.be.false

    it "should have args inspect tools active when active_inspect=Array(tools)", ->
      toolbar = new Toolbar({tools:[@hover_1, @hover_2, @hover_3], active_inspect: [@hover_1, @hover_2]})
      expect(@hover_1.active).to.be.true
      expect(@hover_2.active).to.be.true
      expect(@hover_3.active).to.be.false

    it "should have none inspect tools active when active_inspect=null)", ->
      toolbar = new Toolbar({tools:[@hover_1, @hover_2, @hover_3], active_inspect: null})
      expect(@hover_1.active).to.be.false
      expect(@hover_2.active).to.be.false
      expect(@hover_3.active).to.be.false
