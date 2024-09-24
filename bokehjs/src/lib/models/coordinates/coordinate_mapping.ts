import type {Arrayable, ScreenArray, FloatArray} from "core/types"
import {Model} from "../../model"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {CategoricalScale} from "../scales/categorical_scale"
import {CompositeScale} from "../scales/composite_scale"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"
import {assert} from "core/util/assert"
import type {Auto} from "core/enums"
import type * as p from "core/properties"

export type CoordinateSource = {
  x_scale: Scale
  y_scale: Scale
}

export class CoordinateTransform {
  readonly x_source: Range
  readonly y_source: Range

  readonly x_scale: Scale
  readonly y_scale: Scale

  readonly x_target: Range
  readonly y_target: Range

  readonly ranges: readonly [Range, Range]
  readonly scales: readonly [Scale, Scale]

  readonly x_ranges: Map<string, Range>
  readonly y_ranges: Map<string, Range>

  constructor(x_scale: Scale, y_scale: Scale) {
    this.x_scale = x_scale
    this.y_scale = y_scale
    this.x_source = this.x_scale.source_range
    this.y_source = this.y_scale.source_range
    this.x_target = this.x_scale.target_range
    this.y_target = this.y_scale.target_range
    this.ranges = [this.x_source, this.y_source]
    this.scales = [this.x_scale, this.y_scale]
    this.x_ranges = new Map([["default", this.x_source]])
    this.y_ranges = new Map([["default", this.y_source]])
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

  compose(onto: CoordinateSource): CoordinateTransform {
    const x_scale = new CompositeScale({
      source_scale: this.x_scale, source_range: this.x_scale.source_range,
      target_scale: onto.x_scale, target_range: onto.x_scale.target_range,
    })
    const y_scale = new CompositeScale({
      source_scale: this.y_scale, source_range: this.y_scale.source_range,
      target_scale: onto.y_scale, target_range: onto.y_scale.target_range,
    })
    return new CoordinateTransform(x_scale, y_scale)
  }
}

export namespace CoordinateMapping {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Model.Props & {
    x_source: p.Property<Range>
    y_source: p.Property<Range>
    x_scale: p.Property<Scale>
    y_scale: p.Property<Scale>
    x_target: p.Property<Range | Auto>
    y_target: p.Property<Range | Auto>
    target: p.Property</*CoordinateSource |*/ "frame" | null>
  }
}

export interface CoordinateMapping extends CoordinateMapping.Attrs {}

export class CoordinateMapping extends Model {
  declare properties: CoordinateMapping.Props

  constructor(attrs?: Partial<CoordinateMapping.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CoordinateMapping.Props>(({Auto, Enum, Ref, Or, Nullable}) => ({
      x_source: [ Ref(Range), () => new DataRange1d() ],
      y_source: [ Ref(Range), () => new DataRange1d() ],
      x_scale: [ Ref(Scale), () => new LinearScale() ],
      y_scale: [ Ref(Scale), () => new LinearScale() ],
      x_target: [ Or(Ref(Range), Auto), "auto" ],
      y_target: [ Or(Ref(Range), Auto), "auto" ],
      target: [ Nullable(Enum("frame")), "frame" ],
    }))
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

  get_transform(target?: CoordinateSource): CoordinateTransform {
    const {x_source, y_source} = this
    const {x_scale: in_x_scale, y_scale: in_y_scale} = this
    let {x_target, y_target} = this

    if (x_target == "auto") {
      assert(target != null)
      x_target = target.x_scale.target_range
    }
    if (y_target == "auto") {
      assert(target != null)
      y_target = target.y_scale.target_range
    }

    const x_scale = this._get_scale(x_source, in_x_scale, x_target)
    const y_scale = this._get_scale(y_source, in_y_scale, y_target)

    const transform = new CoordinateTransform(x_scale, y_scale)
    return target != null ? transform.compose(target) : transform
  }
}
