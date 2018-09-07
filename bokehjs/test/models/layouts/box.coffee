{expect} = require "chai"
sinon = require "sinon"

{clone} = require("core/util/object")
{Document} = require("document")
{Box} = require("models/layouts/box")
{BoxView} = require("models/layouts/box")
{LayoutDOMView} = require("models/layouts/layout_dom")

describe "BoxView", ->

  beforeEach ->
    @box = new Box()
    @doc = new Document()
    @doc.add_root(@box)

  it.skip "should have a test for get_height", ->
    null

  it.skip "should have a test for get_width", ->
    null

  it "should call build_child_views if children change", ->
    child_box = new Box()
    spy = sinon.spy(LayoutDOMView.prototype, 'build_child_views')
    new @box.default_view({ model: @box, parent: null })
    expect(spy.callCount).is.equal 1  # Expect one from initialization
    @box.children = [child_box]
    LayoutDOMView.prototype.build_child_views.restore()
    # Expect another two: one from children changing event; the other because
    # we initialize the child_box
    expect(spy.callCount).is.equal 3

describe "Box", ->
