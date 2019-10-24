import {Arrayable, NumberArray} from "core/types"
import {Scale} from "../scales/scale"
import {Range} from "../ranges/range"

export class CoordinateSystem {
  readonly ranges: readonly [Range, Range]
  readonly scales: readonly [Scale, Scale]

  constructor(
      readonly x_range: Range, readonly y_range: Range,
      readonly x_scale: Scale, readonly y_scale: Scale) {
    this.ranges = [x_range, y_range]
    this.scales = [x_scale, y_scale]
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
