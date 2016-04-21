_ = require "underscore"

{Variable, EQ, GE, Strength}  = require "./solver"
Model = require "../../model"
p = require "../properties"

class LayoutCanvas extends Model
  type: 'LayoutCanvas'

  @internal {
    layout_location: [ p.Any ]
  }

  _doc_attached: () ->
    solver = @document.solver()

    @var_constraints = {}

    for v in ['top', 'left', 'width', 'height']
      name = '_'+v
      @[name] = new Variable(v)
      @define_computed_property(v, @_get_var, false)
      solver.add_edit_variable(@[name], Strength.strong)

    for v in ['right', 'bottom']
      name = '_'+v
      @[name] = new Variable(v)
      @define_computed_property(v, @_get_var, false)

    solver.add_constraint(GE(@_top))
    solver.add_constraint(GE(@_bottom))
    solver.add_constraint(GE(@_left))
    solver.add_constraint(GE(@_right))
    solver.add_constraint(GE(@_width))
    solver.add_constraint(GE(@_height))
    solver.add_constraint(EQ(@_left, @_width, [-1, @_right]))
    solver.add_constraint(EQ(@_bottom, @_height, [-1, @_top]))


  set_var: (name, value) ->
    v = @['_' + name]
    @document.solver().suggest_value(v, value)

  _get_var: (prop_name) ->
    return @['_' + prop_name].value()


module.exports =
  Model: LayoutCanvas
