_ = require "underscore"

{Variable, EQ, GE, Strength}  = require "./solver"
Model = require "../../model"
p = require "../properties"

class LayoutCanvas extends Model
  type: 'LayoutCanvas'

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

  _doc_attached: () ->
    @_top = new Variable('top')
    @_left = new Variable('left')
    @_width = new Variable('width')
    @_height = new Variable('height')
    @_right = new Variable('right')
    @_bottom = new Variable('bottom')

    # TODO (bird) - I'd like to get rid of these to reduce confusion
    @define_computed_property('height', @_get_var, false)
    @define_computed_property('width', @_get_var, false)
    @define_computed_property('right', @_get_var, false)
    @define_computed_property('left', @_get_var, false)
    @define_computed_property('top', @_get_var, false)
    @define_computed_property('bottom', @_get_var, false)

  _get_var: (prop_name) ->
    return @['_' + prop_name].value()

module.exports =
  Model: LayoutCanvas
