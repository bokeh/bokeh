_ = require "underscore"
Backbone = require "backbone"
kiwi = require "kiwi"

{Variable, Expression, Constraint, Operator, Strength} = kiwi

_constrainer = (op) ->
  () =>
    expr = Object.create(Expression.prototype)
    Expression.apply(expr, arguments)
    return new Constraint(expr, op)

_weak_constrainer = (op) ->
  () ->
    args = [null]
    for arg in arguments
      args.push(arg)
    new Constraint( new (Function.prototype.bind.apply(Expression, args)), op, kiwi.Strength.weak )


class Solver

  constructor: () ->
    @solver = new kiwi.Solver()

  clear: () ->
    @solver = new kiwi.Solver()

  toString: () -> "Solver[num_constraints=#{@num_constraints()}, num_edit_variables=#{@num_edit_variables()}]"

  num_constraints: () ->
    @solver._cnMap._array.length

  num_edit_variables: () ->
    @solver._editMap._array.length

  update_variables: (trigger=true) ->
    @solver.updateVariables()
    if trigger
      @trigger('layout_update')

  add_constraint: (constraint) ->
    @solver.addConstraint(constraint)

  remove_constraint: (constraint) ->
    @solver.removeConstraint(constraint)

  add_edit_variable: (variable, strength) ->
    @solver.addEditVariable(variable, strength)

  remove_edit_variable: (variable) ->
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

  WEAK_EQ: _weak_constrainer(Operator.Eq)
  WEAK_LE: _weak_constrainer(Operator.Le)
  WEAK_GE: _weak_constrainer(Operator.Ge)

  Solver: Solver
