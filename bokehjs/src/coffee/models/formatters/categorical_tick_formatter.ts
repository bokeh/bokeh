/* XXX: partial */
import {TickFormatter} from "./tick_formatter"

export namespace CategoricalTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {}

  export interface Opts extends TickFormatter.Opts {}
}

export interface CategoricalTickFormatter extends CategoricalTickFormatter.Attrs {}

export class CategoricalTickFormatter extends TickFormatter {

  constructor(attrs?: Partial<CategoricalTickFormatter.Attrs>, opts?: CategoricalTickFormatter.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'CategoricalTickFormatter';
  }

  doFormat(ticks, _axis) {
    return ticks;
  }
}
CategoricalTickFormatter.initClass();
