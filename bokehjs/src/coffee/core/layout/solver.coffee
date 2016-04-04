_ = require "underscore"
Backbone = require "backbone"
kiwi = require "kiwi"

{Variable, Expression, Constraint, Operator, Strength} = kiwi

_constrainer = (op) ->
  () =>
    expr = Object.create(Expression.prototype)
    Expression.apply(expr, arguments)
    return new Constraint(expr, op)

class Solver

  constructor: () ->
    @num_constraints = 0
    @solver = new kiwi.Solver()

  toString: () -> "Solver[num_constraints=#{@num_constraints}]"

  update_variables: (trigger=true) ->
    @solver.updateVariables()
    if trigger
      @trigger('layout_update')

  add_constraint: (constraint) ->
    @num_constraints += 1
    @solver.addConstraint(constraint)

  remove_constraint: (constraint) ->
    @num_constraints -= 1
    @solver.removeConstraint(constraint)

  add_edit_variable: (variable, strength=Strength.strong) ->
    @num_constraints += 1
    @solver.addEditVariable(variable, strength)

  remove_edit_variable: (variable) ->
    @num_constraints -= 1
    @solver.removeEditVariable(variable, strength)

  suggest_value: (variable, value) ->
    @solver.suggestValue(variable, value)

_.extend(Solver.prototype, Backbone.Events)

module.exports =

  Variable: Variable
  Expression: Expression
  Constraint: Constraint
  Operator: Operator
  Strength: Strength

  EQ: _constrainer(Operator.Eq)
  LE: _constrainer(Operator.Le)
  GE: _constrainer(Operator.Ge)

  Solver: Solver
