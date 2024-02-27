import {Filter} from "./filter"
import type * as p from "core/properties"
import {Indices} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace CompositeFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    operands: p.Property<Filter[]>
  }
}

export interface CompositeFilter extends CompositeFilter.Attrs {}

export abstract class CompositeFilter extends Filter {
  declare properties: CompositeFilter.Props

  constructor(attrs?: Partial<CompositeFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CompositeFilter.Props>(({List, Ref}) => ({
      operands: [ List(Ref(Filter)) ],
    }))
  }

  override connect_signals(): void {
    super.connect_signals()

    const emit_changed = () => {
      this.change.emit()
    }

    const connect_operands = (operands: Filter[]) => {
      for (const operand of operands) {
        this.connect(operand.change, emit_changed)
      }
    }

    const disconnect_operands = (operands: Filter[]) => {
      for (const operand of operands) {
        this.disconnect(operand.change, emit_changed)
      }
    }

    let operands = (() => {
      const {operands} = this.properties
      return operands.is_unset ? [] : operands.get_value()
    })()

    connect_operands(operands)

    this.on_change(this.properties.operands, () => {
      disconnect_operands(operands)
      operands = this.operands
      connect_operands(operands)
    })
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const {operands} = this
    if (operands.length == 0) {
      const size = source.get_length() ?? 1
      return Indices.all_set(size)
    } else {
      const [index, ...rest] = operands.map((op) => op.compute_indices(source))
      for (const op of rest) {
        this._inplace_op(index, op)
      }
      return index
    }
  }

  protected abstract _inplace_op(index: Indices, op: Indices): void
}
