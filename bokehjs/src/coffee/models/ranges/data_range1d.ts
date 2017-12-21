import {DataRange} from "./data_range"
import {Renderer} from "../renderers/renderer"
import {GlyphRenderer} from "../renderers/glyph_renderer"
import {PaddingUnits, StartEnd} from "core/enums"
import {logger} from "core/logging"
import * as p from "core/properties"
import * as bbox from "core/util/bbox"
import {Rect} from "core/util/spatial"
import {contains} from "core/util/array"

export type Dim = 0 | 1
export type Bounds = {[key: string]: Rect}

export class DataRange1d extends DataRange {

  start: number
  end: number
  range_padding: number
  range_padding_units: PaddingUnits
  flipped: boolean
  follow: StartEnd
  follow_interval: number
  default_span: number
  bounds: [number, number] | "auto"
  min_interval: any // XXX: what's this?
  max_interval: any // XXX: what's this?

  scale_hint: "log" | "auto"

  protected _initial_start: number
  protected _initial_end: number
  protected _initial_range_padding: number
  protected _initial_range_padding_units: PaddingUnits
  protected _initial_follow: StartEnd
  protected _initial_follow_interval: number
  protected _initial_default_span: number

  protected _plot_bounds: Bounds = {}

  have_updated_interactively: boolean = false

  initialize(attrs: any, options: any): void {
    super.initialize(attrs, options)

    this._initial_start = this.start
    this._initial_end = this.end
    this._initial_range_padding = this.range_padding
    this._initial_range_padding_units = this.range_padding_units
    this._initial_follow = this.follow
    this._initial_follow_interval = this.follow_interval
    this._initial_default_span = this.default_span
  }

  get min(): number {
    return Math.min(this.start, this.end)
  }

  get max(): number {
    return Math.max(this.start, this.end)
  }

  computed_renderers(): Renderer[] {
    // TODO (bev) check that renderers actually configured with this range
    const names = this.names
    let renderers = this.renderers

    if (renderers.length == 0) {
      for (const plot of this.plots) {
        const rs = plot.renderers.filter((r) => r instanceof GlyphRenderer)
        renderers = renderers.concat(rs)
      }
    }

    if (names.length > 0)
      renderers = renderers.filter((r) => contains(names, r.name))

    logger.debug(`computed ${renderers.length} renderers for DataRange1d ${this.id}`)
    for (const r of renderers) {
      logger.trace(` - ${r.type} ${r.id}`)
    }

    return renderers
  }

  protected _compute_plot_bounds(renderers: Renderer[], bounds: Bounds): Rect {
    let result = bbox.empty()

    for (const r of renderers) {
      if (bounds[r.id] != null)
        result = bbox.union(result, bounds[r.id])
    }

    return result
  }

   adjust_bounds_for_aspect(bounds: Rect, r: number) : Rect {
    let result = bbox.empty()

    let width = bounds.maxX - bounds.minX
    if (width <= 0) { width = 1.0 }

    let height = bounds.maxY - bounds.minY
    if (height <= 0) { height = 1.0 }

    const xcenter = 0.5*(bounds.maxX + bounds.minX)
    const ycenter = 0.5*(bounds.maxY + bounds.minY)

    if (width < r*height) {
      width = r*height
    } else {
      height = width/r
    }

    result.maxX = xcenter+0.5*width
    result.minX = xcenter-0.5*width
    result.maxY = ycenter+0.5*height
    result.minY = ycenter-0.5*height

    return result
  }

  protected _compute_min_max(plot_bounds: Bounds, dimension: Dim): [number, number] {
    let overall = bbox.empty()
    for (const k in plot_bounds) {
      const v = plot_bounds[k]
      overall = bbox.union(overall, v)
    }

    let min, max: number
    if (dimension == 0)
      [min, max] = [overall.minX, overall.maxX]
    else
      [min, max] = [overall.minY, overall.maxY]

    return [min, max]
  }

