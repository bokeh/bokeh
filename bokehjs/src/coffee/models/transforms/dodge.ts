/* XXX: partial */
import {Transform} from "./transform";
import {Range} from "../ranges/range"
import * as p from "core/properties"

export namespace Dodge {
  export interface Attrs extends Transform.Attrs {
    value: number
    range: Range
  }

  export interface Opts extends Transform.Opts {}
}

export interface Dodge extends Dodge.Attrs {}

export class Dodge extends Transform {

  constructor(attrs?: Partial<Dodge.Attrs>, opts?: Dodge.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "Dodge"

    this.define({
      value: [ p.Number,  0 ],
      range: [ p.Instance   ],
    });
  }

  compute(x, use_synthetic = true) {
    if (((this.range != null ? this.range.synthetic : undefined) != null) && use_synthetic) {
      x = this.range.synthetic(x);
    }
    return x + this.value;
  }
}
Dodge.initClass();
