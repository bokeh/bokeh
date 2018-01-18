/* XXX: partial */
import {TickFormatter} from "./tick_formatter"

export class CategoricalTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'CategoricalTickFormatter';
  }

  doFormat(ticks, _axis) {
    return ticks;
  }
}
CategoricalTickFormatter.initClass();
