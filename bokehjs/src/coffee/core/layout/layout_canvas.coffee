import {GE, EQ, Variable} from "./solver"
import {HasProps} from "../has_props"
import * as p from "../properties"

export class LayoutCanvas extends HasProps
  type: 'LayoutCanvas'

  initialize: (attrs, options)->
    super(attrs, options)
    @_top = new Variable("#{@toString()}.top")
    @_left = new Variable("#{@toString()}.left")
    @_width = new Variable("#{@toString()}.width")
    @_height = new Variable("#{@toString()}.height")
    @_right = new Variable("#{@toString()}.right")
    @_bottom = new Variable("#{@toString()}.bottom")
    @_hcenter = new Variable("#{@toString()}.hcenter")
    @_vcenter = new Variable("#{@toString()}.vcenter")

  get_editables: () ->
    return []

  get_constraints: () ->
    return [
      GE(@_top),
      GE(@_bottom),
      GE(@_left),
      GE(@_right),
      GE(@_width),
      GE(@_height),
      EQ(@_left, @_width, [-1, @_right]),
      EQ(@_bottom, @_height, [-1, @_top]),
      EQ([2, @_hcenter], [-1, @_left], [-1, @_right])
      EQ([2, @_vcenter], [-1, @_bottom], [-1, @_top])
    ]

  @getters {
    layout_bbox: () ->
      return {
        top: @_top.value,
        left: @_left.value,
        width: @_width.value,
        height: @_height.value,
        right: @_right.value,
        bottom: @_bottom.value,
        hcenter: @_hcenter.value,
        vcenter: @_vcenter.value,
      }
  }
