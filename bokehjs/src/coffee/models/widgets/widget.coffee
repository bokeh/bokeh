_ = require "underscore"
p = require "../../core/properties"

LayoutDom = require "../layouts/layout_dom"


class WidgetView extends LayoutDom.View
  className: "bk-widget"

  render: () ->
    return null


class Widget extends LayoutDom.Model
  type: "Widget"
  default_view: WidgetView

  @define: {
    grow:     [ p.Bool, false]
  }

module.exports =
  Model: Widget
  View: WidgetView
