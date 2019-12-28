import {Model} from "../../model"
import {Selection} from "../selections/selection"
import * as p from "core/properties"

export namespace DataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    selected: p.Property<Selection>
  }
}

export interface DataSource extends DataSource.Attrs {}

export abstract class DataSource extends Model {
  properties: DataSource.Props

  constructor(attrs?: Partial<DataSource.Attrs>) {
    super(attrs)
  }

  static init_DataSource(): void {
    this.define<DataSource.Props>({
      selected: [ p.Instance, () => new Selection() ], // TODO (bev)
    })
  }

  setup?(): void
}
