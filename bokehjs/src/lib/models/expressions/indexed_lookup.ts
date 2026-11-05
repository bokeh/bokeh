import type {Arrayable} from "core/types"
import {is_NDArray, get_row} from "core/util/ndarray"
import {isArrayable, isInteger} from "core/util/types"
import type * as p from "core/properties"
import {ColumnarDataSource} from "../sources/columnar_data_source"
import {Expression} from "./expression"

function value_at(values: Arrayable, index: unknown): unknown {
  if (!isInteger(index)) {
    throw new Error(`lookup index must be an integer, got ${index}`)
  }
  const length = is_NDArray(values) ? values.shape[0] : values.length
  if (index < 0 || index >= length) {
    throw new Error(`lookup index ${index} is out of bounds for ${length} values`)
  }
  if (is_NDArray(values) && values.dimension > 1) {
    return get_row(values, index)
  }
  return values[index]
}

/** Gather values using scalar, nested, or shaped integer indices. */
export function gather_values(values: Arrayable, indices: Arrayable): Arrayable {
  if (is_NDArray(indices)) {
    if (indices.dimension == 1) {
      return Array.from(indices, (index) => value_at(values, index))
    }
    if (indices.dimension == 2) {
      const [rows, columns] = indices.shape
      return Array.from({length: rows}, (_, row) =>
        Array.from({length: columns}, (_, column) => value_at(values, indices[row*columns + column])),
      )
    }
    throw new Error(`lookup indices must be one- or two-dimensional, got shape [${indices.shape.join(", ")}]`)
  }

  return Array.from(indices, (index) => {
    if (isArrayable(index)) {
      return Array.from(index, (item) => value_at(values, item))
    }
    return value_at(values, index)
  })
}

export namespace IndexedLookup {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Expression.Props & {
    source: p.Property<ColumnarDataSource>
    field: p.Property<string>
    indices: p.Property<string>
  }
}

export interface IndexedLookup extends IndexedLookup.Attrs {}

/** Resolve indices on one source against values stored in another source. */
export class IndexedLookup extends Expression {
  declare properties: IndexedLookup.Props

  static {
    this.define<IndexedLookup.Props>(({Ref, Str}) => ({
      source:  [ Ref(ColumnarDataSource) ],
      field:   [ Str ],
      indices: [ Str ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()

    const clear = () => this._result.clear()
    const invalidate = () => {
      clear()
      this.change.emit()
    }
    const connect_source = (source: ColumnarDataSource) => {
      this.connect(source.change, invalidate)
      this.connect(source.streaming, invalidate)
      this.connect(source.patching, invalidate)
    }
    const disconnect_source = (source: ColumnarDataSource) => {
      this.disconnect(source.change, invalidate)
      this.disconnect(source.streaming, invalidate)
      this.disconnect(source.patching, invalidate)
    }

    let source = this.source
    connect_source(source)
    this.on_change(this.properties.source, () => {
      disconnect_source(source)
      source = this.source
      connect_source(source)
      clear()
    })
    this.on_change([this.properties.field, this.properties.indices], clear)
  }

  protected _v_compute(source: ColumnarDataSource): Arrayable {
    const values = this.source.get_column(this.field)
    if (values == null) {
      throw new Error(`unknown lookup field '${this.field}' in ${this.source}`)
    }
    const indices = source.get_column(this.indices)
    if (indices == null) {
      throw new Error(`unknown index field '${this.indices}' in ${source}`)
    }
    return gather_values(values, indices)
  }
}
