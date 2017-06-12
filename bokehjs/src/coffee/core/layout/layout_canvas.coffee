import {GE, Variable, Strength} from "./solver"
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

  get_edit_variables: () ->
    editables = []
    editables.push({edit_variable: @_top, strength: Strength.strong})
    editables.push({edit_variable: @_left, strength: Strength.strong})
    editables.push({edit_variable: @_width, strength: Strength.strong})
    editables.push({edit_variable: @_height, strength: Strength.strong})
    return editables

  get_constraints: () ->
    return [
      GE(@_top),
      GE(@_bottom),
      GE(@_left),
      GE(@_right),
      GE(@_width),
      GE(@_height),
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
