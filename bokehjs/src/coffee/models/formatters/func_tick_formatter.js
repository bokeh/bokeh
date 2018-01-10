import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties";
import {values} from "core/util/object"
;

export class FuncTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'FuncTickFormatter';

    this.define({
      args: [ p.Any,     {}           ], // TODO (bev) better type
      code: [ p.String,  ''           ]
    });
  }

  _make_func() {
    return new Function("tick", ...Object.keys(this.args), "require", this.code);
  }

  doFormat(ticks, axis) {
    const func = this._make_func();
    return (ticks.map((tick) => func(tick, ...values(this.args), require)));
  }
}
FuncTickFormatter.initClass();
