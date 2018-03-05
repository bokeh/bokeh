/* XXX: partial */
import {Model} from "../../model"

export namespace TickFormatter {
  export interface Attrs extends Model.Attrs {}
}

export interface TickFormatter extends TickFormatter.Attrs {}

export abstract class TickFormatter extends Model {

  constructor(attrs?: Partial<TickFormatter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'TickFormatter';
  }

  abstract doFormat(ticks, axis)
}
TickFormatter.initClass();
