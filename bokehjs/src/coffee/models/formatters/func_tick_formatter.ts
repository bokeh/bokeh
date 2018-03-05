/* XXX: partial */
import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties";
import {values} from "core/util/object"

export namespace FuncTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    args: {[key: string]: any}
    code: string
  }
}

export interface FuncTickFormatter extends FuncTickFormatter.Attrs {}

export class FuncTickFormatter extends TickFormatter {

  constructor(attrs?: Partial<FuncTickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'FuncTickFormatter';

    this.define({
      args: [ p.Any,     {} ], // TODO (bev) better type
      code: [ p.String,  '' ],
    });
  }

  _make_func() {
    return new Function("tick", "index", "ticks", ...Object.keys(this.args), "require", this.code);
  }

  doFormat(ticks, _axis) {
    const cache = {};
    const func = this._make_func().bind(cache);
    return ticks.map((tick, index, ticks) => func(tick, index, ticks, ...values(this.args), require));
  }
}
FuncTickFormatter.initClass();
