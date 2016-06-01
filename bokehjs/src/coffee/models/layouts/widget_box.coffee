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

    # Go through and make rendering tweaks because of margin
    # TODO(bird) Make this configurable & less flaky

    if @model.responsive is 'width_scale'
      @$el.css({
        width: @model._width._value - 20
        height: @model._height._value + 10
      })

    if @model.responsive is 'fixed'
      @$el.css({
        width: @model.width - 20  # for padding
        height: @model.height + 10  # for padding
      })

  get_height: () ->
    height = 0
    # We have to add on 10px because widgets have a margin at the top.
    for own key, child_view of @child_views
      height += child_view.el.scrollHeight + 10
    return height + 10

  get_width: () ->
    width = @el.scrollWidth + 20
    for own key, child_view of @child_views
      # Take the max width of all the children as the constrainer.
      child_width = child_view.el.scrollWidth
      if child_width > width
        width = child_width
    return width


class WidgetBox extends LayoutDOM.Model
  type: 'WidgetBox'
  default_view: WidgetBoxView

  get_edit_variables: () ->
    edit_variables = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      edit_variables = edit_variables.concat(child.get_edit_variables())
    return edit_variables

  get_constraints: () ->
    constraints = super()
    # Go down the children to pick up any more constraints
    for child in @get_layoutable_children()
      constraints = constraints.concat(child.get_constraints())
    return constraints

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

  @override {
    responsive: 'fixed'
  }

module.exports =
  Model: WidgetBox
