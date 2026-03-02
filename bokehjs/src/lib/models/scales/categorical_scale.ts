import {Scale} from "./scale"
import {LinearScale} from "./linear_scale"
import type {FactorRange, FactorLike} from "../ranges/factor_range"
import type * as p from "core/properties"

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

  declare source_range: FactorRange

  get s_compute(): (x: FactorLike) => number {
    const {source_range: source, target_range: target} = this
    const [factor, offset] = LinearScale.linear_compute(source.start, source.end, target.start, target.end)
    const range = this.source_range
    return (x) => factor*range.synthetic(x) + offset
  }

  get s_invert(): (sx: number) => number {
    const {source_range: source, target_range: target} = this
    const [factor, offset] = LinearScale.linear_compute(source.start, source.end, target.start, target.end)
    return (sx) => (sx - offset) / factor
  }
}
