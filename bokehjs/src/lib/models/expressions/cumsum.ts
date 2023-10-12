import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"
import {assert} from "core/util/assert"

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

  constructor(attrs?: Partial<CumSum.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CumSum.Props>(({Boolean, String}) => ({
      field:        [ String         ],
      include_zero: [ Boolean, false ],
    }))
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
    const result = new Float64Array(source.get_length() ?? 0)
    const col = source.data.get(this.field)
    assert(col != null && col.length == result.length)
    const offset = this.include_zero ? 1 : 0
    result[0] = this.include_zero ? 0 : col[0]
    for (let i = 1; i < result.length; i++) {
      result[i] = result[i-1] + col[i-offset]
    }
    return result
  }
}
