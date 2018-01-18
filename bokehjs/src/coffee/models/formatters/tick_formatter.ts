/* XXX: partial */
import {Model} from "../../model"

export abstract class TickFormatter extends Model {
  static initClass() {
    this.prototype.type = 'TickFormatter';
  }

  abstract doFormat(ticks, axis)
}
TickFormatter.initClass();
