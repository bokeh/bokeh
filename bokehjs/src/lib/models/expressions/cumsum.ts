import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace CumSum {
  export interface Attrs extends Expression.Attrs {
    field: string
    include_zero: boolean
  }

  export interface Props extends Expression.Props {}
}

export interface CumSum extends CumSum.Attrs {}

export class CumSum extends Expression {

  properties: CumSum.Props

  constructor(attrs?: Partial<CumSum.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CumSum"

    this.define({
      field:        [ p.String         ],
      include_zero: [ p.Boolean, false ],
    })
  }

  _v_compute(source: ColumnarDataSource): Arrayable<number> {
    const result = new Float64Array(source.get_length() || 0)
    const col = source.data[this.field]
    const offset = this.include_zero ? 1 : 0
    if (this.include_zero)
        result[0] = 0
    else
        result[0] = col[0]
    for (let i = 1; i < result.length; i++) {
      result[i] = result[i-1] + col[i-offset]
    }
    return result
  }
}
CumSum.initClass()
