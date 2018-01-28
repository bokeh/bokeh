/* XXX: partial */
import {CellFormatter, StringFormatter} from "./cell_formatters";
import {CellEditor, StringEditor} from "./cell_editors";
import {Class} from "core/class"
import * as p from "core/properties";
import {uniqueId} from "core/util/string";
import {View} from "core/view"
import {Model} from "../../../model"

export namespace TableColumn {
  export interface Attrs extends Model.Attrs {
    field: string
    title: string
    width: number
    formatter: CellFormatter
    editor: CellEditor
    sortable: boolean
    default_sort: "ascending" | "descending"
  }

  export interface Opts extends Model.Opts {}
}

export interface TableColumn extends TableColumn.Attrs {}

export class TableColumn extends Model {

  static initClass() {
    this.prototype.type = 'TableColumn';
    this.prototype.default_view = null;

    this.define({
      field:        [ p.String                                ],
      title:        [ p.String                                ],
      width:        [ p.Number,   300                         ],
      formatter:    [ p.Instance, () => new StringFormatter() ],
      editor:       [ p.Instance, () => new StringEditor()    ],
      sortable:     [ p.Bool,     true                        ],
      default_sort: [ p.String,   "ascending"                 ],
    });
  }

  toColumn(): {
    id: string,
    field: string,
    name: string,
    width: number,
    formatter: (...args: any[]) => HTMLElement,
    editor: Class<View>,
    sortable: boolean,
    defaultSortAsc: boolean,
  } {
    return {
      id: uniqueId(),
      field: this.field,
      name: this.title,
      width: this.width,
      formatter: (this.formatter != null ? this.formatter.doFormat.bind(this.formatter) : undefined),
      editor: this.editor.default_view,
      sortable: this.sortable,
      defaultSortAsc: this.default_sort === "ascending",
    };
  }
}
TableColumn.initClass();
