{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")

DataRange1d = utils.require("models/ranges/data_range1d").Model
Panel = utils.require("models/widgets/panel").Model
Plot = utils.require("models/plots/plot").Model
Tabs = utils.require("models/widgets/tabs").Model
Toolbar = utils.require("models/tools/toolbar").Model
Widget = utils.require("models/widgets/widget").Model

describe "Tabs.Model", ->

  afterEach ->
    utils.unstub_solver()

  beforeEach ->
    utils.stub_solver()
    @p = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), toolbar: new Toolbar()})
    @p.attach_document(new Document())
    @panel = new Panel({child: @p})
    @tabs = new Tabs({tabs: [@panel]})

  it "should have children matching tabs.child after initialization", ->
    expect(@tabs.children.length).to.be.equal 1
    expect(@tabs.children[0]).to.be.equal @p

  it "should return children from get_layoutable_children", ->
    expect(@tabs.get_layoutable_children()).to.be.deep.equal @tabs.children

  it "get_constraints should return constraints from children", ->
    # The panel's constraints have come from the widget, so need to stub that.
    sinon.stub(Widget.prototype, 'get_constraints', () -> [{'a': 9, 'b': 10}])
    sinon.stub(@p, 'get_constraints', () -> [{'a': 5, 'b': 6}, {'a': 7, 'b': 8}])

    expected_constraints = @panel.get_constraints().concat(@p.get_constraints())
    expect(@tabs.get_constraints()).to.be.deep.equal expected_constraints

    # Restore widget
    Widget.prototype.get_constraints.restore()

  #TODO Tabs need some work with new layout, commenting out thie test for now.
  #it "get_edit_variables should return edit_variables from children", ->
  #  # Set to fixed so only getting edit variables from children
  #  @tabs.responsive = 'fixed'
  #  sinon.stub(@p, 'get_edit_variables', () -> [{'a': 1, 'b': 2}, {'a': 3, 'b': 4}])
  #  expect(@tabs.get_edit_variables()).to.be.deep.equal @p.get_edit_variables()
