{expect} = require "chai"
utils = require "../../utils"
sinon = require "sinon"

{Strength, Variable}  = utils.require("core/layout/solver")

{Document} = utils.require("document")
{Toolbar} = utils.require("models/tools/toolbar")
{HoverTool} = utils.require("models/tools/inspectors/hover_tool")

describe "Toolbar", ->

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
