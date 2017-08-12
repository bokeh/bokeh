import {logger} from "core/logging"
import * as p from "core/properties"
import {extend} from "core/util/object"

import {LayoutDOM, LayoutDOMView} from "../layouts/layout_dom"

export class WidgetBoxView extends LayoutDOMView
  className: "bk-widget-box"

  connect_signals: () ->
    super()
    @connect(@model.properties.children.change, () => @rebuild_child_views())

  render: () ->
    @_render_classes() # XXX: because no super()

    if @model.sizing_mode == 'fixed' or @model.sizing_mode == 'scale_height'
      width = @get_width()
      if @model._width.value != width
        @solver.suggest_value(@model._width, width)

    if @model.sizing_mode == 'fixed' or @model.sizing_mode == 'scale_width'
      height = @get_height()
      if @model._height.value != height
        @solver.suggest_value(@model._height, height)

    @solver.update_variables()

    if @model.sizing_mode == 'stretch_both'
      @el.style.position = 'absolute'
      @el.style.left = "#{@model._dom_left.value}px"
      @el.style.top = "#{@model._dom_top.value}px"
      @el.style.width = "#{@model._width.value}px"
      @el.style.height = "#{@model._height.value}px"
    else
      # Note we DO NOT want to set a height (except in stretch_both). Widgets
      # are happier sizing themselves. We've tried to tell the layout what
      # the height is with the suggest_value. But that doesn't mean we need
      # to put it in the dom.
      if @model._width.value - 20 > 0
        css_width = "#{@model._width.value - 20}px"
      else
        css_width = "100%"

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

  get_constrained_variables: () ->
    vars = extend({}, super(), {
      on_edge_align_top    : @_top
      on_edge_align_bottom : @_height_minus_bottom
      on_edge_align_left   : @_left
      on_edge_align_right  : @_width_minus_right

      box_cell_align_top   : @_top
      box_cell_align_bottom: @_height_minus_bottom
      box_cell_align_left  : @_left
      box_cell_align_right : @_width_minus_right

      box_equal_size_top   : @_top
      box_equal_size_bottom: @_height_minus_bottom
    })

    if @sizing_mode != 'fixed'
      vars.box_equal_size_left  = @_left
      vars.box_equal_size_right = @_width_minus_right

    return vars

  get_layoutable_children: () -> @children

  @define {
    children: [ p.Array, [] ]
  }
