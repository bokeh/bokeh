_ = require "underscore"

{EQ} = require "../../core/layout/solver"
LayoutDom = require "../layouts/layout_dom"

class WidgetView extends LayoutDom.View
  className: "bk-widget"

class Widget extends LayoutDom.Model
  type: "Widget"
  default_view: WidgetView

  get_constrained_variables: () ->
    return _.extend {}, super(), {
      # when this widget is in a box, make these the same distance
      # apart in every widget. Right/bottom are inset from the edge.
      'box-equal-size-left' : @_left
      'box-equal-size-right' : @_width_minus_right
    }

  get_constraints: () ->
    constraints = super()
    # width and height are a function of sides...
    constraints.push(EQ([-1, @_right], @_left, @_right_minus_left))
    constraints.push(EQ([-1, @_bottom], @_top, @_bottom_minus_top))
    return constraints

module.exports =
  Model: Widget
  View: WidgetView
