{expect} = require "chai"

{ToolbarBase, ToolbarViewModel} = require("models/tools/toolbar_base")
{PanTool} = require("models/tools/gestures/pan_tool")


describe "ToolbarBase", ->

  describe "_active_change method", ->

    beforeEach ->
      # by default these tools are inactive
      [@pan_1, @pan_2] = [new PanTool(), new PanTool()]
      @toolbar_base = new ToolbarBase()
      @toolbar_base.gestures["pan"].tools = [new PanTool(), new PanTool()]

    it "should correctly activate tool with currently active tool", ->
      @pan_1.active = true
      @toolbar_base._active_change(@pan_1)
      expect(@pan_1.active).to.be.true
      expect(@pan_2.active).to.be.false
      expect(@toolbar_base.gestures["pan"].active).to.be.equal(@pan_1)

    it "should correctly deactivate tool", ->
      # activate the tool as setup
      @pan_1.active = true
      @toolbar_base._active_change(@pan_1)
      # now deactivate the tool
      @pan_1.active = false
      @toolbar_base._active_change(@pan_1)
      expect(@pan_1.active).to.be.false
      expect(@pan_2.active).to.be.false
      expect(@toolbar_base.gestures["pan"].active).to.be.null

    it "should correctly active tool and deactive currently active one", ->
      # activate the tool as setup
      @pan_1.active = true
      @toolbar_base._active_change(@pan_1)
      # now activate the other tool
      @pan_2.active = true
      @toolbar_base._active_change(@pan_2)
      expect(@pan_1.active).to.be.false
      expect(@pan_2.active).to.be.true
      expect(@toolbar_base.gestures["pan"].active).to.be.equal(@pan_2)


describe "ToolbarViewModel", ->

  describe "visible getter", ->

    beforeEach ->
      # autohide is false by default and visible is null
      @toolbar_view_model = new ToolbarViewModel()

    it "should be true if autohide is false and _visible isn't set", ->
      expect(@toolbar_view_model.autohide).to.be.false
      expect(@toolbar_view_model.visible).to.be.true

    it "should be true if autohide is false and _visible is true", ->
      @toolbar_view_model._visible = true
      expect(@toolbar_view_model.autohide).to.be.false
      expect(@toolbar_view_model.visible).to.be.true

    it "should be true if autohide is false and _visible is false", ->
      @toolbar_view_model._visible = false
      expect(@toolbar_view_model.autohide).to.be.false
      expect(@toolbar_view_model.visible).to.be.true

    it "should be false if autohide is true and _visible isn't set", ->
      @toolbar_view_model.autohide = true
      expect(@toolbar_view_model.autohide).to.be.true
      expect(@toolbar_view_model.visible).to.be.false

    it "should be true if autohide is true and _visible is true", ->
      @toolbar_view_model.autohide = true
      @toolbar_view_model._visible = true
      expect(@toolbar_view_model.autohide).to.be.true
      expect(@toolbar_view_model.visible).to.be.true

    it "should be false if autohide is true and _visible is false", ->
      @toolbar_view_model.autohide = true
      @toolbar_view_model._visible = false
      expect(@toolbar_view_model.autohide).to.be.true
      expect(@toolbar_view_model.visible).to.be.false
