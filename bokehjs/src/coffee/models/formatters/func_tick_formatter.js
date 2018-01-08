/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

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
    return new Function("tick", ...Array.from(Object.keys(this.args)), "require", this.code);
  }

  doFormat(ticks, axis) {
    const func = this._make_func();
    return (Array.from(ticks).map((tick) => func(tick, ...Array.from(values(this.args)), require)));
  }
}
FuncTickFormatter.initClass();
