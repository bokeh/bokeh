import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export class WidgetView extends LayoutDOMView
  className: "bk-widget"

  render: () ->
    # LayoutDOMView sets up lots of helpful things, but
    # it's render method is not suitable for widgets - who
    # should provide their own.
    if @model.height
      @$el.height(@model.height)
    if @model.width
      @$el.width(@model.width)


export class Widget extends LayoutDOM
  type: "Widget"
  default_view: WidgetView
