import {TickFormatter} from "./tick_formatter"
import type * as p from "core/properties"
import type {Dict} from "core/types"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace CustomJSTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    args: p.Property<Dict<unknown>>
    code: p.Property<string>
  }
}

export interface CustomJSTickFormatter extends CustomJSTickFormatter.Attrs {}

export class CustomJSTickFormatter extends TickFormatter {
  declare properties: CustomJSTickFormatter.Props

  constructor(attrs?: Partial<CustomJSTickFormatter.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CustomJSTickFormatter.Props>(({Unknown, Str, Dict}) => ({
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

  /*protected*/ _make_func(): Function {
    const code = use_strict(this.code)
    return new Function("tick", "index", "ticks", ...this.names, code)
  }

  doFormat(ticks: number[], _opts: {loc: number}): string[] {
    const cache = {}
    const func = this._make_func().bind(cache)
    return ticks.map((tick, index, ticks) => `${func(tick, index, ticks, ...this.values)}`)
  }
}
