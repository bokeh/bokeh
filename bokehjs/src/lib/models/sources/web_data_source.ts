import {ColumnDataSource} from "./column_data_source"
import {UpdateMode} from "core/enums"
import {CallbackLike1} from "../callbacks/callback"
import {Data} from "core/types"
import * as p from "core/properties"
import {Arrayable} from "core/types"

export namespace WebDataSource {
  export type Attrs = p.AttrsOf<Props>

  export type Props = ColumnDataSource.Props & {
    max_size: p.Property<number | null>
    mode: p.Property<UpdateMode>
    adapter: p.Property<CallbackLike1<WebDataSource, {response: Data}, Data> | null>
    data_url: p.Property<string>
  }
}

export interface WebDataSource extends WebDataSource.Attrs {}

export abstract class WebDataSource extends ColumnDataSource {
  properties: WebDataSource.Props

  constructor(attrs?: Partial<WebDataSource.Attrs>) {
    super(attrs)
  }

  get_column(colname: string): Arrayable {
    const column = this.data[colname]
    return column != null ? column : []
  }

  get_length(): number {
    return super.get_length() ?? 0
  }

  // override this method to setup the connection to the web source
  abstract setup(): void

  initialize(): void {
    super.initialize()
    this.setup()
  }

  load_data(raw_data: any, mode: UpdateMode, max_size?: number): void {
    const {adapter} = this
    let data: Data
    if (adapter != null)
      data = adapter.execute(this, {response: raw_data})
    else
      data = raw_data

    switch (mode) {
      case "replace": {
        this.data = data
        break
      }
      case "append": {
        const original_data = this.data
        for (const column of this.columns()) {
          // XXX: support typed arrays
          const old_col = Array.from(original_data[column])
          const new_col = Array.from(data[column])
          const array = old_col.concat(new_col)
          data[column] = max_size != null ? array.slice(-max_size) : array
        }
        this.data = data
        break
      }
    }
  }

  static init_WebDataSource(): void {
    this.define<WebDataSource.Props>(({Any, Int, String, Nullable}) => ({
      max_size: [ Nullable(Int), null ],
      mode:     [ UpdateMode, "replace" ],
      adapter:  [ Nullable(Any /*TODO*/), null ],
      data_url: [ String ],
    }))
  }
}
