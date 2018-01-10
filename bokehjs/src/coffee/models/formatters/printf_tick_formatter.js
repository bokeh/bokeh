import {sprintf} from "sprintf-js";

import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties"

export class PrintfTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'PrintfTickFormatter';

    this.define({
      format: [ p.String, '%s' ]
    });
  }

  doFormat(ticks, axis) {
    const { format } = this;
    const labels = ( ticks.map((tick) => sprintf(format, tick)) );
    return labels;
  }
}
PrintfTickFormatter.initClass();
