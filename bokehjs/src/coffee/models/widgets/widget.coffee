LayoutComponent = require "../layouts/layout_component"

class WidgetView extends LayoutComponent.View
  className: "bk-widget"

class Widget extends LayoutComponent.Model
  type: "Widget"
  default_view: WidgetView

module.exports =
  Model: Widget
  View: WidgetView
