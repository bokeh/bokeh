{expect} = require "chai"
utils = require "../../utils"

{Document} = utils.require("document")

{LayoutDOM} = utils.require("models/layouts/layout_dom")
{ToolbarBox, ProxyToolbar} = utils.require("models/tools/toolbar_box")
{Toolbar} = utils.require("models/tools/toolbar")
{ToolProxy} = utils.require("models/tools/tool_proxy")
{ResetTool} = utils.require("models/tools/actions/reset_tool")
{SaveTool} = utils.require("models/tools/actions/save_tool")
{SelectTool, SelectToolView} = utils.require("models/tools/gestures/select_tool")
{PanTool} = utils.require("models/tools/gestures/pan_tool")
{TapTool} = utils.require("models/tools/gestures/tap_tool")
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


class MultiToolView extends SelectToolView

class MultiTool extends SelectTool
  default_view: MultiToolView
  type: "MultiTool"
  tool_name: "Multi Tool"
  event_type: ["tap", "pan"]

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


describe "ProxyToolbar", ->

  describe "_init_tools method", ->

    beforeEach ->
      @multi = new MultiTool()
      @pan = new PanTool()
      @tap = new TapTool()

    it "should have proxied multi tool in gestures", ->
      toolbar = new ProxyToolbar({tools:[@multi, @tap, @pan]})
      expect(toolbar.gestures['multi'].tools.length).to.be.equal(1)
      expect(toolbar.gestures['multi'].tools[0]).to.be.an.instanceof(ToolProxy)
      expect(toolbar.gestures['multi'].tools[0].tools.length).to.be.equal(1)
      expect(toolbar.gestures['multi'].tools[0].tools[0]).to.be.equal(@multi)
