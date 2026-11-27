import type {Arrayable, ScreenArray, FloatArray} from "core/types"
import type {Scale} from "../scales/scale"
import type {Range} from "../ranges/range"

export class CoordinateTransform {
  readonly x_scale: Scale
  readonly y_scale: Scale

  readonly x_source: Range
  readonly y_source: Range

  readonly ranges: readonly [Range, Range]
  readonly scales: readonly [Scale, Scale]

  constructor(x_scale: Scale, y_scale: Scale) {
    this.x_scale = x_scale
    this.y_scale = y_scale
    this.x_source = this.x_scale.source_range
    this.y_source = this.y_scale.source_range
    this.ranges = [this.x_source, this.y_source]
    this.scales = [this.x_scale, this.y_scale]
  }

  compute(x: number, y: number): [number, number] {
    return [this.x_scale.compute(x), this.y_scale.compute(y)]
  }

  invert(sx: number, sy: number): [number, number] {
    return [this.x_scale.invert(sx), this.y_scale.invert(sy)]
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
