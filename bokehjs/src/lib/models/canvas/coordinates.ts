import {Arrayable, ScreenArray, FloatArray} from "core/types"
import {Model} from "../../model"
import {Scale} from "../scales/scale"
import {CompositeScale} from "../scales/composite_scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {CategoricalScale} from "../scales/categorical_scale"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"
import * as p from "core/properties"
import {BBox} from "core/util/bbox"

export class CoordinateTransform {
  readonly x_source: Range
  readonly y_source: Range

  readonly ranges: readonly [Range, Range]
  readonly scales: readonly [Scale, Scale]

  constructor(readonly x_scale: Scale, readonly y_scale: Scale) {
    this.x_source = this.x_scale.source_range
    this.y_source = this.y_scale.source_range
    this.ranges = [this.x_source, this.y_source]
    this.scales = [this.x_scale, this.y_scale]
  }

  map_to_screen(xs: Arrayable<number>, ys: Arrayable<number>): [ScreenArray, ScreenArray] {
    const sxs = this.x_scale.v_compute(xs)
    const sys = this.y_scale.v_compute(ys)
    return [sxs, sys]
  }

  map_from_screen(sxs: Arrayable<number>, sys: Arrayable<number>): [FloatArray, FloatArray] {
    const xs = this.x_scale.v_invert(sxs)
    const ys = this.y_scale.v_invert(sys)
    return [xs, ys]
  }
}

export type CoordinateSystem = {
  readonly x_scale: Scale
  readonly y_scale: Scale
  update(bbox: BBox): void
}

export namespace CoordinateMapping {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    x_source: p.Property<Range>
    y_source: p.Property<Range>
    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>
    x_target: p.Property<Range | "auto">
    y_target: p.Property<Range | "auto">
  }
}

export interface CoordinateMapping extends CoordinateMapping.Attrs {}

export class CoordinateMapping extends Model {
  override properties: CoordinateMapping.Props

  constructor(attrs?: Partial<CoordinateMapping.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CoordinateMapping.Props>(({Ref, Or, Auto}) => ({
      x_source: [ Ref(Range), () => new DataRange1d() ],
      y_source: [ Ref(Range), () => new DataRange1d() ],
      x_scale: [ Ref(Scale), () => new LinearScale() ],
      y_scale: [ Ref(Scale), () => new LinearScale() ],
      x_target: [ Or(Auto, Ref(Range)), "auto" ],
      y_target: [ Or(Auto, Ref(Range)), "auto" ],
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

    if (scale instanceof LogScale && range instanceof DataRange1d)
      range.scale_hint = "log"

    const derived_scale = scale.clone()
    derived_scale.setv({source_range: range, target_range: target})
    return derived_scale
  }

  get_transform(target: CoordinateSystem): CoordinateTransform {
    const x_source = (() => {
      const {x_source, x_scale, x_target} = this
      return this._get_scale(x_source, x_scale, x_target == "auto" ? target.x_scale.source_range : x_target)
    })()

    const y_source = (() => {
      const {y_source, y_scale, y_target} = this
      return this._get_scale(y_source, y_scale, y_target == "auto" ? target.y_scale.source_range : y_target)
    })()

    const x_target = target.x_scale
    const y_target = target.y_scale

    const x_scale = new CompositeScale({
      source_scale: x_source, source_range: x_source.source_range,
      target_scale: x_target, target_range: y_target.target_range,
    })
    const y_scale = new CompositeScale({
      source_scale: y_source, source_range: y_source.source_range,
      target_scale: y_target, target_range: y_target.target_range,
    })

    return new CoordinateTransform(x_scale, y_scale)
  }
}
