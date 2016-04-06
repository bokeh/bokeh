LayoutDom = require "../layouts/layout_dom"

class WidgetView extends LayoutDom.View
  className: "bk-widget"

class Widget extends LayoutDom.Model
  type: "Widget"
  default_view: WidgetView

module.exports =
  Model: Widget
  View: WidgetView
