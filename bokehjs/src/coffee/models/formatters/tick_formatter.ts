/* XXX: partial */
import {Model} from "../../model"

export namespace TickFormatter {
  export interface Attrs extends Model.Attrs {}

  export interface Opts extends Model.Opts {}
}

export interface TickFormatter extends TickFormatter.Attrs {}

export abstract class TickFormatter extends Model {

  constructor(attrs?: Partial<TickFormatter.Attrs>, opts?: TickFormatter.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = 'TickFormatter';
  }

  abstract doFormat(ticks, axis)
}
TickFormatter.initClass();
