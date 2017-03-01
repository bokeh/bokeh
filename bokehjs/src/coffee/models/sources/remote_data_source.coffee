import {ColumnDataSource} from "./column_data_source"
import * as p from "core/properties"

export class RemoteDataSource extends ColumnDataSource
  type: 'RemoteDataSource'

  @define {
      data_url:         [ p.String    ]
      polling_interval: [ p.Number    ]
    }
