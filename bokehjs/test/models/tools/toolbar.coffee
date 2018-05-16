{expect} = require "chai"

{Strength, Variable}  = require("core/layout/solver")

{Document} = require("document")
{Toolbar} = require("models/tools/toolbar")
{HoverTool} = require("models/tools/inspectors/hover_tool")
{SelectTool, SelectToolView} = require("models/tools/gestures/select_tool")
{PanTool} = require("models/tools/gestures/pan_tool")
{TapTool} = require("models/tools/gestures/tap_tool")

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


class MultiToolView extends SelectToolView

class MultiTool extends SelectTool
  default_view: MultiToolView
  type: "MultiTool"
  tool_name: "Multi Tool"
  event_type: ["tap", "pan"]


describe "Toolbar Multi Gesture Tool", ->

  describe "_init_tools method", ->

    beforeEach ->
      @multi = new MultiTool()
      @pan = new PanTool()
      @tap = new TapTool()

    it "should have multi inactive after initialization", ->
      toolbar = new Toolbar({tools:[@multi, @tap, @pan]})
      expect(@multi.active).to.be.false
      expect(@pan.active).to.be.true
      expect(@tap.active).to.be.true

    it "should have multi active if active_tap", ->
      toolbar = new Toolbar({tools:[@multi, @tap, @pan], active_tap: @multi})
      expect(@multi.active).to.be.true
      expect(@pan.active).to.be.false
      expect(@tap.active).to.be.false

    it "should have gestures inactive after toggling multi active", ->
      toolbar = new Toolbar({tools:[@multi, @tap, @pan]})
      expect(@multi.active).to.be.false
      expect(@pan.active).to.be.true
      expect(@tap.active).to.be.true
      @multi.active = true
      expect(@multi.active).to.be.true
      expect(@pan.active).to.be.false
      expect(@tap.active).to.be.false

    it "should have multi inactive after toggling tap active", ->
      toolbar = new Toolbar({tools:[@multi, @tap], active_tap: @multi})
      expect(@multi.active).to.be.true
      expect(@tap.active).to.be.false
      @tap.active = true
      expect(@multi.active).to.be.false
      expect(@tap.active).to.be.true

    it "should have multi inactive after toggling pan active", ->
      toolbar = new Toolbar({tools:[@multi, @pan], active_drag: @multi})
      expect(@multi.active).to.be.true
      expect(@pan.active).to.be.false
      @pan.active = true
      expect(@multi.active).to.be.false
      expect(@pan.active).to.be.true
