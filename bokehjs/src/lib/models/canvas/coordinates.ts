import {Arrayable, ScreenArray, FloatArray} from "core/types"
import {map} from "core/util/arrayable"
import {Model} from "../../model"
import {Scale} from "../scales/scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {CategoricalScale} from "../scales/categorical_scale"
import {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"
import {CartesianFrame} from "./cartesian_frame"
import * as p from "core/properties"

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
  override properties: CoordinateMapping.Props

  constructor(attrs?: Partial<CoordinateMapping.Attrs>) {
    super(attrs)
  }

  static {
    this.define<CoordinateMapping.Props>(({Ref}) => ({
      x_source: [ Ref(Range), () => new DataRange1d() ],
      y_source: [ Ref(Range), () => new DataRange1d() ],
      x_scale: [ Ref(Scale), () => new LinearScale() ],
      y_scale: [ Ref(Scale), () => new LinearScale() ],
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

    if (scale instanceof LogScale && range instanceof DataRange1d)
      range.scale_hint = "log"

    const derived_scale = scale.clone()
    derived_scale.setv({source_range: range, target_range: target})
    return derived_scale
  }

  get_transform(frame: CartesianFrame): CoordinateTransform {
    const {x_source, x_scale, x_target} = this
    const x_source_scale = this._get_scale(x_source, x_scale, x_target)

    const {y_source, y_scale, y_target} = this
    const y_source_scale = this._get_scale(y_source, y_scale, y_target)

    const xscale = new CompositeScale({
      source_scale: x_source_scale, source_range: x_source_scale.source_range,
      target_scale: frame.x_scale, target_range: frame.x_target,
    })
    const yscale = new CompositeScale({
      source_scale: y_source_scale, source_range: y_source_scale.source_range,
      target_scale: frame.y_scale, target_range: frame.y_target,
    })

    return new CoordinateTransform(xscale, yscale)
  }
}

export namespace CompositeScale {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Scale.Props & {
    source_scale: p.Property<Scale>
    target_scale: p.Property<Scale>
  }
}

export interface CompositeScale extends CompositeScale.Attrs {}

export class CompositeScale extends Scale {
  override properties: CompositeScale.Props

  constructor(attrs?: Partial<CompositeScale.Attrs>) {
    super(attrs)
  }

  static {
    this.internal<CompositeScale.Props>(({Ref}) => ({
      source_scale: [ Ref(Scale) ],
      target_scale: [ Ref(Scale) ],
    }))
  }

  get s_compute(): (x: number) => number {
    const source_compute = this.source_scale.s_compute
    const target_compute = this.target_scale.s_compute
    return (x) => target_compute(source_compute(x))
  }

  get s_invert(): (sx: number) => number {
    const source_invert = this.source_scale.s_invert
    const target_invert = this.target_scale.s_invert
    return (sx) => source_invert(target_invert(sx))
  }

  override compute(x: number): number {
    return this.s_compute(x)
  }

  override v_compute(xs: Arrayable<number>): ScreenArray {
    const {s_compute} = this
    return map(xs, s_compute) as ScreenArray // XXX
  }

  override invert(sx: number): number {
    return this.s_invert(sx)
  }

  override v_invert(sxs: Arrayable<number>): FloatArray {
    const {s_invert} = this
    return map(sxs, s_invert) as FloatArray // XXX
  }
}
