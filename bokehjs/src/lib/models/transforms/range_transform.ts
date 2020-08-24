import {Transform} from "./transform"
import {Range} from "../ranges/range"
import {Factor, FactorRange} from "../ranges/factor_range"
import * as p from "core/properties"
import {Arrayable, NumberArray} from "core/types"
import {isNumber, isArrayableOf} from "core/util/types"

export namespace RangeTransform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props & {
    range: p.Property<Range>
  }
}

export interface RangeTransform extends RangeTransform.Attrs {}

export abstract class RangeTransform extends Transform {
  properties: RangeTransform.Props

  constructor(attrs?: Partial<RangeTransform.Attrs>) {
    super(attrs)
  }

  static init_RangeTransform(): void {
    this.define<RangeTransform.Props>({
      range: [ p.Instance ],
    })
  }

  v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
    let xs: Arrayable<number>
    if (this.range instanceof FactorRange)
      xs = this.range.v_synthetic(xs0)
    else if (isArrayableOf(xs0, isNumber))
      xs = xs0
    else
      throw new Error("unexpected")

    const result = new NumberArray(xs.length)
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

  protected abstract _compute(x: number): number

}
