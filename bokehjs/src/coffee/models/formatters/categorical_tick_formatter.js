import {TickFormatter} from "./tick_formatter"
;

export class CategoricalTickFormatter extends TickFormatter {
  static initClass() {
    this.prototype.type = 'CategoricalTickFormatter';
  }

  doFormat(ticks, axis) {
    return ticks;
  }
}
CategoricalTickFormatter.initClass();
