{expect} = require "chai"
sinon = require "sinon"

{Strength, Variable}  = require("core/layout/solver")

{Document} = require("document")
{LayoutDOM} = require("models/layouts/layout_dom")
{LayoutDOMView} = require("models/layouts/layout_dom")

dom_left = 12
dom_top = 13
width = 111
height = 443

describe "LayoutDOMView", ->

  describe "initialize", ->
    beforeEach ->
      @test_layout = new LayoutDOM()
      @doc = new Document()
      @doc.add_root(@test_layout)

    it.skip "should build the child views", ->
      # needs a test
      null

    it.skip "should trigger a resize event", ->
      # needs a test
      null

  describe "render", ->

    make_layout = (attrs) ->
      layout = new LayoutDOM(attrs)
      doc = new Document()
      doc.add_root(layout)
      return layout

    it "should set the appropriate style on the element if sizing_mode is 'fixed'", ->
      layout = make_layout({sizing_mode: 'fixed', width: 88, height: 11})
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      layout_view.do_layout()
      expected_style = "position: relative; width: 88px; height: 11px;"
      expect(layout_view.el.style.cssText).to.be.equal expected_style

  describe "build_child_views", ->

    make_layout = (attrs) ->
      layout = new LayoutDOM(attrs)
      doc = new Document()
      doc.add_root(layout)
      return layout

    it "should be called once on initialization", ->
      layout = make_layout({})
      spy = sinon.spy(LayoutDOMView.prototype, 'build_child_views')
      expect(spy.called).to.be.false
      layout_view = new LayoutDOMView({ model: layout, parent: null })
      LayoutDOMView.prototype.build_child_views.restore()
      expect(spy.callCount).is.equal 1

    it.skip "should only init the solver if requested and should invalidate all the models", ->
      # Write this test
      null

describe "LayoutDOM", ->

  it "should have default sizing_mode of fixed", ->
    l = new LayoutDOM()
    expect(l.sizing_mode).to.be.equal('fixed')
