import {WebDataSource} from "./web_data_source"
import * as p from "core/properties"
import {Arrayable} from "core/types"

export namespace RemoteDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = WebDataSource.Props & {
    polling_interval: p.Property<number>
  }
}

export interface RemoteDataSource extends RemoteDataSource.Attrs {}

export abstract class RemoteDataSource extends WebDataSource {
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
    this.define<RemoteDataSource.Props>({
      polling_interval: [ p.Number ],
    })
  }
}
RemoteDataSource.initClass()
