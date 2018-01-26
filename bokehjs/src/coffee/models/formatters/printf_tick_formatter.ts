/* XXX: partial */
import {sprintf} from "sprintf-js";

import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties"

export namespace PrintfTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    format: string
  }
}

export interface PrintfTickFormatter extends PrintfTickFormatter.Attrs {}

export class PrintfTickFormatter extends TickFormatter {

  static initClass() {
    this.prototype.type = 'PrintfTickFormatter';

    this.define({
      format: [ p.String, '%s' ],
    });
  }

  doFormat(ticks, _axis) {
    const { format } = this;
    const labels = (ticks.map((tick) => sprintf(format, tick)));
    return labels;
  }
}
PrintfTickFormatter.initClass();
