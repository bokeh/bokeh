import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export class WidgetView extends LayoutDOMView
  className: "bk-widget"

  render: () ->
    @_render_classes() # XXX: because no super()

    # LayoutDOMView sets up lots of helpful things, but
    # it's render method is not suitable for widgets - who
    # should provide their own.
    if @model.height?
      @el.style.height = "#{@model.height}px"
    if @model.width?
      @el.style.width = "#{@model.width}px"

export class Widget extends LayoutDOM
  type: "Widget"
  default_view: WidgetView
