import {LinearScale} from "./linear_scale"
import {FactorRange} from "../ranges/factor_range"

export namespace CategoricalScale {
  export interface Attrs extends LinearScale.Attrs {}
}

export interface CategoricalScale extends CategoricalScale.Attrs {}

export class CategoricalScale extends LinearScale {

  static initClass() {
    this.prototype.type = "CategoricalScale"
  }

  source_range: FactorRange

  compute(x: any): number {
    return super.compute(this.source_range.synthetic(x))
  }

  v_compute(xs: any[]): Float64Array {
    return super.v_compute(this.source_range.v_synthetic(xs))
  }
}

CategoricalScale.initClass()
