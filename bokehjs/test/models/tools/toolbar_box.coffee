{expect} = require "chai"

{Document} = require("document")

{LayoutDOM} = require("models/layouts/layout_dom")
{ToolbarBox, ProxyToolbar} = require("models/tools/toolbar_box")
{Toolbar} = require("models/tools/toolbar")
{ToolProxy} = require("models/tools/tool_proxy")
{CustomAction} = require("models/tools/actions/custom_action")
{ResetTool} = require("models/tools/actions/reset_tool")
{SaveTool} = require("models/tools/actions/save_tool")
{BoxEditTool} = require("models/tools/edit/box_edit_tool")
{PointDrawTool} = require("models/tools/edit/point_draw_tool")
{SelectTool, SelectToolView} = require("models/tools/gestures/select_tool")
{PanTool} = require("models/tools/gestures/pan_tool")
{TapTool} = require("models/tools/gestures/tap_tool")
{CrosshairTool} = require("models/tools/inspectors/crosshair_tool")
{HoverTool} = require("models/tools/inspectors/hover_tool")

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
  icon: "Multi Tool"
  tool_name: "Multi Tool"
  event_type: ["tap", "pan"]

describe "ToolbarBox", ->

  it "should be an instance of LayoutDOM", ->
    box = new ToolbarBox()
    expect(box).to.be.an.instanceof(LayoutDOM)


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
      expect(toolbar.gestures['multi'].tools[0].computed_icon).to.be.equal('Multi Tool')
      expect(toolbar.gestures['multi'].tools[0].tools.length).to.be.equal(1)
      expect(toolbar.gestures['multi'].tools[0].tools[0]).to.be.equal(@multi)

  describe "_merge_tools method", ->

    it "should correctly merge multiple actions", ->
      reset1 = new ResetTool()
      reset2 = new ResetTool()
      save1 = new SaveTool()
      save2 = new SaveTool()
      proxy_toolbar = new ProxyToolbar({tools: [reset1, reset2, save1, save2]})
      expect(proxy_toolbar.actions.length).equal 2

    it "should correctly merge multiple inspectors", ->
      hover1 = new HoverTool()
      hover2 = new HoverTool()
      crosshair1 = new CrosshairTool()
      crosshair2 = new CrosshairTool()
      proxy_toolbar = new ProxyToolbar({tools: [hover1, hover2, crosshair1, crosshair2]})
      expect(proxy_toolbar.inspectors.length).equal 2

    it "should avoid merge of multiple multi-gesture tools", ->
      pointdraw = new PointDrawTool()
      boxedit1 = new BoxEditTool()
      boxedit2 = new BoxEditTool()
      proxy_toolbar = new ProxyToolbar({tools: [pointdraw, boxedit1, boxedit2]})
      expect(proxy_toolbar.gestures.multi.tools.length).equal 3

    it "should avoid merge of multiple CustomAction tools", ->
      reset1 = new ResetTool()
      reset2 = new ResetTool()
      custom_action1 = new CustomAction()
      custom_action2 = new CustomAction()
      proxy_toolbar = new ProxyToolbar({tools: [reset1, reset2, custom_action1, custom_action2]})
      expect(proxy_toolbar.actions.length).equal 3
