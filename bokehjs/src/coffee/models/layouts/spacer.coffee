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
      'box-equal-size-left'  : @_left
      'box-equal-size-right' : @_width_minus_right
    })
    return constrained_variables
