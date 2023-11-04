import {CompositeFilter} from "./composite_filter"
import type * as p from "core/properties"
import type {Indices} from "core/types"

export namespace SymmetricDifferenceFilter {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CompositeFilter.Props
}

export interface SymmetricDifferenceFilter extends SymmetricDifferenceFilter.Attrs {}

export class SymmetricDifferenceFilter extends CompositeFilter {
  declare properties: SymmetricDifferenceFilter.Props

  constructor(attrs?: Partial<SymmetricDifferenceFilter.Attrs>) {
    super(attrs)
  }

  protected _inplace_op(index: Indices, op: Indices): void {
    index.symmetric_subtract(op)
  }
}
