_ = require "underscore"
Backbone = require "backbone"
kiwi = require "kiwi"

{Variable, Expression, Constraint, Operator, Strength} = kiwi

_constrainer = (op) ->
  () ->
    args = [null]
    for arg in arguments
      args.push(arg)
    new Constraint( new (Function.prototype.bind.apply(Expression, args)), op )

class Solver

  constructor: () ->
    @solver = new kiwi.Solver()

  update_variables: (trigger=true) ->
    @solver.updateVariables()
    if trigger
      @trigger('layout_update')

  add_constraint: (constraint) ->
    @solver.addConstraint(constraint)

  remove_constraint: (constraint) ->
    @solver.removeConstraint(constraint)

  add_edit_variable: (variable, strength=Strength.strong) ->
    @solver.addEditVariable(variable, strength)

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
