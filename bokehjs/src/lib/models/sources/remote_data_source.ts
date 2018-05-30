import {ColumnDataSource} from "./column_data_source"
import * as p from "core/properties"
import {Arrayable} from "core/types"

export namespace RemoteDataSource {
  export interface Attrs extends ColumnDataSource.Attrs {
    data_url: string
    polling_interval: number
  }

  export interface Props extends ColumnDataSource.Props {}
}

export interface RemoteDataSource extends RemoteDataSource.Attrs {}

export abstract class RemoteDataSource extends ColumnDataSource {

  properties: RemoteDataSource.Props

  constructor(attrs?: Partial<RemoteDataSource.Attrs>) {
    super(attrs)
  }

  get_column(colname: string): Arrayable {
    const column = this.data[colname]
    return column != null ? column : []
  }

  // override this method to setup the connection to the remote source
  abstract setup(): void

  initialize(): void {
    super.initialize()
    this.setup()
  }

  static initClass(): void {
    this.prototype.type = 'RemoteDataSource'

    this.define({
      data_url:         [ p.String ],
      polling_interval: [ p.Number ],
    })
  }
}
RemoteDataSource.initClass()
