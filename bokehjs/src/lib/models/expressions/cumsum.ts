import type {IndexedDataSource} from "../sources/indexed_data_source"
import {Expression} from "./expression"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace CumSum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    field: p.Property<string>
    include_zero: p.Property<boolean>
  }
}

export interface CumSum extends CumSum.Attrs {}

export class CumSum extends Expression {
  declare properties: CumSum.Props

  static {
    this.define<CumSum.Props>(({Bool, Str}) => ({
      field:        [ Str         ],
      include_zero: [ Bool, false ],
    }))
  }

  protected _v_compute(source: IndexedDataSource): Arrayable<number> {
    const result = new Float64Array(source.get_length() ?? 0)
    const column = (source.get_field(this.field) ?? []) as number[]
    const offset = this.include_zero ? 1 : 0
    result[0] = this.include_zero ? 0 : column[0]
    for (let i = 1; i < result.length; i++) {
      result[i] = result[i-1] + column[i-offset]
    }
    return result
  }
}
