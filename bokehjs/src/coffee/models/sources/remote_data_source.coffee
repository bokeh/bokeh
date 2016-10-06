import * as _ from "underscore"

import * as ColumnDataSource from "./column_data_source"
import * as p from "../../core/properties"

class RemoteDataSource extends ColumnDataSource.Model
  type: 'RemoteDataSource'

  @define {
      data_url:         [ p.String    ]
      polling_interval: [ p.Number    ]
    }

export {
  RemoteDataSource as Model
}
