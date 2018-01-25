/* XXX: partial */
import {ColumnDataSource} from "./column_data_source"
import * as p from "core/properties"

export namespace RemoteDataSource {
  export interface Attrs extends ColumnDataSource.Attrs {
    data_url: string
    polling_interval: number
  }
}

export interface RemoteDataSource extends ColumnDataSource, RemoteDataSource.Attrs {}

export class RemoteDataSource extends ColumnDataSource {

  static initClass() {
    this.prototype.type = 'RemoteDataSource'

    this.define({
      data_url:         [ p.String    ],
      polling_interval: [ p.Number    ],
    })
  }
}
RemoteDataSource.initClass()
