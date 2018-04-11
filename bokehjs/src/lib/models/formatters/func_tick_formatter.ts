import {TickFormatter} from "./tick_formatter"
import {Axis} from "../axes/axis"
import * as p from "core/properties"
import {keys, values} from "core/util/object"

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

  protected _make_func(): Function {
    return new Function("tick", "index", "ticks", ...keys(this.args), "require", this.code)
  }

  doFormat(ticks: number[], _axis: Axis): string[] {
    const cache = {}
    const func = this._make_func().bind(cache)
    return ticks.map((tick, index, ticks) => func(tick, index, ticks, ...values(this.args), require))
  }
}
FuncTickFormatter.initClass()
