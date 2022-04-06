import {CategoricalScale} from "../scales/categorical_scale"
import {LogScale} from "../scales/log_scale"
import {Scale} from "../scales/scale"
import {Range} from "../ranges/range"
import {Range1d} from "../ranges/range1d"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"

import {BBox} from "core/util/bbox"
import {entries} from "core/util/object"
import {assert} from "core/util/assert"

type Ranges = {[key: string]: Range}
type Scales = {[key: string]: Scale}

export class CartesianFrame {

  private _bbox: BBox = new BBox()
  get bbox(): BBox {
    return this._bbox
  }

  protected readonly _x_target: Range1d = new Range1d()
  protected readonly _y_target: Range1d = new Range1d()

  protected readonly _x_ranges: Map<string, Range>
  protected readonly _y_ranges: Map<string, Range>

  protected readonly _x_scales: Map<string, Scale>
  protected readonly _y_scales: Map<string, Scale>

  constructor(private readonly in_x_scale: Scale,
              private readonly in_y_scale: Scale,
              readonly x_range: Range,
              readonly y_range: Range,
              private readonly extra_x_ranges: Ranges = {},
              private readonly extra_y_ranges: Ranges = {},
              private readonly extra_x_scales: Scales = {},
              private readonly extra_y_scales: Scales = {}) {
    assert(in_x_scale.properties.source_range.is_unset && in_x_scale.properties.target_range.is_unset)
    assert(in_y_scale.properties.source_range.is_unset && in_y_scale.properties.target_range.is_unset)

    this._x_ranges = this._get_ranges(this.x_range, this.extra_x_ranges)
    this._y_ranges = this._get_ranges(this.y_range, this.extra_y_ranges)

    this._x_scales = this._get_scales(this.in_x_scale, this.extra_x_scales, this._x_ranges, this._x_target)
    this._y_scales = this._get_scales(this.in_y_scale, this.extra_y_scales, this._y_ranges, this._y_target)
  }

  protected _get_ranges(range: Range, extra_ranges: Ranges): Map<string, Range> {
    return new Map(entries({...extra_ranges, default: range}))
  }

  protected _get_scales(scale: Scale, extra_scales: Scales, ranges: Map<string, Range>, frame_range: Range): Map<string, Scale> {
    const in_scales = new Map(entries({...extra_scales, default: scale}))
    const scales: Map<string, Scale> = new Map()

    for (const [name, range] of ranges) {
      const factor_range = range instanceof FactorRange
      const categorical_scale = scale instanceof CategoricalScale

      if (factor_range != categorical_scale) {
        throw new Error(`Range ${range.type} is incompatible is Scale ${scale.type}`)
      }

      if (scale instanceof LogScale && range instanceof DataRange1d)
        range.scale_hint = "log"

      const derived_scale = (in_scales.get(name) ?? scale).clone()
      derived_scale.setv({source_range: range, target_range: frame_range})
      scales.set(name, derived_scale)
    }

    return scales
  }

  protected _update_frame_ranges(): void {
    // data to/from screen space transform (left-bottom <-> left-top origin)
    const {bbox} = this
    this._x_target.setv({start: bbox.left, end: bbox.right})
    this._y_target.setv({start: bbox.bottom, end: bbox.top})
  }

  set_geometry(bbox: BBox): void {
    this._bbox = bbox
    this._update_frame_ranges()
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
