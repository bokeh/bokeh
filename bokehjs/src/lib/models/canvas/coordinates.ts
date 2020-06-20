import {Arrayable, NumberArray} from "core/types"
import {Scale} from "../scales/scale"
import {Range} from "../ranges/range"

export class CoordinateTransform {
  readonly x_scale: Scale
  readonly y_scale: Scale

  readonly x_range: Range
  readonly y_range: Range

  readonly ranges: readonly [Range, Range]
  readonly scales: readonly [Scale, Scale]

  constructor(x_scale: Scale, y_scale: Scale) {
    this.x_scale = x_scale
    this.y_scale = y_scale
    this.x_range = this.x_scale.source_range
    this.y_range = this.y_scale.source_range
    this.ranges = [this.x_range, this.y_range]
    this.scales = [this.x_scale, this.y_scale]
  }

  map_to_screen(xs: Arrayable<number>, ys: Arrayable<number>): [NumberArray, NumberArray] {
    const sxs = this.x_scale.v_compute(xs)
    const sys = this.y_scale.v_compute(ys)
    return [sxs, sys]
  }

  map_from_screen(sxs: Arrayable<number>, sys: Arrayable<number>): [NumberArray, NumberArray] {
    const xs = this.x_scale.v_invert(sxs)
    const ys = this.y_scale.v_invert(sys)
    return [xs, ys]
  }
}
