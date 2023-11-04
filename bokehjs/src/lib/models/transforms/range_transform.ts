import {Transform} from "./transform"
import {Range} from "../ranges/range"
import type {Factor} from "../ranges/factor_range"
import {FactorRange} from "../ranges/factor_range"
import type * as p from "core/properties"
import type {Arrayable} from "core/types"
import {infer_type} from "core/types"
import {isNumber, isArrayableOf} from "core/util/types"
import {unreachable} from "core/util/assert"

export namespace RangeTransform {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Transform.Props & {
    range: p.Property<Range | null>
  }
}

export interface RangeTransform extends RangeTransform.Attrs {}

export abstract class RangeTransform extends Transform {
  declare properties: RangeTransform.Props

  constructor(attrs?: Partial<RangeTransform.Attrs>) {
    super(attrs)
  }

  static {
    this.define<RangeTransform.Props>(({Ref, Nullable}) => ({
      range: [ Nullable(Ref(Range)), null ],
    }))
  }

  v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
    let xs: Arrayable<number>
    if (this.range instanceof FactorRange) {
      xs = this.range.v_synthetic(xs0)
    } else if (isArrayableOf(xs0, isNumber)) {
      xs = xs0
    } else {
      unreachable()
    }

    const result = new (infer_type(xs))(xs.length)
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i]
      result[i] = this._compute(x)
    }
    return result
  }

  compute(x: number | Factor): number {
    if (this.range instanceof FactorRange) {
      return this._compute(this.range.synthetic(x))
    } else if (isNumber(x)) {
      return this._compute(x)
    } else {
      unreachable()
    }
  }

  protected abstract _compute(x: number): number
}
