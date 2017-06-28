import {Model} from "../../model"
import {ColumnDataSource} from "../sources/column_data_source"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"

export class GraphDataSource extends Model
  type: 'GraphDataSource'

  @define {
    nodes:           [ p.Instance, () -> new ColumnDataSource({data: {index: []}})          ]
    edges:           [ p.Instance, () -> new ColumnDataSource({data: {start: [], end: []}}) ]
    layout_provider: [ p.Instance                                                           ]
  }
