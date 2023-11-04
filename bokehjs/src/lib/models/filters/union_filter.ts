import {CompositeFilter} from "./composite_filter"
import type * as p from "core/properties"
import type {Indices} from "core/types"

export namespace UnionFilter {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CompositeFilter.Props
}

export interface UnionFilter extends UnionFilter.Attrs {}

export class UnionFilter extends CompositeFilter {
  declare properties: UnionFilter.Props

  constructor(attrs?: Partial<UnionFilter.Attrs>) {
    super(attrs)
  }

  protected _inplace_op(index: Indices, op: Indices): void {
    index.add(op)
  }
}
