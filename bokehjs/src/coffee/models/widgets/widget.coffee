_ = require "underscore"
p = require "../../core/properties"

{EQ, GE, WEAK_EQ} = require "../../core/layout/solver"
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
    @update_constraints()

  update_constraints: () ->
    s = @model.document.solver()
    size = 0
    for child in @$el.children()
      size += child.clientHeight
    if not @_last_size?
      @_last_size = -1
    if size == @_last_size
      return
    @_last_size = size
    if @_size_constraint?
      s.remove_constraint(@_size_constraint)
    @_size_constraint = WEAK_EQ(@model._height, -size)
    s.add_constraint(@_size_constraint)
    s.update_variables()
    s.trigger('resize')

class Widget extends LayoutDom.Model
  type: "Widget"
  default_view: WidgetView

  get_constraints: () ->
    constraints = super()
    # width and height are a function of sides...
    constraints.push(EQ([-1, @_right], @_left, @_right_minus_left))
    constraints.push(EQ([-1, @_bottom], @_top, @_bottom_minus_top))
    return constraints

  props: ->
    return _.extend {}, super(), {
      grow:     [ p.Bool, false]
    }

module.exports =
  Model: Widget
  View: WidgetView
