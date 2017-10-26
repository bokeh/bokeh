{expect} = require "chai"
utils = require "../../utils"

{Document} = utils.require("document")

{LayoutDOM} = utils.require("models/layouts/layout_dom")
{ToolbarBox} = utils.require("models/tools/toolbar_box")
{Toolbar} = utils.require("models/tools/toolbar")
{ResetTool} = utils.require("models/tools/actions/reset_tool")
{SaveTool} = utils.require("models/tools/actions/save_tool")
{CrosshairTool} = utils.require("models/tools/inspectors/crosshair_tool")
{HoverTool} = utils.require("models/tools/inspectors/hover_tool")

describe "ToolbarBoxView", ->


  it "should return null from get_width if toolbar is horizontal", ->
    toolbar = new Toolbar()
    box = new ToolbarBox({toolbar: toolbar, toolbar_location: "above"})
    box_view = new box.default_view({model: box, parent: null})
    expect(box_view.get_width()).to.be.null

  it "should return 30 from get_height if toolbar is horizontal", ->
    toolbar = new Toolbar()
    box = new ToolbarBox({toolbar: toolbar, toolbar_location: "above"})
    box_view = new box.default_view({model: box, parent: null})
    expect(box_view.get_height()).to.be.equal 30

  it "should return 30 from get_width if toolbar is vertical", ->
    toolbar = new Toolbar()
    box = new ToolbarBox({toolbar: toolbar, toolbar_location: "left"})
    box_view = new box.default_view({model: box, parent: null})
    expect(box_view.get_width()).to.be.equal 30

  it "should return 30 from get_height if toolbar is vertical", ->
    toolbar = new Toolbar()
    box = new ToolbarBox({toolbar: toolbar, toolbar_location: "left"})
    box_view = new box.default_view({model: box, parent: null})
    expect(box_view.get_height()).to.be.null

describe "ToolbarBox", ->

  it "should be an instance of LayoutDOM", ->
    box = new ToolbarBox()
    expect(box).to.be.an.instanceof(LayoutDOM)

  ### TODO
  it "should correctly merge multiple actions", ->
    reset1 = new ResetTool()
    reset2 = new ResetTool()
    save1 = new SaveTool()
    save2 = new SaveTool()
    box = new ToolbarBox({tools: [reset1, reset2, save1, save2]})
    expect(box._toolbar.actions.length).equal 2

  it "should correctly merge multiple inspectors", ->
    hover1 = new HoverTool()
    hover2 = new HoverTool()
    crosshair1 = new CrosshairTool()
    crosshair2 = new CrosshairTool()
    box = new ToolbarBox({tools: [hover1, hover2, crosshair1, crosshair2]})
    expect(box._toolbar.inspectors.length).equal 2
  ###
