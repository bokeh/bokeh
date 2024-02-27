import {Filter} from "./filter"
import type * as p from "core/properties"
import type {Dict} from "core/types"
import {Indices} from "core/types"
import {keys, values} from "core/util/object"
import {isArrayOf, isBoolean, isInteger} from "core/util/types"
import type {ColumnarDataSource} from "../sources/columnar_data_source"
import {use_strict} from "core/util/string"

export namespace CustomJSFilter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Filter.Props & {
    args: p.Property<Dict<unknown>>
    code: p.Property<string>
  }
}

export interface CustomJSFilter extends CustomJSFilter.Attrs {}

export class CustomJSFilter extends Filter {
  declare properties: CustomJSFilter.Props

  constructor(attrs?: Partial<CustomJSFilter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJSFilter.Props>(({Unknown, Str, Dict}) => ({
      args: [ Dict(Unknown), {} ],
      code: [ Str, "" ],
    }))
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): unknown[] {
    return values(this.args)
  }

  get func(): Function {
    const code = use_strict(this.code)
    return new Function(...this.names, "source", code)
  }

  compute_indices(source: ColumnarDataSource): Indices {
    const size = source.get_length() ?? 1
    const filter = this.func(...this.values, source)
    if (filter == null) {
      return Indices.all_set(size)
    } else if (isArrayOf(filter, isInteger)) {
      return Indices.from_indices(size, filter)
    } else if (isArrayOf(filter, isBoolean)) {
      return Indices.from_booleans(size, filter)
    } else {
      throw new Error(`expect an array of integers or booleans, or null, got ${filter}`)
    }
  }
}
