/* XXX: partial */
import {Model} from "../../model"

export namespace TickFormatter {
  export interface Attrs extends Model.Attrs {}
}

export interface TickFormatter extends Model, TickFormatter.Attrs {}

export abstract class TickFormatter extends Model {

  static initClass() {
    this.prototype.type = 'TickFormatter';
  }

  abstract doFormat(ticks, axis)
}
TickFormatter.initClass();
