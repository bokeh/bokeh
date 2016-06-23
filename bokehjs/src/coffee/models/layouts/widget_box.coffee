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

  initialize: (options) ->
    super(options)
    @render()

  bind_bokeh_events: () ->
    super()
    @listenTo(@model, 'change:children', () => @build_child_views())

  render: () ->

    s = @model.document.solver()

    if @model.sizing_mode is 'fixed' or @model.sizing_mode == 'scale_height'
      width = @get_width()
      if @model._width._value != width
        s.suggest_value(@model._width, width)
        s.update_variables()

    if @model.sizing_mode == 'fixed' or @model.sizing_mode == 'scale_width'
      height = @get_height()
      if @model._height._value != height
        s.suggest_value(@model._height, height)
        s.update_variables()

    if @model._width._value - 20 > 0
      css_width = @model._width._value - 20
    else
      css_width = "100%"

    if @model.sizing_mode is 'stretch_both'
      @$el.css({
        position: 'absolute'
        left: @model._dom_left._value
        top: @model._dom_top._value
        width: @model._width._value
        height: @model._height._value
      })
    else
      @$el.css({
        width: css_width
        # Note we DO NOT want to set a height (except in stretch_both). Widgets
        # are happier sizing themselves. We've tried to tell the layout what
        # the height is with the suggest_value. But that doesn't mean we need
        # to put it in the dom.
      })

  get_height: () ->
    height = 0
    # We have to add on 10px because widgets have a margin at the top.
    for own key, child_view of @child_views
      height += child_view.el.scrollHeight
    return height + 20

  get_width: () ->
    if @model.width?
      return @model.width
    else
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

  initialize: (options) ->
    super(options)
    if @sizing_mode == 'fixed' and @width == null
      # Set a default for fixed.
      @width = 300
      logger.info("WidgetBox mode is fixed, but no width specified. Using default of 300.")
    if @sizing_mode == 'scale_height'
      logger.warn("sizing_mode `scale_height` is not experimental for WidgetBox. Please report your results to the bokeh dev team so we can improve.")

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
    if @sizing_mode isnt 'fixed'
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
