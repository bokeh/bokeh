BokehView = require "../../core/bokeh_view"
{EQ, GE, Strength, Variable}  = require "../../core/layout/solver"
p = require "../../core/properties"

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
    # TODO We need to get better at measuring heights on widgets
    if @mget('height')
      s.suggest_value(@model._height, @mget('height'))
    else
      s.suggest_value(@model._height, @el.scrollHeight)


class Widget extends LayoutDOM.Model
  type: "Widget"
  default_view: WidgetView

  get_constraints: () ->
    constraints = super()
    constraints.push(EQ(@_height_minus_bottom, [-1, @_height], @_bottom))
    constraints.push(EQ(@_width_minus_right, [-1, @_width], @_right))
    return constraints

  get_edit_variables: () ->
    editables = []
    if @get('responsive') == 'width'
      editables.push({edit_variable: @_height, strength: Strength.strong})
    return editables

  @define {
    grow:     [ p.Bool, false]
  }

module.exports =
  Model: Widget
  View: WidgetView
