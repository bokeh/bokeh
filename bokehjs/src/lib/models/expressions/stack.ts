import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"
import type {Arrayable} from "core/types"
import type * as p from "core/properties"

export namespace Stack {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    fields: p.Property<string[]>
  }
}

export interface Stack extends Stack.Attrs {}

export class Stack extends Expression {
  declare properties: Stack.Props

  constructor(attrs?: Partial<Stack.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Stack.Props>(({String, Array}) => ({
      fields: [ Array(String), [] ],
    }))
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable<number> {
    const n = source.get_length() ?? 0
    const result = new Float64Array(n)
    for (const f of this.fields) {
      const column = source.data.get(f)
      if (column != null) {
        const k = Math.min(n, column.length)
        for (let i = 0; i < k; i++) {
          result[i] += column[i]
        }
      }
    }
    return result
  }
}
