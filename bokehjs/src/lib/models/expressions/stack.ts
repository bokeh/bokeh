import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"
import {Arrayable, NumberArray} from "core/types"
import * as p from "core/properties"

export namespace Stack {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    fields: p.Property<string[]>
  }
}

export interface Stack extends Stack.Attrs {}

export class Stack extends Expression {
  properties: Stack.Props

  constructor(attrs?: Partial<Stack.Attrs>) {
    super(attrs)
  }

  static init_Stack(): void {
    this.define<Stack.Props>({
      fields: [ p.Array, [] ],
    })
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
    const n = source.get_length() ?? 0
    const result = new NumberArray(n)
    for (const f of this.fields) {
      const column = source.data[f]
      if (column != null) {
        for (let i = 0, k = Math.min(n, column.length); i < k; i++) {
          result[i] += column[i]
        }
      }
    }
    return result
  }
}
