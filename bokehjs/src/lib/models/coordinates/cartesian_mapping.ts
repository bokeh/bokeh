import {CoordinateMapping} from "./coordinate_mapping"
import {compose_scale} from "../scales/util"
import {CoordinateTransform} from "./coordinate_transform"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {CategoricalScale} from "../scales/categorical_scale"
import type {CoordinateFrame} from "./coordinate_mapping"
import type * as p from "core/properties"

export namespace CartesianMapping {
  export type Attrs = p.AttrsOf<Props>
  export type Props = CoordinateMapping.Props & {
    x_range: p.Property<Range>
    y_range: p.Property<Range>
    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>
  }
}

export interface CartesianMapping extends CartesianMapping.Attrs {}

export class CartesianMapping extends CoordinateMapping {
  declare properties: CartesianMapping.Props

  override initialize(): void {
    super.initialize()
    if (!this.properties.x_scale.dirty && this.x_range instanceof FactorRange) {
      this.x_scale = CategoricalScale.create()
    }
    if (!this.properties.y_scale.dirty && this.y_range instanceof FactorRange) {
      this.y_scale = CategoricalScale.create()
    }
  }

  override get ranges(): readonly [Range, Range] {
    return [this.x_range, this.y_range]
  }

  override get_transform(frame: CoordinateFrame): CoordinateTransform {
    if (frame.x_scale.source_range == this.x_range && frame.y_scale.source_range == this.y_range) {
      return new CoordinateTransform(frame.x_scale, frame.y_scale)
    }
    return new CoordinateTransform(
      compose_scale(this.x_scale, this.x_range, frame.x_scale.source_range, frame.x_scale),
      compose_scale(this.y_scale, this.y_range, frame.y_scale.source_range, frame.y_scale),
    )
  }

  static {
    this.define<CartesianMapping.Props>(({Ref}) => ({
      x_range: [Ref(Range), () => DataRange1d.create()],
      y_range: [Ref(Range), () => DataRange1d.create()],
      x_scale: [Ref(Scale), () => LinearScale.create()],
      y_scale: [Ref(Scale), () => LinearScale.create()],
    }))
  }
}
