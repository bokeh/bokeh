import {LinearScale} from "./linear_scale"
import {FactorRange} from "../ranges/factor_range"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace CategoricalScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LinearScale.Props
}

export interface CategoricalScale extends CategoricalScale.Attrs {}

export class CategoricalScale extends LinearScale {
  properties: CategoricalScale.Props

  constructor(attrs?: Partial<CategoricalScale.Attrs>) {
    super(attrs)
  }

  source_range: FactorRange

  compute(x: any): number {
    return super.compute(this.source_range.synthetic(x))
  }

  v_compute(xs: Arrayable<any>): Arrayable<number> {
    return super.v_compute(this.source_range.v_synthetic(xs))
  }
}
