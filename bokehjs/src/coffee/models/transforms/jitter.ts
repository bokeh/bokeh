/* XXX: partial */
import {Transform} from "./transform";
import {Range} from "../ranges/range"
import {FactorRange} from "../ranges/factor_range"
import {Distribution} from "core/enums"
import * as p from "core/properties";
import * as bokeh_math from "core/util/math"

export namespace Jitter {
  export interface Attrs extends Transform.Attrs {
    mean: number
    width: number
    distribution: Distribution
    range: Range
  }
}

export interface Jitter extends Jitter.Attrs {}

export class Jitter extends Transform {

  constructor(attrs?: Partial<Jitter.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Jitter"

    this.define({
      mean:         [ p.Number      , 0        ],
      width:        [ p.Number      , 1        ],
      distribution: [ p.Distribution, 'uniform'],
      range:        [ p.Instance               ],
    });
  }

  compute(x, use_synthetic = true) {
    if (this.range instanceof FactorRange && use_synthetic) {
      x = this.range.synthetic(x);
    }
    if (this.distribution === 'uniform') {
      return(x + this.mean + ((bokeh_math.random() - 0.5) * this.width));
    }

    if (this.distribution === 'normal') {
      return(x + bokeh_math.rnorm(this.mean, this.width));
    }
  }
}
Jitter.initClass();
