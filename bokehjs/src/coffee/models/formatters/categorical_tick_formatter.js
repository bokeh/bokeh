/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

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
