import {Transform} from "./transform"
import {Range} from "../ranges/range"
import {Factor, FactorRange} from "../ranges/factor_range"
import {Distribution} from "core/enums"
import {Arrayable} from "core/types"
import {isNumber, isArrayableOf} from "core/util/types"
import * as p from "core/properties"
import * as bokeh_math from "core/util/math"

export namespace Jitter {
  export interface Attrs extends Transform.Attrs {
    mean: number
    width: number
    distribution: Distribution
    range: Range
    previous_values: Arrayable<number>
  }

  export interface Props extends Transform.Props {}
}

export interface Jitter extends Jitter.Attrs {}

export class Jitter extends Transform {

  properties: Jitter.Props

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
    })

    this.internal({
      previous_values: [ p.Array ],
    })
  }

  v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
    if (this.previous_values != null && this.previous_values.length == xs0.length)
      return this.previous_values

    let xs: Arrayable<number>
    if (this.range instanceof FactorRange)
      xs = this.range.v_synthetic(xs0)
    else if (isArrayableOf(xs0, isNumber))
      xs = xs0
    else
      throw new Error("unexpected")

    const result = new Float64Array(xs.length)
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]
      result[i] = this._compute(x)
    }
    this.previous_values = result
    return result
  }

  compute(x: number | Factor): number {
    if (this.range instanceof FactorRange)
      return this._compute(this.range.synthetic(x))
    else if (isNumber(x))
      return this._compute(x)
    else
      throw new Error("unexpected")
  }

  protected _compute(x: number): number {
    switch (this.distribution) {
      case "uniform":
        return x + this.mean + (bokeh_math.random() - 0.5)*this.width
      case "normal":
        return x + bokeh_math.rnorm(this.mean, this.width)
    }
  }
}
Jitter.initClass()
