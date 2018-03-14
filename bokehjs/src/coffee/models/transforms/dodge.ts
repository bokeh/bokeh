import {Transform} from "./transform"
import {Range} from "../ranges/range"
import {Factor, FactorRange} from "../ranges/factor_range"
import * as p from "core/properties"
import {Arrayable} from "core/types"
import {isNumber, isArrayableOf} from "core/util/types"

export namespace Dodge {
  export interface Attrs extends Transform.Attrs {
    value: number
    range: Range
  }

  export interface Props extends Transform.Props {}
}

export interface Dodge extends Dodge.Attrs {}

export class Dodge extends Transform {

  properties: Dodge.Props

  constructor(attrs?: Partial<Dodge.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "Dodge"

    this.define({
      value: [ p.Number,  0 ],
      range: [ p.Instance   ],
    })
  }

  // XXX: this is repeated in ./jitter.ts
  v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
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
    return x + this.value
  }
}
Dodge.initClass()
