import {ColumnarDataSource} from "./columnar_data_source"
import {Arrayable, Data} from "core/types"
import {PatchSet} from "core/patching"
import * as p from "core/properties"

// Data source where the data is defined column-wise, i.e. each key in the
// the data attribute is a column name, and its value is an array of scalars.
// Each column should be the same length.
export namespace ColumnDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColumnarDataSource.Props & {
    data: p.Property<{[key: string]: Arrayable}>
  }
}

export interface ColumnDataSource extends ColumnDataSource.Attrs {}

export class ColumnDataSource extends ColumnarDataSource {
  override properties: ColumnDataSource.Props

  constructor(attrs?: Partial<ColumnDataSource.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ColumnDataSource.Props>(({Any, Dict, Arrayable}) => ({
      data: [ Dict(Arrayable(Any)), {} ],
    }))
  }

  stream(new_data: Data, rollover?: number, {sync}: {sync?: boolean} = {}): void {
    this.stream_to(this.properties.data, new_data, rollover, {sync})
  }

  patch(patches: PatchSet<unknown>, {sync}: {sync?: boolean} = {}): void {
    this.patch_to(this.properties.data, patches, {sync})
  }
}
