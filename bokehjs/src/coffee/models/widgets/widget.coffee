BokehView = require "../../core/bokeh_view"
{GE}  = require "../../core/layout/solver"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"

class WidgetView extends BokehView
  className: "bk-widget"

class Widget extends LayoutDOM.Model
  type: "Widget"
  default_view: WidgetView

  get_constraints: () ->
    constraints = []
    # plot has to be inside the width/height
    constraints.push(GE(@_left))
    constraints.push(GE(@_width, [-1, @_right]))
    constraints.push(GE(@_top))
    constraints.push(GE(@_height, [-1, @_bottom]))
    return constraints

module.exports =
  Model: Widget
  View: WidgetView
