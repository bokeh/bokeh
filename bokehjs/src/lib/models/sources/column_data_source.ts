import {ColumnarDataSource} from "./columnar_data_source"
import type {Data} from "core/types"
import type * as p from "core/properties"

// Data source where the data is defined column-wise, i.e. each key in the
// the data attribute is a column name, and its value is an array of scalars.
// Each column should be the same length.
export namespace ColumnDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColumnarDataSource.Props & {
    data: p.Property<Data>
  }
}

export interface ColumnDataSource extends ColumnDataSource.Attrs {}

export class ColumnDataSource extends ColumnarDataSource {
  declare properties: ColumnDataSource.Props

  constructor(attrs?: Partial<ColumnDataSource.Attrs>) {
    super(attrs)
  }

  static {
    this.define<ColumnDataSource.Props>(({Unknown, Dict, Arrayable}) => ({
      data: [ Dict(Arrayable(Unknown)), {} ],
    }))
  }
}
