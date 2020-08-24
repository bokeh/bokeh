import {RangeTransform} from "./range_transform"
import {Factor} from "../ranges/factor_range"
import {Distribution} from "core/enums"
import {Arrayable} from "core/types"
import * as p from "core/properties"
import * as bokeh_math from "core/util/math"

export namespace Jitter {
  export type Attrs = p.AttrsOf<Props>

  export type Props = RangeTransform.Props & {
    mean: p.Property<number>
    width: p.Property<number>
    distribution: p.Property<Distribution>
  }
}

export interface Jitter extends Jitter.Attrs {}

export class Jitter extends RangeTransform {
  properties: Jitter.Props

  previous_values: Arrayable<number>

  constructor(attrs?: Partial<Jitter.Attrs>) {
    super(attrs)
  }

  static init_Jitter(): void {
    this.define<Jitter.Props>({
      mean:         [ p.Number, 0        ],
      width:        [ p.Number, 1        ],
      distribution: [ p.Distribution, 'uniform'],
    })
  }

  v_compute(xs0: Arrayable<number | Factor>): Arrayable<number> {
    if (this.previous_values != null && this.previous_values.length == xs0.length)
      return this.previous_values
    this.previous_values = super.v_compute(xs0)
    return this.previous_values
  }

  protected _compute(x: number): number {
    switch (this.distribution) {
      case "uniform":
        return x + this.mean + (bokeh_math.random() - 0.5)*this.width
      case "normal":
        return x + bokeh_math.rnorm(this.mean, this.width)
    }
  }
}
