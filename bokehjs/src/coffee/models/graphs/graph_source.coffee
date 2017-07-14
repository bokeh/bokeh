import {Model} from "../../model"
import {ColumnDataSource} from "../sources/column_data_source"
import {logger} from "../../core/logging"
import * as p from "../../core/properties"

export class GraphSource extends Model
  type: 'GraphSource'

  @define {
    nodes:           [ p.Instance, () -> new ColumnDataSource({data: {index: []}, column_names: ["index"]}) ]
    edges:           [ p.Instance, () -> new ColumnDataSource({data: {start: [], end: []}, column_names: ["start", "end"]}) ]
    layout_provider: [ p.Instance                                                                           ]
  }
