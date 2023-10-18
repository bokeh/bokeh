import {Filter} from "./filter"
import type * as p from "core/properties"
import type {Indices} from "core/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"

export namespace InversionFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    operand: p.Property<Filter>
  }
}

export interface InversionFilter extends InversionFilter.Attrs {}

export class InversionFilter extends Filter {
  declare properties: InversionFilter.Props

  constructor(attrs?: Partial<InversionFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<InversionFilter.Props>(({Ref}) => ({
      operand: [ Ref(Filter) ],
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
      const {operand} = this.properties
      return operand.is_unset ? [] : [operand.get_value()]
    })()

    connect_operands(operands)

    this.on_change(this.properties.operand, () => {
      disconnect_operands(operands)
      operands = [this.operand]
      connect_operands(operands)
    })
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const index = this.operand.compute_indices(source)
    index.invert()
    return index
  }
}
