import {LayoutCanvas as Layout} from "./layout_canvas"
import {EQ, Constraint} from "./solver"
import {head, tail, pairwise} from "../util/array"

export function vstack(container: Layout, children: Layout[]): Constraint[] {
  const constraints = []

  if (children.length > 0) {
    constraints.push(EQ(head(children)._bottom, [-1, container._bottom]))
    constraints.push(EQ(tail(children)._top,    [-1, container._top]))

    constraints.push(...pairwise(children, (prev, next) => EQ(prev._top,  [-1, next._bottom])))

    for (const child of children) {
      constraints.push(EQ(child._left,  [-1, container._left]))
      constraints.push(EQ(child._right, [-1, container._right]))
    }
  }

  return constraints
}

export function hstack(container: Layout, children: Layout[]): Constraint[] {
  const constraints = []

  if (children.length > 0) {
    constraints.push(EQ(head(children)._right,  [-1, container._right]))
    constraints.push(EQ(tail(children)._left,   [-1, container._left]))

    constraints.push(...pairwise(children, (prev, next) => EQ(prev._left, [-1, next._right])))

    for (const child of children) {
      constraints.push(EQ(child._top,    [-1, container._top]))
      constraints.push(EQ(child._bottom, [-1, container._bottom]))
    }
  }

  return constraints
}
