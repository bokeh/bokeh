BokehView = require "../../core/bokeh_view"
{Strength}  = require "../../core/layout/solver"

LayoutDOM = require "../layouts/layout_dom"

# Note the widget class strongly expects responsive mode to be width or fixed.
# Most widgets won't have a sensible configuration for box responsive mode as
# they are html elements which take up a given amount of vertical space. Not
# this does not preclude them being spaced out by being inside a box mode
# Column.

class WidgetView extends BokehView
  className: "bk-widget"

  render: () ->
    if @mget('responsive') == 'width'
      @update_constraints()

    @$el.css({
      position: 'absolute'
      left: @mget('dom_left')
      top: @mget('dom_top')
      'width': @model._width._value - @model._whitespace_left._value - @model._whitespace_right._value
      'padding-left': @model._whitespace_left._value
      'padding-right': @model._whitespace_right._value
      'padding-top': @model._whitespace_top._value
      'padding-bottom': @model._whitespace_bottom._value
    })

  update_constraints: () ->
    s = @model.document.solver()
    s.suggest_value(@model._height, @el.scrollHeight)


class Widget extends LayoutDOM.Model
  type: "Widget"
  default_view: WidgetView

  get_edit_variables: () ->
    editables = []
    if @get('responsive') == 'width'
      editables.push({edit_variable: @_height, strength: Strength.strong})
    return editables

module.exports =
  Model: Widget
  View: WidgetView
