import {CategoricalScale} from "../scales/categorical_scale"
import {LogScale} from "../scales/log_scale"
import type {Scale} from "../scales/scale"
import type {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"

import {BBox} from "core/util/bbox"
import {entries} from "core/util/object"
import {assert} from "core/util/assert"
import {Signal0} from "core/signaling"
import type {Dict} from "core/types"

type Ranges = Dict<Range>
type Scales = Dict<Scale>

export class CartesianFrame {

  private _bbox: BBox = new BBox()
  get bbox(): BBox {
    return this._bbox
  }

  readonly change = new Signal0<this>(this, "change")

  constructor(public in_x_scale: Scale,
              public in_y_scale: Scale,
              public x_range: Range,
              public y_range: Range,
              public extra_x_ranges: Ranges = {},
              public extra_y_ranges: Ranges = {},
              public extra_x_scales: Scales = {},
              public extra_y_scales: Scales = {}) {
    assert(in_x_scale.properties.source_range.is_unset && in_x_scale.properties.target_range.is_unset)
    assert(in_y_scale.properties.source_range.is_unset && in_y_scale.properties.target_range.is_unset)
    this._configure_scales()
  }

  protected _x_target: Range1d
  protected _y_target: Range1d

  protected _x_ranges: Map<string, Range>
  protected _y_ranges: Map<string, Range>

  protected _x_scales: Map<string, Scale>
  protected _y_scales: Map<string, Scale>

  protected _get_ranges(range: Range, extra_ranges: Ranges): Map<string, Range> {
    return new Map([...entries(extra_ranges), ["default", range]])
  }

  /*protected*/ _get_scales(scale: Scale, extra_scales: Scales, ranges: Map<string, Range>, frame_range: Range): Map<string, Scale> {
    const in_scales = new Map([...entries(extra_scales), ["default", scale]])
    const scales: Map<string, Scale> = new Map()

    for (const [name, range] of ranges) {
      const factor_range = range instanceof FactorRange
      const categorical_scale = scale instanceof CategoricalScale

      if (factor_range != categorical_scale) {
        throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
      }

      if (scale instanceof LogScale && range instanceof DataRange1d) {
        range.scale_hint = "log"
      }

      const base_scale = in_scales.get(name) ?? scale
      const derived_scale = base_scale.clone()
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

    this._x_scales = this._get_scales(this.in_x_scale, this.extra_x_scales, this._x_ranges, this._x_target)
    this._y_scales = this._get_scales(this.in_y_scale, this.extra_y_scales, this._y_ranges, this._y_target)
  }

  configure_scales(): void {
    this._configure_scales()
    this.change.emit()
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

  set_geometry(bbox: BBox): void {
    this._bbox = bbox
    this._update_scales()
  }

  get x_target(): Range1d {
    return this._x_target
  }

  get y_target(): Range1d {
    return this._y_target
  }

  get x_ranges(): Map<string, Range> {
    return this._x_ranges
  }

  get y_ranges(): Map<string, Range> {
    return this._y_ranges
  }

  get ranges(): Set<Range> {
    return new Set([...this.x_ranges.values(), ...this.y_ranges.values()])
  }

  get x_scales(): Map<string, Scale> {
    return this._x_scales
  }

  get y_scales(): Map<string, Scale> {
    return this._y_scales
  }

  get scales(): Set<Scale> {
    return new Set([...this.x_scales.values(), ...this.y_scales.values()])
  }

  get x_scale(): Scale {
    return this._x_scales.get("default")!
  }

  get y_scale(): Scale {
    return this._y_scales.get("default")!
  }
}
