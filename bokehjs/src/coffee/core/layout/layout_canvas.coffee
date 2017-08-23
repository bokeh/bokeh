import {GE, EQ, Variable} from "./solver"
import {Model} from "../../model"
import * as p from "../properties"

export class LayoutCanvas extends Model
  type: 'LayoutCanvas'

  initialize: (attrs, options)->
    super(attrs, options)
    @_top = new Variable("#{@toString()}.top")
    @_left = new Variable("#{@toString()}.left")
    @_width = new Variable("#{@toString()}.width")
    @_height = new Variable("#{@toString()}.height")
    @_right = new Variable("#{@toString()}.right")
    @_bottom = new Variable("#{@toString()}.bottom")

  get_editables: () ->
    return [@_width, @_height]

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
      }
  }

  dump_layout: () ->
    console.log(this.toString(), @layout_bbox)
