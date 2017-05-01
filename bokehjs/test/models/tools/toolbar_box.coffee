{expect} = require "chai"
utils = require "../../utils"

{Document} = utils.require("document")

{Box} = utils.require("models/layouts/box")
{ToolbarBox} = utils.require("models/tools/toolbar_box")
{Toolbar} = utils.require("models/tools/toolbar")
{ResetTool} = utils.require("models/tools/actions/reset_tool")
{SaveTool} = utils.require("models/tools/actions/save_tool")
{CrosshairTool} = utils.require("models/tools/inspectors/crosshair_tool")
{HoverTool} = utils.require("models/tools/inspectors/hover_tool")

describe "ToolbarBoxView", ->

  beforeEach ->
    @box = new ToolbarBox()
    @box.attach_document(new Document())

  it "should return null from get_width if @_horizontal is not true", ->
    @box._horizontal = false
    @box_view = new @box.default_view({ model: @box, parent: null })
    expect(@box_view.get_width()).to.be.null

  it "should return 30 from get_width if @_horizontal is true", ->
    # @_horizontal means that the toolbar is on the left or the right
    @box._horizontal = true
    @box_view = new @box.default_view({ model: @box, parent: null })
    expect(@box_view.get_width()).to.be.equal 30

  # Note: The way height is reporting is not perfectly correct, but this
  # simple version gets a number of things working as a starting point
  it "should return 30 from get_height if @_horizontal is true", ->
    @box._horizontal = true
    @box_view = new @box.default_view({ model: @box, parent: null })
    expect(@box_view.get_height()).to.be.equal 30

  it "should return 30 from get_height if @_horizontal is false", ->
    @box._horizontal = false
    @box_view = new @box.default_view({ model: @box, parent: null })
    expect(@box_view.get_height()).to.be.equal 30


describe "ToolbarBox", ->

  it "should be an instance of box", ->
    # It's very important that ToolbarBox inherits from Box so
    # the it gets correctly laid out in responsive views.
    box = new ToolbarBox()
    expect(box).to.be.an.instanceof(Box)

  it "should set _horizontal set to true if toolbar_location is left or right", ->
    box = new ToolbarBox({toolbar_location: 'left'})
    expect(box._horizontal).to.be.true
    box = new ToolbarBox({toolbar_location: 'right'})
    expect(box._horizontal).to.be.true

  it "should set _horizontal set to false if toolbar_location is above or below", ->
    box = new ToolbarBox({toolbar_location: 'above'})
    expect(box._horizontal).to.be.false
    box = new ToolbarBox({toolbar_location: 'below'})
    expect(box._horizontal).to.be.false

  it "should set the toolbar sizeable to width if the toolbar location is left or right", ->
    box = new ToolbarBox({toolbar_location: 'left'})
    expect(box._toolbar._sizeable).to.be.equal box._toolbar._width
    box = new ToolbarBox({toolbar_location: 'right'})
    expect(box._toolbar._sizeable).to.be.equal box._toolbar._width

  it "should set the toolbar sizeable to height if the toolbar location is above or below", ->
    box = new ToolbarBox({toolbar_location: 'above'})
    expect(box._toolbar._sizeable).to.be.equal box._toolbar._height
    box = new ToolbarBox({toolbar_location: 'below'})
    expect(box._toolbar._sizeable).to.be.equal box._toolbar._height

  it "should return the toolbar as its children", ->
    box = new ToolbarBox()
    expect(box.get_layoutable_children()).to.be.deep.equal [box._toolbar]

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
