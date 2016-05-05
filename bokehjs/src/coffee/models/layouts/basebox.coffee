_ = require "underscore"
LayoutDOM = require "./layout_dom"
p = require "../../core/properties"

class BaseBox extends LayoutDOM.Model
  type: "BaseBox"

  @define {
      children: [ p.Array, [] ]
    }

  get_layoutable_children: () ->
    return @get('children')

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

module.exports =
  Model: BaseBox
