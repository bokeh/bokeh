_ = require "underscore"

LayoutDOM = require "./layout_dom"


class SpacerView extends LayoutDOM.View
  className: "bk-spacer-box"

  render: () ->
    super()
    if @sizing_mode is 'fixed'
      @$el.css({
        width: @model.width
        height: @model.height
      })

  get_height: () ->
    # spacer must always have some height
    return 1


class Spacer extends LayoutDOM.Model
  type: 'Spacer'
  default_view: SpacerView

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
      'box-equal-size-left'  : @_left
      'box-equal-size-right' : @_width_minus_right
    })
    return constrained_variables

module.exports =
  Model: Spacer
