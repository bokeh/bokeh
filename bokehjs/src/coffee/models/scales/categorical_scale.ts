import {LinearScale} from "./linear_scale"
import {FactorRange} from "../ranges/factor_range"

export class CategoricalScale extends LinearScale {

  source_range: FactorRange

  compute(x: any): number {
    return super.compute(this.source_range.synthetic(x))
  }

  v_compute(xs: any[]): Float64Array {
    return super.v_compute(this.source_range.v_synthetic(xs))
  }
}

CategoricalScale.prototype.type = "CategoricalScale"