  protected _compute_range(min: number, max: number): [number, number] {
    const range_padding = this.range_padding // XXX: ? 0

    let start, end: number
    if (this.scale_hint == "log") {
      if (isNaN(min) || !isFinite(min) || min <= 0) {
        if (isNaN(max) || !isFinite(max) || max <= 0)
          min = 0.1
        else
          min = max / 100
        logger.warn(`could not determine minimum data value for log axis, DataRange1d using value ${min}`)
      }
      if (isNaN(max) || !isFinite(max) || max <= 0) {
        if (isNaN(min) || !isFinite(min) || min <= 0)
          max = 10
        else
          max = min * 100
        logger.warn(`could not determine maximum data value for log axis, DataRange1d using value ${max}`)
      }

      let center, span: number
      if (max == min) {
        span = this.default_span + 0.001
        center = Math.log(min) / Math.log(10)
      } else {
        let log_min, log_max: number
        if (this.range_padding_units == "percent") {
          log_min = Math.log(min) / Math.log(10)
          log_max = Math.log(max) / Math.log(10)
          span = (log_max - log_min)*(1 + range_padding)
        } else {
          log_min = Math.log(min - range_padding) / Math.log(10)
          log_max = Math.log(max + range_padding) / Math.log(10)
          span = log_max - log_min
        }
        center = (log_min + log_max) / 2.0
      }
      start = Math.pow(10, center - span / 2.0)
      end   = Math.pow(10, center + span / 2.0)
    } else {
      let span: number
      if (max == min)
        span = this.default_span
      else {
        if (this.range_padding_units == "percent")
          span = (max - min)*(1 + range_padding)
        else
          span = (max - min) + 2*range_padding
      }
      const center = (max + min) / 2.0
      start = center - span / 2.0
      end   = center + span / 2.0
    }

    let follow_sign = +1
    if (this.flipped) {
      [start, end] = [end, start]
      follow_sign = -1
    }

    const follow_interval = this.follow_interval
    if (follow_interval != null && Math.abs(start - end) > follow_interval) {
      if (this.follow == 'start')
        end = start + follow_sign*follow_interval
      else if (this.follow == 'end')
        start = end - follow_sign*follow_interval
    }

    return [start, end]
  }

  update(bounds: Bounds, dimension: Dim, bounds_id: string, r: number): void {
    if (this.have_updated_interactively)
      return

    const renderers = this.computed_renderers()

    // update the raw data bounds for all renderers we care about
    let total_bounds = this._compute_plot_bounds(renderers, bounds)

    if (r != null)
      total_bounds = this.adjust_bounds_for_aspect(total_bounds, r)

    this._plot_bounds[bounds_id] = total_bounds

    // compute the min/mix for our specified dimension
    const [min, max] = this._compute_min_max(this._plot_bounds, dimension)

    // derive start, end from bounds and data range config
    let [start, end] = this._compute_range(min, max)

    if (this._initial_start != null) {
      if (this.scale_hint == "log") {
        if (this._initial_start > 0)
          start = this._initial_start
      } else
        start = this._initial_start
    }
    if (this._initial_end != null) {
      if (this.scale_hint == "log") {
        if (this._initial_end > 0)
          end = this._initial_end
      } else
        end = this._initial_end
    }

    // only trigger updates when there are changes
    const [_start, _end] = [this.start, this.end]
    if (start != _start || end != _end) {
      const new_range: {start?: number, end?: number} = {}
      if (start != _start)
        new_range.start = start
      if (end != _end)
        new_range.end = end
      this.setv(new_range)
    }

    if (this.bounds == 'auto')
      this.setv({bounds: [start, end]}, {silent: true})

    this.change.emit(undefined)
  }

  reset(): void {
    this.have_updated_interactively = false
    // change events silenced as PlotCanvasView.update_dataranges triggers property callbacks
    this.setv({
      range_padding: this._initial_range_padding,
      range_padding_units: this._initial_range_padding_units,
      follow: this._initial_follow,
      follow_interval: this._initial_follow_interval,
      default_span: this._initial_default_span,
    }, {silent: true})
    this.change.emit(undefined)
  }
}

DataRange1d.prototype.type = "DataRange1d"

DataRange1d.define({
  start:               [ p.Number                  ],
  end:                 [ p.Number                  ],
  range_padding:       [ p.Number,       0.1       ],
  range_padding_units: [ p.PaddingUnits, "percent" ],
  flipped:             [ p.Bool,         false     ],
  follow:              [ p.StartEnd,               ],
  follow_interval:     [ p.Number                  ],
  default_span:        [ p.Number,       2         ],
  bounds:              [ p.Any                     ],
  min_interval:        [ p.Any                     ],
  max_interval:        [ p.Any                     ],
})

DataRange1d.internal({
  scale_hint: [ p.String, 'auto' ]
})
