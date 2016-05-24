{expect} = require "chai"
utils = require "../../utils"

ToolbarBox = utils.require("models/layouts/toolbar_box").Model
Toolbar = utils.require("models/tools/toolbar").Model

describe "ToolbarBox.Model", ->

  it "should set _horizontal set to true if orientation is horizontal", ->
    box = new ToolbarBox({orientation: 'horizontal'})
    expect(box._horizontal).to.be.true

  it "should set _horizontal set to false if orientation is vertical", ->
    box = new ToolbarBox({orientation: 'vertical'})
    expect(box._horizontal).to.be.false

  it "should return the toolbar as its children", ->
    tb = new Toolbar()
    box = new ToolbarBox({toolbar: tb})
    expect(box.get_layoutable_children()).to.be.deep.equal [tb]

  it "should set the toolbar sizeable and location if the orientation is vertical", ->
    tb = new Toolbar()
    box = new ToolbarBox({toolbar: tb, orientation: 'vertical'})
    expect(tb._sizeable).to.be.equal tb._width
    expect(tb.location).to.be.equal 'left'

  it "should set the toolbar sizeable and location if the orientation is horizontal", ->
    tb = new Toolbar()
    box = new ToolbarBox({toolbar: tb, orientation: 'horizontal'})
    expect(tb._sizeable).to.be.equal tb._height
    expect(tb.location).to.be.equal 'above'
