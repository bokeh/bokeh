import {TickFormatter} from "./tick_formatter"
import {Axis} from "../axes/axis"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace FuncTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    args: {[key: string]: any}
    code: string
    use_strict: boolean
  }

  export interface Props extends TickFormatter.Props {}
}

export interface FuncTickFormatter extends FuncTickFormatter.Attrs {}

export class FuncTickFormatter extends TickFormatter {

  properties: FuncTickFormatter.Props

  constructor(attrs?: Partial<FuncTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'FuncTickFormatter'

    this.define({
      args:       [ p.Any,     {}    ], // TODO (bev) better type
      code:       [ p.String,  ''    ],
      use_strict: [ p.Boolean, false ],
    })
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  protected _make_func(): Function {
    const code = this.use_strict ? use_strict(this.code) : this.code
    return new Function("tick", "index", "ticks", ...this.names, "require", "exports", code)
  }

  doFormat(ticks: number[], _axis: Axis): string[] {
    const cache = {}
    const func = this._make_func().bind(cache)
    return ticks.map((tick, index, ticks) => func(tick, index, ticks, ...this.values, require, {}))
  }
}
FuncTickFormatter.initClass()
