import {Signal} from "core/signaling"
import {Model} from "../../model"
import type * as p from "core/properties"

export type DataChange = {
  /** Logical fields affected by an in-place update, or all fields when omitted. */
  fields?: string[]
  /** Logical records affected by an in-place update, or all records when omitted. */
  indices?: number[]
  /** Whether the update changed record count or field topology. */
  structural: boolean
}

export namespace DataSource {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Model.Props
}

export interface DataSource extends DataSource.Attrs {}

export abstract class DataSource extends Model {
  declare properties: DataSource.Props

  readonly data_changed: Signal<DataChange, this> = new Signal(this, "data_changed")

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.data_changed, this._clear_watchers)
  }

  setup?(): void
}
