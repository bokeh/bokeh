import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace Stack {
  export interface Attrs extends Expression.Attrs {
    fields: string[]
  }

  export interface Props extends Expression.Props {}
}

export interface Stack extends Stack.Attrs {}

export class Stack extends Expression {

  properties: Stack.Props

  constructor(attrs?: Partial<Stack.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Stack"

    this.define({
      fields: [ p.Array, [] ],
    })
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
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
