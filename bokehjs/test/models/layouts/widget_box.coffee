_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")

{DataRange1d} = utils.require("models/ranges/data_range1d")
{LayoutDOM} = utils.require("models/layouts/layout_dom")
{LayoutDOMView} = utils.require("models/layouts/layout_dom")
{Panel} = utils.require("models/widgets/panel")
{Plot} = utils.require("models/plots/plot")
{Tabs} = utils.require("models/widgets/tabs")
{Toolbar} = utils.require("models/tools/toolbar")
{WidgetBox} = utils.require("models/layouts/widget_box")
{WidgetBoxView} = utils.require("models/layouts/widget_box")

describe "WidgetBox", ->
  beforeEach ->
    @widget_box = new WidgetBox({})

  describe "WidgetBoxView", ->
    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()
      @doc = new Document()
      @doc.add_root(@widget_box)

    it "render should set the appropriate positions and paddings on the element when it is mode box", ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @widget_box._dom_left = {_value: dom_left}
      @widget_box._dom_top = {_value: dom_top}
      @widget_box._width = {_value: width}
      @widget_box._height = {_value: height}
      @widget_box.sizing_mode = 'stretch_both'
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.render()
      # Note we do not set margin & padding on WidgetBox
      expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
      expect(widget_box_view.el.style.cssText).to.be.equal expected_style

    it "render should set the appropriate positions and paddings on the element when it is mode width", ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @widget_box._dom_left = {_value: dom_left}
      @widget_box._dom_top = {_value: dom_top}
      @widget_box._width = {_value: width}
      @widget_box._height = {_value: height}
      @widget_box.sizing_mode = 'scale_width'
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {'child_view_1': {'el': {'scrollHeight': 222}}}
      widget_box_view.render()
      # Note we do not set margin & padding or height on fixed WidgetBox
      expected_style = "width: #{width - 20}px;"
      expect(widget_box_view.el.style.cssText).to.be.equal expected_style

    it "get_height should return the height of the widget children plus 10 for margin + 10 overall", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {'child_view_1': {'el': {'scrollHeight': 222}}}
      expect(widget_box_view.get_height()).to.be.equal 222 + 10 + 10

    it "get_height should return the sum of multiple children plus 10 for margin + 10 overall", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {
        'child_view_1': {'el': {'scrollHeight': 222}}
        'child_view_2': {'el': {'scrollHeight': 23}}
      }
      expect(widget_box_view.get_height()).to.be.equal 222 + 10 + 23 + 10

    it "get_width should return the max of it and the children", ->
      @widget_box.width = null  # Manually set to null to check calc
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.el = {'scrollWidth': 99}
      widget_box_view.child_views = {
        'child_view_1': {'el': {'scrollWidth': 111}}
        'child_view_2': {'el': {'scrollWidth': 189}}
        'child_view_3': {'el': {'scrollWidth': 44}}
      }
      expect(widget_box_view.get_width()).to.be.equal 189

    it "get_width should return itself + 20 if no children", ->
      @widget_box.width = null  # Manually set to null to check calc
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.el = {'scrollWidth': 99}
      widget_box_view.child_views = {
      }
      expect(widget_box_view.get_width()).to.be.equal 99 + 20

    it "should call build_child_views if children change", ->
      child_widget = new Tabs()
      spy = sinon.spy(LayoutDOMView.prototype, 'build_child_views')
      new @widget_box.default_view({ model: @widget_box })
      expect(spy.callCount).is.equal 1  # Expect one from initialization
      @widget_box.children = [child_widget]
      LayoutDOMView.prototype.build_child_views.restore()
      # Expect another two: one from children changing event; the other because
      # we initialize the child_box
      expect(spy.callCount).is.equal 3

  describe "WidgetBox", ->
    beforeEach ->
      @expected_constrained_variables = {
        'width': @widget_box._width
        'height': @widget_box._height
        'origin-x': @widget_box._dom_left
        'origin-y': @widget_box._dom_top
        'whitespace-top' : @widget_box._whitespace_top
        'whitespace-bottom' : @widget_box._whitespace_bottom
        'whitespace-left' : @widget_box._whitespace_left
        'whitespace-right' : @widget_box._whitespace_right
        'on-edge-align-top' : @widget_box._top
        'on-edge-align-bottom' : @widget_box._height_minus_bottom
        'on-edge-align-left' : @widget_box._left
        'on-edge-align-right' : @widget_box._width_minus_right
        'box-equal-size-top' : @widget_box._top
        'box-equal-size-bottom' : @widget_box._height_minus_bottom
        'box-equal-size-left' : @widget_box._left
        'box-equal-size-right' : @widget_box._width_minus_right
        'box-cell-align-top' : @widget_box._top
        'box-cell-align-bottom' : @widget_box._height_minus_bottom
        'box-cell-align-left' : @widget_box._left
        'box-cell-align-right' : @widget_box._width_minus_right
      }

    it "should return correct constrained_variables in box mode", ->
      @widget_box.sizing_mode = 'stretch_both'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

    it "should return correct constrained_variables in scale_width mode", ->
      # We don't return height because we're going to set it ourselves.
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height'])
      @widget_box.sizing_mode = 'scale_width'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in scale_height mode", ->
      # We don't return width because we're going to set it ourselves.
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['width'])
      @widget_box.sizing_mode = 'scale_height'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in fixed mode", ->
      # We don't return height or width because we're going to set them ourselves.
      @widget_box.sizing_mode = 'fixed'
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height', 'width', 'box-equal-size-left', 'box-equal-size-right'])
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

  describe "should pull things from children", ->
    afterEach ->
      LayoutDOM.prototype.get_constraints.restore()
      LayoutDOM.prototype.get_edit_variables.restore()

    beforeEach ->
      sinon.stub(LayoutDOM.prototype, 'get_constraints').returns([])
      sinon.stub(LayoutDOM.prototype, 'get_edit_variables').returns([])
      tab_plot = new Plot({x_range: new DataRange1d(), y_range: new DataRange1d(), toolbar: new Toolbar()})
      tab_plot.attach_document(new Document())
      panel = new Panel({child: tab_plot})
      @tabs = new Tabs({tabs: [panel]})
      @widget_box.children = [@tabs]

    it "get_edit_variables", ->
      sinon.stub(@tabs, 'get_edit_variables', () -> [{'a': 1, 'b': 2}, {'a': 3, 'b': 4}])
      expect(@widget_box.get_edit_variables()).to.be.deep.equal @tabs.get_edit_variables()

    it "get_constraints", ->
      sinon.stub(@tabs, 'get_constraints', () -> [{'a': 1, 'b': 2}, {'a': 3, 'b': 4}])
      expect(@widget_box.get_constraints()).to.be.deep.equal @tabs.get_constraints()
