import {CoordinateTransform} from "./coordinate_transform"
export {CoordinateTransform}
import {Model} from "../../model"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {CategoricalScale} from "../scales/categorical_scale"
import {CompositeScale} from "../scales/composite_scale"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"
import type {CartesianFrameView} from "../canvas/cartesian_frame"
import type * as p from "core/properties"

export namespace CoordinateMapping {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    x_source: p.Property<Range>
    y_source: p.Property<Range>
    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>
    x_target: p.Property<Range>
    y_target: p.Property<Range>
  }
}

export interface CoordinateMapping extends CoordinateMapping.Attrs {}

export class CoordinateMapping extends Model {
  declare properties: CoordinateMapping.Props

  static {
    this.define<CoordinateMapping.Props>(({Ref}) => ({
      x_source: [ Ref(Range), () => DataRange1d.create() ],
      y_source: [ Ref(Range), () => DataRange1d.create() ],
      x_scale: [ Ref(Scale), () => LinearScale.create() ],
      y_scale: [ Ref(Scale), () => LinearScale.create() ],
      x_target: [ Ref(Range) ],
      y_target: [ Ref(Range) ],
    }))
  }

  get x_ranges(): Map<string, Range> {
    return new Map([["default", this.x_source]])
  }

  get y_ranges(): Map<string, Range> {
    return new Map([["default", this.y_source]])
  }

  private _get_scale(range: Range, scale: Scale, target: Range): Scale {
    const factor_range = range instanceof FactorRange
    const categorical_scale = scale instanceof CategoricalScale

    if (factor_range != categorical_scale) {
      throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
    }

    if (scale instanceof LogScale && range instanceof DataRange1d) {
      range.scale_hint = "log"
    }

    const derived_scale = scale.clone()
    derived_scale.setv({source_range: range, target_range: target})
    return derived_scale
  }

  get_transform(frame: CartesianFrameView): CoordinateTransform {
    const {x_source, x_scale, x_target} = this
    const x_source_scale = this._get_scale(x_source, x_scale, x_target)

    const {y_source, y_scale, y_target} = this
    const y_source_scale = this._get_scale(y_source, y_scale, y_target)

    const xscale = CompositeScale.create({
      source_scale: x_source_scale, source_range: x_source_scale.source_range,
      target_scale: frame.x_scale, target_range: frame.x_target,
    })
    const yscale = CompositeScale.create({
      source_scale: y_source_scale, source_range: y_source_scale.source_range,
      target_scale: frame.y_scale, target_range: frame.y_target,
    })

    return new CoordinateTransform(xscale, yscale)
  }
}
