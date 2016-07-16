LayoutDOM = require "../layouts/layout_dom"


class WidgetView extends LayoutDOM.View
  className: "bk-widget"

  render: () ->
    # LayoutDOM.View sets up lots of helpful things, but
    # it's render method is not suitable for widgets - who
    # should provide their own.
    if @model.height
      @$el.height(@model.height)
    if @model.width
      @$el.width(@model.width)


class Widget extends LayoutDOM.Model
  type: "Widget"
  default_view: WidgetView

module.exports =
  Model: Widget
  View: WidgetView
