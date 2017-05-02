import {Variable, Expression, Constraint, Operator, Strength, Solver as ConstraintSolver} from "kiwi"
import {Signal, Signalable} from "../signaling"

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
  @prototype extends Signalable

  constructor: () ->
    @layout_update = new Signal(this, "layout_update")
    @layout_reset = new Signal(this, "layout_reset")
    @resize = new Signal(this, "resize")

    @solver = new ConstraintSolver()

  clear: () ->
    @solver = new ConstraintSolver()
    @layout_reset.emit()

  toString: () -> "Solver[num_constraints=#{@num_constraints()}, num_edit_variables=#{@num_edit_variables()}]"

  num_constraints: () ->
    @solver._cnMap._array.length

  num_edit_variables: () ->
    @solver._editMap._array.length

  update_variables: (trigger=true) ->
    @solver.updateVariables()
    if trigger
      @layout_update.emit()

  has_constraint: (constraint) ->
    return @solver.hasConstraint(constraint)

  add_constraint: (constraint) ->
    @solver.addConstraint(constraint)

  remove_constraint: (constraint, silent=false) ->
    @solver.removeConstraint(constraint, silent)

  add_edit_variable: (variable, strength) ->
    @solver.addEditVariable(variable, strength)

  remove_edit_variable: (variable, silent=false) ->
    @solver.removeEditVariable(variable, strength, silent)

  suggest_value: (variable, value) ->
    @solver.suggestValue(variable, value)
