import {Placeholder, PlaceholderView} from "./placeholder"
import type {Formatters} from "./placeholder"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import type {Index as DataIndex} from "core/util/templating"
import type {PlainObject} from "core/types"
import type * as p from "core/properties"

export class IndexView extends PlaceholderView {
  declare model: Index

  update(_source: ColumnarDataSource, i: DataIndex | null, _vars: PlainObject, _formatters?: Formatters): void {
    this.el.textContent = i == null ? "(null)" : `${i}`
  }
}

export namespace Index {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Placeholder.Props
}

export interface Index extends Index.Attrs {}

export class Index extends Placeholder {
  declare properties: Index.Props
  declare __view_type__: IndexView

  constructor(attrs?: Partial<Index.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = IndexView
  }
}
