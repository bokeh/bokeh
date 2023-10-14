import {CompositeFilter} from "./composite_filter"
import type * as p from "core/properties"
import type {Indices} from "core/types"

export namespace IntersectionFilter {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CompositeFilter.Props
}

export interface IntersectionFilter extends IntersectionFilter.Attrs {}

export class IntersectionFilter extends CompositeFilter {
  declare properties: IntersectionFilter.Props

  constructor(attrs?: Partial<IntersectionFilter.Attrs>) {
    super(attrs)
  }

  protected _inplace_op(index: Indices, op: Indices): void {
    index.intersect(op)
  }
}
