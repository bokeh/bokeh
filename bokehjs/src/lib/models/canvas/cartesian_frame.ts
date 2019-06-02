import {CategoricalScale} from "../scales/categorical_scale"
import {LinearScale} from "../scales/linear_scale"
import {LogScale} from "../scales/log_scale"
import {Scale} from "../scales/scale"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"

import {LayoutItem} from "core/layout"
import {Arrayable} from "core/types"
import {BBox} from "core/util/bbox"

/*
export class CartesianFrameView extends ScopeView {
  layout: LayoutItem
}
*/

export class CartesianFrame extends LayoutItem {

  constructor(protected readonly _x_scale: Scale,
              protected readonly _y_scale: Scale,
              readonly x_range: Range,
              readonly y_range: Range) {
    super()
    this._configure_scales()
  }

  protected _x_target: Range1d
  protected _y_target: Range1d

  x_scale: Scale
  y_scale: Scale

  get ranges(): [Range, Range] {
    return [this.x_range, this.y_range]
  }

  get scales(): [Scale, Scale] {
    return [this.x_scale, this.y_scale]
  }

  map_to_screen(xs: Arrayable<number>, ys: Arrayable<number>): [Arrayable<number>, Arrayable<number>] {
    const sxs = this.x_scale.v_compute(xs)
    const sys = this.y_scale.v_compute(ys)
    return [sxs, sys]
  }

  map_from_screen(sxs: Arrayable<number>, sys: Arrayable<number>): [Arrayable<number>, Arrayable<number>] {
    const xs = this.x_scale.v_invert(sxs)
    const ys = this.y_scale.v_invert(sys)
    return [xs, ys]
  }

  /*protected*/ _configure_scale(scale: Scale, range: Range, frame_range: Range): Scale {
    /*
    if (source_range instanceof DataRange1d || source_range instanceof Range1d) {
      if (!(scale instanceof LogScale) && !(scale instanceof LinearScale))
        throw new Error(`Range ${source_range.type} is incompatible is Scale ${scale.type}`)
      // XXX: special case because CategoricalScale is a subclass of LinearScale, should be removed in future
      if (scale instanceof CategoricalScale)
        throw new Error(`Range ${source_range.type} is incompatible is Scale ${scale.type}`)
    }

    if (source_range instanceof FactorRange && !(scale instanceof CategoricalScale))
      throw new Error(`Range ${source_range.type} is incompatible is Scale ${scale.type}`)

    if (scale instanceof LogScale && source_range instanceof DataRange1d)
      source_range.scale_hint = "log"
    */
    if (range instanceof DataRange1d || range instanceof Range1d) {
      if (!(scale instanceof LogScale) && !(scale instanceof LinearScale))
        throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
      // XXX: special case because CategoricalScale is a subclass of LinearScale, should be removed in future
      if (scale instanceof CategoricalScale)
        throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
    }

    if (range instanceof FactorRange) {
      if (!(scale instanceof CategoricalScale))
        throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
    }

    if (scale instanceof LogScale && range instanceof DataRange1d)
      range.scale_hint = "log"

    const s = scale.clone()
    s.setv({source_range: range, target_range: frame_range})
    return s
  }

  protected _configure_frame_ranges(): void {
    // data to/from screen space transform (left-bottom <-> left-top origin)
    this._x_target = new Range1d({start: this._left.value, end: this._right.value})
    this._y_target = new Range1d({start: this._bottom.value, end: this._top.value})
  }

  protected _configure_scales(): void {
    this._configure_frame_ranges()

    this.x_scale = this._configure_scale(this._x_scale, this.x_range, this._x_target)
    this.y_scale = this._configure_scale(this._y_scale, this.y_range, this._y_target)
  }

  protected _update_scales(): void {
    this._configure_frame_ranges()

    this.x_scale.target_range = this._x_target
    this.y_scale.target_range = this._y_target
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)
    this._update_scales()
  }
}
