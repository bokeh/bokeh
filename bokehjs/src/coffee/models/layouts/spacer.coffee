import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {extend} from "core/util/object"

export class SpacerView extends LayoutDOMView
  className: "bk-spacer-box"

  render: () ->
    super()
    if @sizing_mode is 'fixed'
      @el.style.width = "#{@model.width}px"
      @el.style.height = "#{@model.height}px"

  get_height: () ->
    # spacer must always have some height
    return 1


export class Spacer extends LayoutDOM
  type: 'Spacer'
  default_view: SpacerView

  get_constrained_variables: () ->
    return extend({}, super(), {
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
      box_equal_size_left  : @_left
      box_equal_size_right : @_width_minus_right
    })
