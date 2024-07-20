import {Comparison} from "./comparison"
import type * as p from "core/properties"
import type {Dict} from "core/types"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace CustomJSCompare {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Comparison.Props & {
    args: p.Property<Dict<unknown>>
    code: p.Property<string>
  }
}

export interface CustomJSCompare extends CustomJSCompare.Attrs {}

export class CustomJSCompare extends Comparison {
  declare properties: CustomJSCompare.Props

  constructor(attrs?: Partial<CustomJSCompare.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJSCompare.Props>(({Unknown, Str, Dict}) => ({
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

  private _make_func(): Function {
    const code = use_strict(this.code)
    return new Function("x", "y", ...this.names, code)
  }

  compute(x: unknown, y: unknown): 0 | 1 | -1 {
    const func = this._make_func()
    return func(x, y, this.values)
  }
}
