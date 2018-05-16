{expect} = require "chai"
sinon = require 'sinon'

{clone} = require("core/util/object")
{Document} = require("document")
{DataRange1d} = require("models/ranges/data_range1d")
{LayoutDOM} = require("models/layouts/layout_dom")
{LayoutDOMView} = require("models/layouts/layout_dom")
{Panel} = require("models/widgets/panel")
{Plot} = require("models/plots/plot")
{Button} = require("models/widgets/button")
{Tabs} = require("models/widgets/tabs")
{Toolbar} = require("models/tools/toolbar")
{WidgetBox} = require("models/layouts/widget_box")
{WidgetBoxView} = require("models/layouts/widget_box")

describe "WidgetBox", ->
  beforeEach ->
    @widget_box = new WidgetBox({})

  describe "WidgetBoxView", ->

    beforeEach ->
      @doc = new Document()
      @doc.add_root(@widget_box)

    it "render should set the appropriate positions and paddings on the element when it is mode box", ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @widget_box._dom_left.setValue(dom_left)
      @widget_box._dom_top.setValue(dom_top)
      @widget_box._width.setValue(width)
      @widget_box._height.setValue(height)
      @widget_box.sizing_mode = 'stretch_both'
      widget_box_view = new @widget_box.default_view({ model: @widget_box, parent: null })
      widget_box_view.render()
      # Note we do not set margin & padding on WidgetBox
      expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
      expect(widget_box_view.el.style.cssText).to.be.equal expected_style

    ###
    it "render should set the appropriate positions and paddings on the element when it is mode width", ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @widget_box._dom_left.setValue(dom_left)
      @widget_box._dom_top.setValue(dom_top)
      @widget_box._width.setValue(width)
      @widget_box._height.setValue(height)
      @widget_box.sizing_mode = 'scale_width'
      widget_box_view = new @widget_box.default_view({ model: @widget_box, parent: null })
      widget_box_view.child_views = {'child_view_1': {'el': {'scrollHeight': 222}}}
      widget_box_view.render()
      # Note we do not set margin & padding or height on fixed WidgetBox
      expected_style = "width: #{width - 20}px;"
      expect(widget_box_view.el.style.cssText).to.be.equal expected_style

    it "get_height should return the height of the widget children plus 10 for margin + 10 overall", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box, parent: null })
      widget_box_view.child_views = {'child_view_1': {'el': {'scrollHeight': 222}}}
      expect(widget_box_view.get_height()).to.be.equal 222 + 10 + 10

    it "get_height should return the sum of multiple children plus 10 for margin + 10 overall", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box, parent: null })
      widget_box_view.child_views = {
        'child_view_1': {'el': {'scrollHeight': 222}}
        'child_view_2': {'el': {'scrollHeight': 23}}
      }
      expect(widget_box_view.get_height()).to.be.equal 222 + 10 + 23 + 10

    it "get_width should return the max of it and the children", ->
      @widget_box.width = null  # Manually set to null to check calc
      widget_box_view = new @widget_box.default_view({ model: @widget_box, parent: null })
      widget_box_view.el = {'scrollWidth': 99}
      widget_box_view.child_views = {
        'child_view_1': {'el': {'scrollWidth': 111}}
        'child_view_2': {'el': {'scrollWidth': 189}}
        'child_view_3': {'el': {'scrollWidth': 44}}
      }
      expect(widget_box_view.get_width()).to.be.equal 189

    it "get_width should return itself + 20 if no children", ->
      @widget_box.width = null  # Manually set to null to check calc
      widget_box_view = new @widget_box.default_view({ model: @widget_box, parent: null })
      widget_box_view.el = {'scrollWidth': 99}
      widget_box_view.child_views = {
      }
      expect(widget_box_view.get_width()).to.be.equal 99 + 20
    ###

    it "should call build_child_views if children change", ->
      child_widget = new Button()
      spy = sinon.spy(LayoutDOMView.prototype, 'build_child_views')
      new @widget_box.default_view({ model: @widget_box, parent: null })
      expect(spy.callCount).is.equal 1  # Expect one from initialization
      @widget_box.children = [child_widget]
      LayoutDOMView.prototype.build_child_views.restore()
      # Expect another two: one from children changing event; the other because
      # we initialize the child_box
      expect(spy.callCount).is.equal 3

  describe "WidgetBox", ->
    beforeEach ->
      @expected_constrained_variables = {
        width: @widget_box._width
        height: @widget_box._height
        origin_x: @widget_box._dom_left
        origin_y: @widget_box._dom_top
        whitespace_top : @widget_box._whitespace_top
        whitespace_bottom : @widget_box._whitespace_bottom
        whitespace_left : @widget_box._whitespace_left
        whitespace_right : @widget_box._whitespace_right
        on_edge_align_top : @widget_box._top
        on_edge_align_bottom : @widget_box._height_minus_bottom
        on_edge_align_left : @widget_box._left
        on_edge_align_right : @widget_box._width_minus_right
        box_equal_size_top : @widget_box._top
        box_equal_size_bottom : @widget_box._height_minus_bottom
        box_equal_size_left : @widget_box._left
        box_equal_size_right : @widget_box._width_minus_right
        box_cell_align_top : @widget_box._top
        box_cell_align_bottom : @widget_box._height_minus_bottom
        box_cell_align_left : @widget_box._left
        box_cell_align_right : @widget_box._width_minus_right
      }

    it "should return correct constrained_variables in box mode", ->
      @widget_box.sizing_mode = 'stretch_both'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

    it "should return correct constrained_variables in scale_width mode", ->
      # We don't return height because we're going to set it ourselves.
      expected_constrained_variables = clone(@expected_constrained_variables)
      delete expected_constrained_variables.height
      @widget_box.sizing_mode = 'scale_width'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in scale_height mode", ->
      # We don't return width because we're going to set it ourselves.
      expected_constrained_variables = clone(@expected_constrained_variables)
      delete expected_constrained_variables.width
      @widget_box.sizing_mode = 'scale_height'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in fixed mode", ->
      # We don't return height or width because we're going to set them ourselves.
      @widget_box.sizing_mode = 'fixed'
      expected_constrained_variables = clone(@expected_constrained_variables)
      delete expected_constrained_variables.height
      delete expected_constrained_variables.width
      delete expected_constrained_variables.box_equal_size_left
      delete expected_constrained_variables.box_equal_size_right
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables
