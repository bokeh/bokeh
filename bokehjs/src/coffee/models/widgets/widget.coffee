_ = require "underscore"

{EQ} = require "../../core/layout/solver"
LayoutDom = require "../layouts/layout_dom"

class WidgetView extends LayoutDom.View
  className: "bk-widget"

class Widget extends LayoutDom.Model
  type: "Widget"
  default_view: WidgetView

  get_constraints: () ->
    constraints = super()
    # width and height are a function of sides...
    constraints.push(EQ([-1, @_right], @_left, @_right_minus_left))
    constraints.push(EQ([-1, @_bottom], @_top, @_bottom_minus_top))
    return constraints

module.exports =
  Model: Widget
  View: WidgetView
