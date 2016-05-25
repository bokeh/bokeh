_ = require "underscore"
{expect} = require "chai"
utils = require "../../utils"
sinon = require 'sinon'

{Document} = utils.require("document")

WidgetBox = utils.require("models/layouts/widget_box").Model
WidgetBoxView = utils.require("models/layouts/widget_box").View

describe "WidgetBox", ->
  beforeEach ->
    @widget_box = new WidgetBox({})

  describe "WidgetBox.View", ->
    afterEach ->
      utils.unstub_canvas()
      utils.unstub_solver()

    beforeEach ->
      utils.stub_canvas()
      utils.stub_solver()
      @widget_box.attach_document(new Document())

    it "render should set the appropriate positions and paddings on the element when it is mode box", ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @widget_box._dom_left = {_value: dom_left}
      @widget_box._dom_top = {_value: dom_top}
      @widget_box._width = {_value: width}
      @widget_box._height = {_value: height}
      @widget_box.responsive = 'box'
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.render()
      # Note we do not set margin & padding on WidgetBox
      expected_style = "position: absolute; left: #{dom_left}px; top: #{dom_top}px; width: #{width}px; height: #{height}px;"
      expect(widget_box_view.$el.attr('style')).to.be.equal expected_style

    it "render should set the appropriate positions and paddings on the element when it is mode width", ->
      dom_left = 12
      dom_top = 13
      width = 80
      height = 100
      @widget_box._dom_left = {_value: dom_left}
      @widget_box._dom_top = {_value: dom_top}
      @widget_box._width = {_value: width}
      @widget_box._height = {_value: height}
      @widget_box.responsive = 'width_ar'
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {'child_view_1': {'el': {'scrollHeight': 222}}}
      widget_box_view.render()
      # Note we do not set margin & padding on WidgetBox
      expected_style = "width: #{width - 20}px; height: #{height + 10}px;"
      expect(widget_box_view.$el.attr('style')).to.be.equal expected_style

    it "get_height should return the height of the widget children plus 10 for margin", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {'child_view_1': {'el': {'scrollHeight': 222}}}
      expect(widget_box_view.get_height()).to.be.equal 222 + 10

    it "get_height should return the sum of multiple children plus 10 for margin", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {
        'child_view_1': {'el': {'scrollHeight': 222}}
        'child_view_2': {'el': {'scrollHeight': 23}}
      }
      expect(widget_box_view.get_height()).to.be.equal 222 + 10 + 23 + 10

    it "get_width should return the width of a widget child plus 20 for margin", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {'child_view_1': {'el': {'scrollWidth': 111}}}
      expect(widget_box_view.get_width()).to.be.equal 111 + 20

    it "get_width should return only the max of the children plus 20 for margin", ->
      widget_box_view = new @widget_box.default_view({ model: @widget_box })
      widget_box_view.child_views = {
        'child_view_1': {'el': {'scrollWidth': 111}}
        'child_view_2': {'el': {'scrollWidth': 189}}
        'child_view_3': {'el': {'scrollWidth': 44}}
      }
      expect(widget_box_view.get_width()).to.be.equal 189 + 20


  describe "WidgetBox.Model", ->
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
      @widget_box.responsive = 'box'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal @expected_constrained_variables

    it "should return correct constrained_variables in width_ar mode", ->
      # We don't return height because we're going to set it ourselves.
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height'])
      @widget_box.responsive = 'width_ar'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in height_ar mode", ->
      # We don't return width because we're going to set it ourselves.
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['width'])
      @widget_box.responsive = 'height_ar'
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables

    it "should return correct constrained_variables in fixed mode", ->
      # We don't return height or width because we're going to set them ourselves.
      @widget_box.responsive = 'fixed'
      expected_constrained_variables = _.omit(@expected_constrained_variables, ['height', 'width', 'box-equal-size-left', 'box-equal-size-right'])
      constrained_variables = @widget_box.get_constrained_variables()
      expect(constrained_variables).to.be.deep.equal expected_constrained_variables
