import {CellFormatter, StringFormatter} from "./cell_formatters"
import {CellEditor, StringEditor} from "./cell_editors"

import * as p from "core/properties"
import {Column} from "slickgrid"
import {uniqueId} from "core/util/string"
import {Sort} from "core/enums"
import {Model} from "../../../model"

export type Item = {[key: string]: any}
export type ColumnType = Column<Item> & {model?: CellEditor}

export namespace TableColumn {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    field: p.Property<string>
    title: p.Property<string>
    width: p.Property<number>
    formatter: p.Property<CellFormatter>
    editor: p.Property<CellEditor>
    sortable: p.Property<boolean>
    default_sort: p.Property<Sort>
  }
}

export interface TableColumn extends TableColumn.Attrs {}

export class TableColumn extends Model {
  properties: TableColumn.Props

  constructor(attrs?: Partial<TableColumn.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.define<TableColumn.Props>({
      field:        [ p.String                                ],
      title:        [ p.String                                ],
      width:        [ p.Number,   300                         ],
      formatter:    [ p.Instance, () => new StringFormatter() ],
      editor:       [ p.Instance, () => new StringEditor()    ],
      sortable:     [ p.Boolean,  true                        ],
      default_sort: [ p.Sort,     "ascending"                 ],
    })
  }

  toColumn(): ColumnType {
    return {
      id: uniqueId(),
      field: this.field,
      name: this.title,
      width: this.width,
      formatter: this.formatter != null ? this.formatter.doFormat.bind(this.formatter) : undefined,
      model: this.editor,
      editor: this.editor.default_view,
      sortable: this.sortable,
      defaultSortAsc: this.default_sort == "ascending",
    }
  }
}
TableColumn.initClass()
