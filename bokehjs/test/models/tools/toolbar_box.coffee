{expect} = require "chai"
utils = require "../../utils"

{Document} = utils.require("document")

ToolbarBox = utils.require("models/tools/toolbar_box").Model
Toolbar = utils.require("models/tools/toolbar").Model

describe "ToolbarBox.View", ->

  beforeEach ->
    @box = new ToolbarBox()
    @box.attach_document(new Document())

  it "should return null from get_width if @_horizontal is not true", ->
    @box._horizontal = false
    @box_view = new @box.default_view({ model: @box })
    expect(@box_view.get_width()).to.be.null

  it "should return 30 from get_width if @_horizontal is true", ->
    # @_horizontal means that the toolbar is on the left or the right
    @box._horizontal = true
    @box_view = new @box.default_view({ model: @box })
    expect(@box_view.get_width()).to.be.equal 30

  # Note: The way height is reporting is not perfectly correct, but this
  # simple version gets a number of things working as a starting point
  it "should return 30 from get_height if @_horizontal is true", ->
    @box._horizontal = true
    @box_view = new @box.default_view({ model: @box })
    expect(@box_view.get_height()).to.be.equal 30

  it "should return 30 from get_height if @_horizontal is false", ->
    @box._horizontal = false
    @box_view = new @box.default_view({ model: @box })
    expect(@box_view.get_height()).to.be.equal 30


describe "ToolbarBox.Model", ->

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
