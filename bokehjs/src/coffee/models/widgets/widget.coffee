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

  _prefix_ui: () ->
    for el in @el.querySelectorAll("*[class*='ui-']")
      classList = []
      for cls in el.classList
        classList.push(if cls.indexOf("ui-") == 0 then "bk-#{cls}" else cls)
      el.classList = classList.join(" ")
    return null

export class Widget extends LayoutDOM
  type: "Widget"
  default_view: WidgetView
