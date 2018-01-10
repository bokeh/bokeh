/* XXX: partial */
import {StringFormatter} from "./cell_formatters";
import {StringEditor} from "./cell_editors";
import * as p from "core/properties";
import {uniqueId} from "core/util/string";
import {Model} from "../../../model"

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

  toColumn() {
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
