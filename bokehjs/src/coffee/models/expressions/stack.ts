import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"
import * as p from "core/properties"

export namespace Stack {
  export interface Attrs extends Expression.Attrs {
    fields: string[]
  }

  export interface Opts extends Expression.Opts {}
}

export interface Stack extends Stack.Attrs {}

export class Stack extends Expression {

  constructor(attrs?: Partial<Stack.Attrs>, opts?: Stack.Opts) {
    super(attrs, opts)
  }

  static initClass(): void {
    this.prototype.type = "Stack"

    this.define({
      fields: [ p.Array, [] ],
    })
  }

  v_compute(source: ColumnarDataSource): Float64Array {
    const result = new Float64Array(source.get_length() || 0)
    for (const f of this.fields) {
      for (let i = 0; i < source.data[f].length; i++) {
        const x = source.data[f][i]
        result[i] += x
      }
    }
    return result
  }
}
Stack.initClass()
