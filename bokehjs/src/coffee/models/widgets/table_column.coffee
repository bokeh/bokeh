import {StringFormatter} from "./cell_formatters"
import {StringEditor} from "./cell_editors"
import * as p from "core/properties"
import {uniqueId} from "core/util/string"
import {Model} from "../../model"

export class TableColumn extends Model
  type: 'TableColumn'
  default_view: null

  @define {
      field:        [ p.String                                      ]
      title:        [ p.String                                      ]
      width:        [ p.Number,   300                               ]
      formatter:    [ p.Instance, () -> new StringFormatter() ]
      editor:       [ p.Instance, () -> new StringEditor()    ]
      sortable:     [ p.Bool,     true                              ]
      default_sort: [ p.String,   "ascending"                       ]
    }

  toColumn: () ->
    return {
      id: uniqueId()
      field: @field
      name: @title
      width: @width
      formatter: @formatter?.doFormat.bind(@formatter)
      editor: @editor
      sortable: @sortable
      defaultSortAsc: @default_sort == "ascending"
    }
