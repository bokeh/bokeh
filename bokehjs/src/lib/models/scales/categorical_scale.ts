import {Scale} from "./scale"
import {LinearScale} from "./linear_scale"
import type {FactorRange, FactorLike} from "../ranges/factor_range"
import type * as p from "core/properties"

const {_linear_compute_state} = LinearScale.prototype

export namespace CategoricalScale {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Scale.Props
}

export interface CategoricalScale extends CategoricalScale.Attrs {}

export class CategoricalScale extends Scale<FactorLike> {
  declare properties: CategoricalScale.Props

  constructor(attrs?: Partial<CategoricalScale.Attrs>) {
    super(attrs)
  }

  override source_range: FactorRange

  get s_compute(): (x: FactorLike) => number {
    const [factor, offset] = _linear_compute_state.call(this)
    const range = this.source_range
    return (x) => factor*range.synthetic(x) + offset
  }

  get s_invert(): (sx: number) => number {
    const [factor, offset] = _linear_compute_state.call(this)
    return (sx) => (sx - offset) / factor
  }
}
