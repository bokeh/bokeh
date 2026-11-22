import type {IndexedDataSource} from "../sources/indexed_data_source"
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

  static {
    this.define<Stack.Props>(({Str, List}) => ({
      fields: [ List(Str), [] ],
    }))
  }

  protected _v_compute(source: IndexedDataSource): Arrayable<number> {
    const n = source.get_length() ?? 0
    const result = new Float64Array(n)
    for (const f of this.fields) {
      const column = source.get_field(f)
      if (column != null) {
        const k = Math.min(n, column.length)
        for (let i = 0; i < k; i++) {
          result[i] += column[i] as number
        }
      }
    }
    return result
  }
}
