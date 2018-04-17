import {LinearScale} from "./linear_scale"
import {FactorRange} from "../ranges/factor_range"
import {Arrayable} from "core/types"

export namespace CategoricalScale {
  export interface Attrs extends LinearScale.Attrs {}

  export interface Props extends LinearScale.Props {}
}

export interface CategoricalScale extends CategoricalScale.Attrs {}

export class CategoricalScale extends LinearScale {

  properties: CategoricalScale.Props

  constructor(attrs?: Partial<CategoricalScale.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "CategoricalScale"
  }

  source_range: FactorRange

  compute(x: any): number {
    return super.compute(this.source_range.synthetic(x))
  }

  v_compute(xs: Arrayable<any>): Arrayable<number> {
    return super.v_compute(this.source_range.v_synthetic(xs))
  }
}

CategoricalScale.initClass()
