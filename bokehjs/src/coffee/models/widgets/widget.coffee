BokehView = require "../../core/bokeh_view"

LayoutDOM = require "../layouts/layout_dom"

# Note the widget class strongly expects responsive mode to be width or fixed.
# Most widgets won't have a sensible configuration for box responsive mode as
# they are html elements which take up a given amount of vertical space. Not
# this does not preclude them being spaced out by being inside a box mode
# Column.

class WidgetView extends BokehView
  className: "bk-widget"

  render: () ->
    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      'width': @model._width._value - @model._whitespace_left._value - @model._whitespace_right._value
      'margin-left': @model._whitespace_left._value
      'margin-right': @model._whitespace_right._value
      'margin-top': @model._whitespace_top._value
      'margin-bottom': @model._whitespace_bottom._value
    })


class Widget extends LayoutDOM.Model
  type: "Widget"
  default_view: WidgetView


module.exports =
  Model: Widget
  View: WidgetView
