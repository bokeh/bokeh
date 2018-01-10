/* XXX: partial */
import {Model} from "../../model"

export class TickFormatter extends Model {
  static initClass() {
    this.prototype.type = 'TickFormatter';
  }

  doFormat(ticks, axis) {}
}
TickFormatter.initClass();
