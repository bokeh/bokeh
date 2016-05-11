LayoutDom = require "../layouts/layout_dom"


class WidgetView extends LayoutDom.View
  className: "bk-widget"

  render: () ->
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      width: @model._width._value - @model._whitespace_right._value - @model._whitespace_left._value
      height: @model._height._value - @model._whitespace_bottom._value - @model._whitespace_top._value
      'margin-left': @model._whitespace_left._value
      'margin-right': @model._whitespace_right._value
      'margin-top': @model._whitespace_top._value
      'margin-bottom': @model._whitespace_bottom._value
    })


class Widget extends LayoutDom.Model
  type: "Widget"
  default_view: WidgetView


module.exports =
  Model: Widget
  View: WidgetView
