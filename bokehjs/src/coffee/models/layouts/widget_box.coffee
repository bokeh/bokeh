import {logger} from "core/logging"
import * as p from "core/properties"
import {extend} from "core/util/object"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"


export class WidgetBoxView extends LayoutDOMView
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
      css_width = "#{@model._width._value - 20}px"
    else
      css_width = "100%"

    if @model.sizing_mode is 'stretch_both'
      @el.style.position = 'absolute'
      @el.style.left = "#{@model._dom_left._value}px"
      @el.style.top = "#{@model._dom_top._value}px"
      @el.style.width = "#{@model._width._value}px"
      @el.style.height = "#{@model._height._value}px"
    else
      # Note we DO NOT want to set a height (except in stretch_both). Widgets
      # are happier sizing themselves. We've tried to tell the layout what
      # the height is with the suggest_value. But that doesn't mean we need
      # to put it in the dom.
      @el.style.width = css_width

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


export class WidgetBox extends LayoutDOM
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
    constrained_variables = extend(constrained_variables, {
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
      constrained_variables = extend(constrained_variables, {
        'box-equal-size-left'  : @_left
        'box-equal-size-right' : @_width_minus_right
      })
    return constrained_variables

  get_layoutable_children: () ->
    return @children

  @define {
    'children': [ p.Array, [] ]
  }
