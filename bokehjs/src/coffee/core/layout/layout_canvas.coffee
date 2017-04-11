import {Variable, Strength} from "./solver"
import {Model} from "../../model"
import * as p from "../properties"

export class LayoutCanvas extends Model
  type: 'LayoutCanvas'

  initialize: (attrs, options)->
    super(attrs, options)
    @_top = new Variable("top #{@id}")
    @_left = new Variable("left #{@id}")
    @_width = new Variable("width #{@id}")
    @_height = new Variable("height #{@id}")
    @_right = new Variable("right #{@id}")
    @_bottom = new Variable("bottom #{@id}")

  # TODO (bird) - I'd like to get rid of these to reduce confusion
  @getters {
    height: () -> @_height.value()
    width: () -> @_width.value()
    right: () -> @_right.value()
    left: () -> @_left.value()
    top: () -> @_top.value()
    bottom: () -> @_bottom.value()
  }

  @internal {
    layout_location: [ p.Any ]
  }

  get_edit_variables: () ->
    editables = []
    editables.push({edit_variable: @_top, strength: Strength.strong})
    editables.push({edit_variable: @_left, strength: Strength.strong})
    editables.push({edit_variable: @_width, strength: Strength.strong})
    editables.push({edit_variable: @_height, strength: Strength.strong})
    return editables

  get_constraints: () -> []
