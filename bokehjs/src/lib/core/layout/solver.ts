import {Variable, Expression, Constraint, Operator, Strength, Solver as ConstraintSolver} from "kiwi"

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

export interface ComputedVariable {
  readonly value: number
}

export class Solver {

  protected solver: ConstraintSolver

  constructor() {
    this.solver = new ConstraintSolver()
  }

  clear(): void {
    this.solver = new ConstraintSolver()
  }

  toString(): string {
    return `Solver(num_constraints=${this.num_constraints}, num_editables=${this.num_editables})`
  }

  get num_constraints(): number {
    return this.solver.numConstraints
  }

  get num_editables(): number {
    return this.solver.numEditVariables
  }

  get_constraints(): Constraint[] {
    return this.solver.getConstraints()
  }

  update_variables(): void {
    this.solver.updateVariables()
  }

  has_constraint(constraint: Constraint): boolean {
    return this.solver.hasConstraint(constraint)
  }

  add_constraint(constraint: Constraint): void {
    try {
      this.solver.addConstraint(constraint)
    } catch (e) {
      throw new Error(`${e.message}: ${constraint.toString()}`)
    }
  }

  remove_constraint(constraint: Constraint): void {
    this.solver.removeConstraint(constraint)
  }

  add_edit_variable(variable: Variable, strength: number): void {
    this.solver.addEditVariable(variable, strength)
  }

  remove_edit_variable(variable: Variable): void {
    this.solver.removeEditVariable(variable)
  }

  suggest_value(variable: Variable, value: number): void {
    this.solver.suggestValue(variable, value)
  }
}
