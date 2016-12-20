import * as _ from "underscore"
import {Variable, Expression, Constraint, Operator, Strength, Solver as ConstraintSolver} from "kiwi"
import {Events} from "../events"

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
    new Constraint( new (Function.prototype.bind.apply(Expression, args)), op, Strength.weak )

export {Variable, Expression, Constraint, Operator, Strength}

export EQ = _constrainer(Operator.Eq)
export LE = _constrainer(Operator.Le)
export GE = _constrainer(Operator.Ge)

export WEAK_EQ = _weak_constrainer(Operator.Eq)
export WEAK_LE = _weak_constrainer(Operator.Le)
export WEAK_GE = _weak_constrainer(Operator.Ge)

export class Solver
  _.extend(@prototype, Events)

  constructor: () ->
    @solver = new ConstraintSolver()

  clear: () ->
    @solver = new ConstraintSolver()

  toString: () -> "Solver[num_constraints=#{@num_constraints()}, num_edit_variables=#{@num_edit_variables()}]"

  num_constraints: () ->
    @solver._cnMap._array.length

  num_edit_variables: () ->
    @solver._editMap._array.length

  update_variables: (trigger=true) ->
    @solver.updateVariables()
    if trigger
      @trigger('layout_update')

  add_constraint: (constraint, optimize=true) ->
    @solver.addConstraint(constraint, optimize)

  remove_constraint: (constraint) ->
    @solver.removeConstraint(constraint)

  add_edit_variable: (variable, strength) ->
    @solver.addEditVariable(variable, strength)

  remove_edit_variable: (variable) ->
    @solver.removeEditVariable(variable, strength)

  suggest_value: (variable, value) ->
    @solver.suggestValue(variable, value)
