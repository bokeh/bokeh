import {CellFormatter, StringFormatter} from "./cell_formatters"
import {CellEditor, StringEditor} from "./cell_editors"
import type {ColumnType} from "./definitions"

import type * as p from "core/properties"
import {unique_id} from "core/util/string"
import {Sort} from "core/enums"
import {Comparison} from "../../../models/comparisons"
import {Model} from "../../../model"

export namespace TableColumn {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    field: p.Property<string>
    title: p.Property<string | null>
    width: p.Property<number>
    formatter: p.Property<CellFormatter>
    editor: p.Property<CellEditor>
    sortable: p.Property<boolean>
    default_sort: p.Property<Sort>
    visible: p.Property<boolean>
    sorter: p.Property<Comparison | null>
  }
}

export interface TableColumn extends TableColumn.Attrs {}

export class TableColumn extends Model {
  declare properties: TableColumn.Props

  constructor(attrs?: Partial<TableColumn.Attrs>) {
    super(attrs)
  }

  static {
    this.define<TableColumn.Props>(({Bool, Float, Str, Nullable, Ref}) => ({
      field:        [ Str ],
      title:        [ Nullable(Str), null ],
      width:        [ Float, 300 ],
      formatter:    [ Ref(CellFormatter), () => new StringFormatter() ],
      editor:       [ Ref(CellEditor), () => new StringEditor() ],
      sortable:     [ Bool, true ],
      default_sort: [ Sort, "ascending" ],
      visible:      [ Bool, true ],
      sorter:       [ Nullable(Ref(Comparison)), null ],
    }))
  }

  toColumn(): ColumnType {
    return {
      id: unique_id(),
      field: this.field,
      name: this.title ?? this.field,
      width: this.width,
      formatter: this.formatter.doFormat.bind(this.formatter),
      model: this.editor,
      editor: this.editor.default_view,
      sortable: this.sortable,
      defaultSortAsc: this.default_sort == "ascending",
      sorter: this.sorter,
    }
  }
}
