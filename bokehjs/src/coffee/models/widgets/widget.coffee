BokehView = require "../../core/bokeh_view"
{EQ}  = require "../../core/layout/solver"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"

class WidgetView extends BokehView
  className: "bk-widget"

class Widget extends LayoutDOM.Model
  type: "Widget"
  default_view: WidgetView

module.exports =
  Model: Widget
  View: WidgetView
