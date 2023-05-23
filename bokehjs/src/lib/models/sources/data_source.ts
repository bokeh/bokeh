import {Model} from "../../model"
import {Selection} from "../selections/selection"
import type * as p from "core/properties"

export namespace DataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    selected: p.Property<Selection>
  }
}

export interface DataSource extends DataSource.Attrs {}

export abstract class DataSource extends Model {
  declare properties: DataSource.Props

  constructor(attrs?: Partial<DataSource.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DataSource.Props>(({Ref}) => ({
      selected: [ Ref(Selection), () => new Selection(), {readonly: true} ],
    }))
  }

  setup?(): void
}
