import {Scale} from "./scale"
import {LinearScale} from "./linear_scale"
import {FactorRange} from "../ranges/factor_range"
import {Arrayable} from "core/types"
import * as p from "core/properties"

export namespace CategoricalScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props
}

export interface CategoricalScale extends CategoricalScale.Attrs {}

export class CategoricalScale extends Scale {
  properties: CategoricalScale.Props

  constructor(attrs?: Partial<CategoricalScale.Attrs>) {
    super(attrs)
  }

  source_range: FactorRange

  private _inner_scale: LinearScale = new LinearScale()

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.change, () => {
      this._inner_scale.setv({
        source_range: this.source_range,
        target_range: this.target_range,
      })
    })
  }

  compute(x: any): number {
    return this._inner_scale.compute(this.source_range.synthetic(x))
  }

  v_compute(xs: Arrayable<any>): Arrayable<number> {
    return this._inner_scale.v_compute(this.source_range.v_synthetic(xs))
  }

  invert(x: any): number {
    return this._inner_scale.invert(x)
  }

  v_invert(xs: Arrayable<any>): Arrayable<number> {
    return this._inner_scale.v_invert(xs)
  }
}
