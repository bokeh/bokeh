import * as _ from "underscore"

import * as CellEditors from "./cell_editors"
import * as CellFormatters from "./cell_formatters"
import * as p from "../../core/properties"
import * as Model from "../../model"

class TableColumn extends Model
  type: 'TableColumn'
  default_view: null

  @define {
      field:        [ p.String                                      ]
      title:        [ p.String                                      ]
      width:        [ p.Number,   300                               ]
      formatter:    [ p.Instance, () -> new CellFormatters.String.Model() ]
      editor:       [ p.Instance, () -> new CellEditors.String.Model()    ]
      sortable:     [ p.Bool,     true                              ]
      default_sort: [ p.String,   "ascending"                       ]
    }

  toColumn: () ->
    return {
      id: _.uniqueId()
      field: @field
      name: @title
      width: @width
      formatter: @formatter?.doFormat.bind(@formatter)
      editor: @editor
      sortable: @sortable
      defaultSortAsc: @default_sort == "ascending"
    }

export {
  TableColumn as Model
}
