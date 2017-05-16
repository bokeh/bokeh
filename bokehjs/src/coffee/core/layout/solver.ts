import {Variable, Expression, Constraint, Operator, Strength, Solver as ConstraintSolver} from "kiwi"
import {Signal} from "../signaling"

export type Term = number | Variable | [number, Variable]

function _constrainer(op: Operator) {
  return (...terms: Term[]) => new Constraint(new Expression(...terms), op)
}

function _weak_constrainer(op: Operator) {
  return (...terms: Term[]) => new Constraint(new Expression(...terms), op, Strength.weak)
}

export {Variable, Expression, Constraint, Operator, Strength}

export const EQ = _constrainer(Operator.Eq)
export const LE = _constrainer(Operator.Le)
export const GE = _constrainer(Operator.Ge)

export const WEAK_EQ = _weak_constrainer(Operator.Eq)
export const WEAK_LE = _weak_constrainer(Operator.Le)
export const WEAK_GE = _weak_constrainer(Operator.Ge)

export class Solver {

  readonly layout_update = new Signal<void, Solver>(this, "layout_update")
  readonly layout_reset = new Signal<void, Solver>(this, "layout_reset")
  readonly resize = new Signal<void, Solver>(this, "resize")

  protected solver: ConstraintSolver

  constructor() {
    this.solver = new ConstraintSolver()
  }

  clear(): void {
    this.solver = new ConstraintSolver()
    this.layout_reset.emit(undefined)
  }

  toString(): string {
    return `Solver(num_constraints=${this.num_constraints}, num_edit_variables=${this.num_edit_variables})`
  }

  get num_constraints(): number {
    return this.solver.numConstraints
  }

  get num_edit_variables(): number {
    return this.solver.numEditVariables
  }

  update_variables(trigger: boolean = true): void {
    this.solver.updateVariables()
    if (trigger) {
      this.layout_update.emit(undefined)
    }
  }

  has_constraint(constraint: Constraint): boolean {
    return this.solver.hasConstraint(constraint)
  }

  add_constraint(constraint: Constraint): void {
    this.solver.addConstraint(constraint)
  }

  remove_constraint(constraint: Constraint, silent: boolean = false): void {
    this.solver.removeConstraint(constraint, silent)
  }

  add_edit_variable(variable: Variable, strength: number): void {
    this.solver.addEditVariable(variable, strength)
  }

  remove_edit_variable(variable: Variable, silent: boolean = false): void {
    this.solver.removeEditVariable(variable, silent)
  }

  suggest_value(variable: Variable, value: number): void {
    this.solver.suggestValue(variable, value)
  }
}
