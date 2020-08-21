import {CategoricalScale} from "../scales/categorical_scale"
import {ContinuousScale} from "../scales/continuous_scale"
import {LogScale} from "../scales/log_scale"
import {Scale} from "../scales/scale"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"

import {LayoutItem} from "core/layout"
import {BBox} from "core/util/bbox"
import {entries, to_object} from "core/util/object"
import {assert} from "core/util/assert"

type Ranges = {[key: string]: Range}

export class CartesianFrame extends LayoutItem {

  constructor(private readonly in_x_scale: Scale,
              private readonly in_y_scale: Scale,
              readonly x_range: Range,
              readonly y_range: Range,
              private readonly extra_x_ranges: Ranges = {},
              private readonly extra_y_ranges: Ranges = {}) {
    super()
    assert(in_x_scale.source_range == null && in_x_scale.target_range == null)
    assert(in_y_scale.source_range == null && in_y_scale.target_range == null)
    this._configure_scales()
  }

  protected _x_target: Range1d
  protected _y_target: Range1d

  protected _x_ranges: Map<string, Range>
  protected _y_ranges: Map<string, Range>

  protected _x_scales: Map<string, Scale>
  protected _y_scales: Map<string, Scale>

  protected _get_ranges(range: Range, extra_ranges: Ranges): Map<string, Range> {
    return new Map(entries({...extra_ranges, default: range}))
  }

  /*protected*/ _get_scales(scale: Scale, ranges: Map<string, Range>, frame_range: Range): Map<string, Scale> {
    const scales: Map<string, Scale> = new Map()

    for (const [name, range] of ranges) {
      if (range instanceof DataRange1d || range instanceof Range1d) {
        if (!(scale instanceof ContinuousScale))
          throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
      }

      if (range instanceof FactorRange) {
        if (!(scale instanceof CategoricalScale))
          throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
      }

      if (scale instanceof LogScale && range instanceof DataRange1d)
        range.scale_hint = "log"

      const derived_scale = scale.clone()
      derived_scale.setv({source_range: range, target_range: frame_range})
      scales.set(name, derived_scale)
    }

    return scales
  }

  protected _configure_frame_ranges(): void {
    // data to/from screen space transform (left-bottom <-> left-top origin)
    const {bbox} = this
    this._x_target = new Range1d({start: bbox.left, end: bbox.right})
    this._y_target = new Range1d({start: bbox.bottom, end: bbox.top})
  }

  protected _configure_scales(): void {
    this._configure_frame_ranges()

    this._x_ranges = this._get_ranges(this.x_range, this.extra_x_ranges)
    this._y_ranges = this._get_ranges(this.y_range, this.extra_y_ranges)

    this._x_scales = this._get_scales(this.in_x_scale, this._x_ranges, this._x_target)
    this._y_scales = this._get_scales(this.in_y_scale, this._y_ranges, this._y_target)
  }

  protected _update_scales(): void {
    this._configure_frame_ranges()

    for (const [, scale] of this._x_scales) {
      scale.target_range = this._x_target
    }

    for (const [, scale] of this._y_scales) {
      scale.target_range = this._y_target
    }
  }

  protected _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)
    this._update_scales()
  }

  get x_ranges(): Map<string, Range> {
    return this._x_ranges
  }

  get y_ranges(): Map<string, Range> {
    return this._y_ranges
  }

  get x_scales(): Map<string, Scale> {
    return this._x_scales
  }

  get y_scales(): Map<string, Scale> {
    return this._y_scales
  }

  get x_scale(): Scale {
    return this._x_scales.get("default")!
  }

  get y_scale(): Scale {
    return this._y_scales.get("default")!
  }

  /** @deprecated */
  get xscales(): {[key: string]: Scale} {
    return to_object(this.x_scales)
  }

  /** @deprecated */
  get yscales(): {[key: string]: Scale} {
    return to_object(this.y_scales)
  }
}
