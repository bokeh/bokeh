import {ColumnDataSource} from "./column_data_source"
import * as p from "core/properties"

export class RemoteDataSource extends ColumnDataSource {

  data_url: string
  polling_interval: number

  static initClass() {
    this.prototype.type = 'RemoteDataSource'

    this.define({
      data_url:         [ p.String    ],
      polling_interval: [ p.Number    ],
    })
  }
}
RemoteDataSource.initClass()
