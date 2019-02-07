import {ColumnDataSource} from "./column_data_source"
import * as p from "core/properties"
import {Arrayable} from "core/types"

export namespace RemoteDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColumnDataSource.Props & {
    data_url: p.Property<string>
    polling_interval: p.Property<number>
  }
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

    this.define<RemoteDataSource.Props>({
      data_url:         [ p.String ],
      polling_interval: [ p.Number ],
    })
  }
}
RemoteDataSource.initClass()
