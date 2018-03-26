import {TickFormatter} from "./tick_formatter"
import {Axis} from "../axes/axis"
import * as p from "core/properties"
import {keys, values} from "core/util/object"
import {use_strict} from "core/util/string"

export namespace FuncTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    args: {[key: string]: any}
    code: string
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
      args: [ p.Any,     {} ], // TODO (bev) better type
      code: [ p.String,  '' ],
    })
  }

  get names(): string[] {
    return keys(this.args)
  }

  get values(): any[] {
    return values(this.args)
  }

  protected _make_func(): Function {
    return new Function("tick", "index", "ticks", ...this.names, "require", "exports", use_strict(this.code))
  }

  doFormat(ticks: number[], _axis: Axis): string[] {
    const cache = {}
    const func = this._make_func().bind(cache)
    return ticks.map((tick, index, ticks) => func(tick, index, ticks, ...this.values, require, {}))
  }
}
FuncTickFormatter.initClass()
