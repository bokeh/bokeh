/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

import {Model} from "../../model"
;

export class TickFormatter extends Model {
  static initClass() {
    this.prototype.type = 'TickFormatter';
  }

  doFormat(ticks, axis) {}
}
TickFormatter.initClass();
