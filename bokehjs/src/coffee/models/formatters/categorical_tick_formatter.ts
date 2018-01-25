/* XXX: partial */
import {TickFormatter} from "./tick_formatter"

export namespace CategoricalTickFormatter {
  export interface Attrs extends TickFormatter.Attrs {}
}

export interface CategoricalTickFormatter extends TickFormatter, CategoricalTickFormatter.Attrs {}

export class CategoricalTickFormatter extends TickFormatter {

  static initClass() {
    this.prototype.type = 'CategoricalTickFormatter';
  }

  doFormat(ticks, _axis) {
    return ticks;
  }
}
CategoricalTickFormatter.initClass();
