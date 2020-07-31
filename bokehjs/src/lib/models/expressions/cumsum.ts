import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"
import {Arrayable, NumberArray} from "core/types"
import * as p from "core/properties"

export namespace CumSum {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    field: p.Property<string>
    include_zero: p.Property<boolean>
  }
}

export interface CumSum extends CumSum.Attrs {}

export class CumSum extends Expression {
  properties: CumSum.Props

  constructor(attrs?: Partial<CumSum.Attrs>) {
    super(attrs)
  }

  static init_CumSum(): void {
    this.define<CumSum.Props>({
      field:        [ p.String         ],
      include_zero: [ p.Boolean, false ],
    })
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
    const result = new NumberArray(source.get_length() || 0)
    const col = source.data[this.field]
    const offset = this.include_zero ? 1 : 0
    result[0] = this.include_zero ? 0 : col[0]
    for (let i = 1; i < result.length; i++) {
      result[i] = result[i-1] + col[i-offset]
    }
    return result
  }
}
