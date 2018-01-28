/* XXX: partial */
import {sprintf} from "sprintf-js";

import {TickFormatter} from "./tick_formatter";
import * as p from "core/properties"

export namespace PrintfTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {
    format: string
  }

  export interface Opts extends TickFormatter.Opts {}
}

export interface PrintfTickFormatter extends PrintfTickFormatter.Attrs {}

export class PrintfTickFormatter extends TickFormatter {

  constructor(attrs?: Partial<PrintfTickFormatter.Attrs>, opts?: PrintfTickFormatter.Opts) {
    super(attrs, opts)
  }

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
