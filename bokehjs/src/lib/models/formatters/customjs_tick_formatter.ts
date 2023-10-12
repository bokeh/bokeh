import {TickFormatter} from "./tick_formatter"
import type * as p from "core/properties"
import {use_strict} from "core/util/string"

export namespace CustomJSTickFormatter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = TickFormatter.Props & {
    args: p.Property<Map<string, unknown>>
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
    this.define<CustomJSTickFormatter.Props>(({Unknown, String, Dict}) => ({
      args: [ Dict(Unknown), new Map() ],
      code: [ String, "" ],
    }))
  }

  get names(): Iterable<string> {
    return this.args.keys()
  }

  get values(): Iterable<unknown> {
    return this.args.values()
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
