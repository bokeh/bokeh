import {DataRange} from "./data_range"
import type {Renderer} from "../renderers/renderer"
import {PaddingUnits, StartEnd} from "core/enums"
import type {Rect} from "core/types"
import {flat_map} from "core/util/iterator"
import {clamp} from "core/util/math"
import {logger} from "core/logging"
import type * as p from "core/properties"
import * as bbox from "core/util/bbox"
import type {PlotView} from "../plots/plot"
import {compute_renderers} from "../util"

export type Dim = 0 | 1
export type Bounds = Map<Renderer, Rect>

export namespace DataRange1d {
  export type Attrs = p.AttrsOf<Props>

  export type Props = DataRange.Props & {
    range_padding: p.Property<number>
    range_padding_units: p.Property<PaddingUnits>
    flipped: p.Property<boolean>
    follow: p.Property<StartEnd | null>
    follow_interval: p.Property<number | null>
    default_span: p.Property<number>
    only_visible: p.Property<boolean>

    scale_hint: p.Property<"log" | "auto">
  }
}

export interface DataRange1d extends DataRange1d.Attrs {}

export class DataRange1d extends DataRange {
  declare properties: DataRange1d.Props

  constructor(attrs?: Partial<DataRange1d.Attrs>) {
    super(attrs)
  }

  static {
    this.define<DataRange1d.Props>(({Bool, Float, Nullable}) => ({
      range_padding:       [ Float, 0.1 ],
      range_padding_units: [ PaddingUnits, "percent" ],
      flipped:             [ Bool, false ],
      follow:              [ Nullable(StartEnd), null ],
      follow_interval:     [ Nullable(Float), null ],
      default_span:        [ Float, 2.0 ],
      only_visible:        [ Bool, false ],
    }))

    this.internal<DataRange1d.Props>(({Enum}) => ({
      scale_hint: [ Enum("log", "auto"), "auto" ],
    }))
  }

  protected _initial_start: number | null
  protected _initial_end: number | null
  protected _initial_range_padding: number
  protected _initial_range_padding_units: PaddingUnits
  protected _initial_follow: StartEnd | null
  protected _initial_follow_interval: number | null
  protected _initial_default_span: number

  protected _plot_bounds: Map<PlotView, Rect>

  override have_updated_interactively: boolean = false

  override initialize(): void {
    super.initialize()

    this._initial_start = isNaN(this.start) ? null : this.start
    this._initial_end = isNaN(this.end) ? null : this.end
    this._initial_range_padding = this.range_padding
    this._initial_range_padding_units = this.range_padding_units
    this._initial_follow = this.follow
    this._initial_follow_interval = this.follow_interval
    this._initial_default_span = this.default_span

    this._plot_bounds = new Map()
  }

  get min(): number {
    return Math.min(this.start, this.end)
  }

  get max(): number {
    return Math.max(this.start, this.end)
  }

  computed_renderers(): Renderer[] {
    // TODO (bev) check that renderers actually configured with this range
    const {renderers} = this
    const all_renderers = flat_map(this.linked_plots, (plot) => plot.auto_ranged_renderers.map((r) => r.model))
    return compute_renderers(renderers.length == 0 ? "auto" : renderers, [...all_renderers])
  }

  /*protected*/ _compute_plot_bounds(renderers: Renderer[], bounds: Bounds): Rect {
    let result = bbox.empty()

    for (const r of renderers) {
      const rect = bounds.get(r)
      if (rect != null && (r.visible || !this.only_visible)) {
        result = bbox.union(result, rect)
      }
    }

    return result
  }

  adjust_bounds_for_aspect(bounds: Rect, ratio: number): Rect {
    const result = bbox.empty()

    let width = bounds.x1 - bounds.x0
    if (width <= 0) {
      width = 1.0
    }

    let height = bounds.y1 - bounds.y0
    if (height <= 0) {
      height = 1.0
    }

    const xcenter = 0.5*(bounds.x1 + bounds.x0)
    const ycenter = 0.5*(bounds.y1 + bounds.y0)

    if (width < ratio*height) {
      width = ratio*height
    } else {
      height = width/ratio
    }

    result.x1 = xcenter+0.5*width
    result.x0 = xcenter-0.5*width
    result.y1 = ycenter+0.5*height
    result.y0 = ycenter-0.5*height

    return result
  }

