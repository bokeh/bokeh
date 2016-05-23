_ = require "underscore"
$ = require "jquery"

build_views = require "../../common/build_views"

BokehView = require "../../core/bokeh_view"
{WEAK_EQ, GE, EQ, Strength, Variable}  = require "../../core/layout/solver"
{logger} = require "../../core/logging"
p = require "../../core/properties"

LayoutDOM = require "../layouts/layout_dom"


class WidgetBoxView extends LayoutDOM.View
  className: "bk-widget-box"

  render: () ->
    super()
    if @model.responsive == 'width_ar'
      @$el.css({
        # The -20 is a hack because the widget box has padding on the css.
        # TODO(bird) Make this configurable & less flaky
        width: @model._width._value - 20
        height: @model._height._value + 10
      })

  get_height: () ->
    height = 0
    for own key, child_view of @child_views
      # We have to add on 10px because widgets have a margin at the top.
      # TODO(bird) Widgets should report their own height.
      height += child_view.el.scrollHeight + 10
    return height

  get_width: () ->
    width = 0
    for own key, child_view of @child_views
      # Take the max width of all the children as the constrainer.
      # Also add on 10px for margin
      child_width = child_view.el.scrollWidth + 20
      if child_width > width
        width = child_width
    return width


class WidgetBox extends LayoutDOM.Model
  type: 'WidgetBox'
  default_view: WidgetBoxView

  get_constrained_variables: () ->
    constrained_variables = super()
    constrained_variables = _.extend(constrained_variables, {
      'on-edge-align-top'    : @_top
      'on-edge-align-bottom' : @_height_minus_bottom
      'on-edge-align-left'   : @_left
      'on-edge-align-right'  : @_width_minus_right

      'box-cell-align-top'   : @_top
      'box-cell-align-bottom': @_height_minus_bottom
      'box-cell-align-left'  : @_left
      'box-cell-align-right' : @_width_minus_right

      'box-equal-size-top'   : @_top
      'box-equal-size-bottom': @_height_minus_bottom
    })
    if @responsive isnt 'fixed'
      constrained_variables = _.extend(constrained_variables, {
        'box-equal-size-left'  : @_left
        'box-equal-size-right' : @_width_minus_right
      })
    return constrained_variables
  
  get_layoutable_children: () ->
    return @children

  @define {
    'children': [ p.Array, [] ]
  }

module.exports =
  Model: WidgetBox
