/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {sprintf} from "sprintf-js";

import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties"
;

export class PrintfTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'PrintfTickFormatter';

    this.define({
      format: [ p.String, '%s' ]
    });
  }

  doFormat(ticks, axis) {
    const { format } = this;
    const labels = ( Array.from(ticks).map((tick) => sprintf(format, tick)) );
    return labels;
  }
}
PrintfTickFormatter.initClass();