  /*protected*/ _compute_min_max(plot_bounds: Iterable<[PlotView, Rect]>, dimension: Dim): [number, number] {
    let overall = bbox.empty()
    for (const [plot, rect] of plot_bounds) {
      if (plot.model.visible) {
        overall = bbox.union(overall, rect)
      }
    }

    let min, max: number
    if (dimension == 0) {
      [min, max] = [overall.x0, overall.x1]
    } else {
      [min, max] = [overall.y0, overall.y1]
    }

    return [min, max]
  }

  /*protected*/ _compute_range(min: number, max: number): [number, number] {
    const {range_padding} = this

    const min_interval = this.min_interval ?? 0
    const max_interval = this.max_interval ?? Infinity

    let start, end: number

    if (this._initial_start != null) {
      min = this._initial_start
    }
    if (this._initial_end != null) {
      max = this._initial_end
    }

    if (this.scale_hint == "log") {
      if (isNaN(min) || !isFinite(min) || min <= 0) {
        if (isNaN(max) || !isFinite(max) || max <= 0) {
          min = 0.1
        } else {
          min = max / 100
        }
        logger.warn(`could not determine minimum data value for log axis, DataRange1d using value ${min}`)
      }
      if (isNaN(max) || !isFinite(max) || max <= 0) {
        if (isNaN(min) || !isFinite(min) || min <= 0) {
          max = 10
        } else {
          max = min * 100
        }
        logger.warn(`could not determine maximum data value for log axis, DataRange1d using value ${max}`)
      }

      let center, span: number
      if (max == min) {
        span = this.default_span + 0.001
        center = Math.log10(min)
      } else {
        let log_min, log_max: number
        if (this.range_padding_units == "percent") {
          log_min = Math.log10(min)
          log_max = Math.log10(max)
          span = (log_max - log_min)*(1 + range_padding)
        } else {
          log_min = Math.log10(min - range_padding)
          log_max = Math.log10(max + range_padding)
          span = log_max - log_min
        }
        center = (log_min + log_max) / 2.0
      }
      span = clamp(span, min_interval, max_interval)
      start = 10**(center - span / 2.0)
      end   = 10**(center + span / 2.0)
    } else {
      let span: number
      if (max == min) {
        span = this.default_span
      } else {
        if (this.range_padding_units == "percent") {
          span = (max - min)*(1 + range_padding)
        } else {
          span = (max - min) + 2*range_padding
        }
      }
      span = clamp(span, min_interval, max_interval)
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
      if (this.follow == "start") {
        end = start + follow_sign*follow_interval
      } else if (this.follow == "end") {
        start = end - follow_sign*follow_interval
      }
    }

    return [start, end]
  }

  update(bounds: Bounds, dimension: Dim, plot: PlotView, ratio?: number): void {
    if (this.have_updated_interactively) {
      return
    }

    const renderers = this.computed_renderers()

    // update the raw data bounds for all renderers we care about
    let total_bounds = this._compute_plot_bounds(renderers, bounds)

    if (ratio != null) {
      total_bounds = this.adjust_bounds_for_aspect(total_bounds, ratio)
    }

    this._plot_bounds.set(plot, total_bounds)

    // compute the min/mix for our specified dimension
    const [min, max] = this._compute_min_max(this._plot_bounds.entries(), dimension)

    // derive start, end from bounds and data range config
    let [start, end] = this._compute_range(min, max)

    if (this._initial_start != null) {
      if (this.scale_hint == "log") {
        if (this._initial_start > 0) {
          start = this._initial_start
        }
      } else {
        start = this._initial_start
      }
    }
    if (this._initial_end != null) {
      if (this.scale_hint == "log") {
        if (this._initial_end > 0) {
          end = this._initial_end
        }
      } else {
        end = this._initial_end
      }
    }

    let needs_emit = false
    if (this.bounds == "auto") {
      this._computed_bounds = [start, end]
      needs_emit = true
    }

    // only trigger updates when there are changes
    const [_start, _end] = [this.start, this.end]
    if (start != _start || end != _end) {
      const new_range: {start?: number, end?: number} = {}
      if (start != _start) {
        new_range.start = start
      }
      if (end != _end) {
        new_range.end = end
      }
      this.setv(new_range)
      needs_emit = false
    }

    if (needs_emit) {
      this.change.emit()
    }
  }

  reset(): void {
    this.have_updated_interactively = false
    // change events silenced as PlotView.update_dataranges triggers property callbacks
    this.setv({
      range_padding: this._initial_range_padding,
      range_padding_units: this._initial_range_padding_units,
      follow: this._initial_follow,
      follow_interval: this._initial_follow_interval,
      default_span: this._initial_default_span,
    }, {silent: true})
    this.change.emit()
  }
}
