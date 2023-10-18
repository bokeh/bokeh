import {CompositeFilter} from "./composite_filter"
import type * as p from "core/properties"
import type {Indices} from "core/types"

export namespace DifferenceFilter {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CompositeFilter.Props
}

export interface DifferenceFilter extends DifferenceFilter.Attrs {}

export class DifferenceFilter extends CompositeFilter {
  declare properties: DifferenceFilter.Props

  constructor(attrs?: Partial<DifferenceFilter.Attrs>) {
    super(attrs)
  }

  protected _inplace_op(index: Indices, op: Indices): void {
    index.subtract(op)
  }
}
