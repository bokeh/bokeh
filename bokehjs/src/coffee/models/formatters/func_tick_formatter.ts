/* XXX: partial */
import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties";
import {values} from "core/util/object"

export namespace FuncTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    args: {[key: string]: any}
    code: string
  }

  export interface Opts extends TickFormatter.Opts {}
}

export interface FuncTickFormatter extends FuncTickFormatter.Attrs {}

export class FuncTickFormatter extends TickFormatter {

  constructor(attrs?: Partial<FuncTickFormatter.Attrs>, opts?: FuncTickFormatter.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'FuncTickFormatter';

    this.define({
      args: [ p.Any,     {} ], // TODO (bev) better type
      code: [ p.String,  '' ],
    });
  }

  _make_func() {
    return new Function("tick", ...Object.keys(this.args), "require", this.code);
  }

  doFormat(ticks, _axis) {
    const func = this._make_func();
    return (ticks.map((tick) => func(tick, ...values(this.args), require)));
  }
}
FuncTickFormatter.initClass();
