import {ColumnDataSource} from "./column_data_source"
import {UpdateMode} from "core/enums"
import type {CallbackLike1} from "core/util/callbacks"
import {execute} from "core/util/callbacks"
import type {Data} from "core/types"
import type * as p from "core/properties"
import type {Arrayable} from "core/types"
import {assert} from "core/util/assert"

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
  declare properties: WebDataSource.Props

  constructor(attrs?: Partial<WebDataSource.Attrs>) {
    super(attrs)
  }

  override get_column(name: string): Arrayable {
    return super.get_column(name) ?? []
  }

  override get_length(): number {
    return super.get_length() ?? 0
  }

  // override this method to setup the connection to the web source
  abstract override setup(): void

  override initialize(): void {
    super.initialize()
    this.setup()
  }

  async load_data(raw_data: any, mode: UpdateMode, max_size?: number): Promise<void> {
    const {adapter} = this
    let data: Data
    if (adapter != null) {
      data = await execute(adapter, this, {response: raw_data})
    } else {
      data = raw_data
    }

    switch (mode) {
      case "replace": {
        this.data = data
        break
      }
      case "append": {
        for (const [name, column] of this.data) {
          // XXX: support typed arrays
          const old_col = Array.from(column)
          const new_column = data.get(name)
          assert(new_column != null)
          const new_col = Array.from(new_column)
          const array = old_col.concat(new_col)
          const trimmed_array = max_size != null ? array.slice(-max_size) : array
          data.set(name, trimmed_array)
        }
        this.data = data
        break
      }
    }
  }

  static {
    this.define<WebDataSource.Props>(({Any, Int, String, Nullable}) => ({
      max_size: [ Nullable(Int), null ],
      mode:     [ UpdateMode, "replace" ],
      adapter:  [ Nullable(Any /*TODO*/), null ],
      data_url: [ String ],
    }))
  }
}
