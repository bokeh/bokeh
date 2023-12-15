import type {Range} from "../ranges/range"
import type {Bounds} from "../ranges/data_range1d"
import {DataRange1d} from "../ranges/data_range1d"
import type {CartesianFrame} from "../canvas/cartesian_frame"
import {CoordinateMapping} from "../coordinates/coordinate_mapping"
import type {PlotView} from "./plot_canvas"
import type {Interval} from "core/types"
import {logger} from "core/logging"

export type RangeState = Map<Range, Interval>

export type RangeInfo = {
  xrs: RangeState
  yrs: RangeState
}

export type RangeOptions = {
  panning?: boolean
  scrolling?: boolean
  maintain_focus?: boolean
}

export class RangeManager {
  constructor(readonly parent: PlotView) {}

  get frame(): CartesianFrame {
    return this.parent.frame
  }

  invalidate_dataranges: boolean = true

  update(range_info: RangeInfo, options: RangeOptions = {}): void {
    const range_state: RangeState = new Map()
    for (const [range, interval] of range_info.xrs) {
      range_state.set(range, interval)
    }
    for (const [range, interval] of range_info.yrs) {
      range_state.set(range, interval)
    }
    if (options.scrolling ?? false) {
      this._update_ranges_together(range_state)   // apply interval bounds while keeping aspect
    }
    this._update_ranges_individually(range_state, options)
  }

  reset(): void {
    const {x_ranges, y_ranges} = this.frame
    for (const range of x_ranges.values()) {
      range.reset()
    }
    for (const range of y_ranges.values()) {
      range.reset()
    }
    for (const renderer of this.parent.model.data_renderers) {
      const {coordinates} = renderer
      if (coordinates instanceof CoordinateMapping) {
        coordinates.x_source.reset()
        coordinates.y_source.reset()
      }
    }
    this.update_dataranges()
  }

  protected _update_dataranges(frame: CartesianFrame | CoordinateMapping): void {
    // Update any DataRange1ds here
    const bounds: Bounds = new Map()
    const log_bounds: Bounds = new Map()

    let calculate_log_bounds = false
    for (const [, xr] of frame.x_ranges) {
      if (xr instanceof DataRange1d && xr.scale_hint == "log")
        calculate_log_bounds = true
    }
    for (const [, yr] of frame.y_ranges) {
      if (yr instanceof DataRange1d && yr.scale_hint == "log")
        calculate_log_bounds = true
    }

    for (const renderer of this.parent.auto_ranged_renderers) {
      const bds = renderer.bounds()
      bounds.set(renderer.model, bds)

      if (calculate_log_bounds) {
        const log_bds = renderer.log_bounds()
        log_bounds.set(renderer.model, log_bds)
      }
    }

    let follow_enabled = false
    let has_bounds = false

    //const {width, height} = frame.bbox
    const width = frame.x_target.span
    const height = frame.y_target.span

    let r: number | undefined
    if (this.parent.model.match_aspect !== false && width != 0 && height != 0)
      r = (1/this.parent.model.aspect_scale)*(width/height)

    for (const [, xr] of frame.x_ranges) {
      if (xr instanceof DataRange1d) {
        const bounds_to_use = xr.scale_hint == "log" ? log_bounds : bounds
        xr.update(bounds_to_use, 0, this.parent, r)
        if (xr.follow != null) {
          follow_enabled = true
        }
      }
      if (xr.bounds != null)
        has_bounds = true
    }

    for (const [, yr] of frame.y_ranges) {
      if (yr instanceof DataRange1d) {
        const bounds_to_use = yr.scale_hint == "log" ? log_bounds : bounds
        yr.update(bounds_to_use, 1, this.parent, r)
        if (yr.follow != null) {
          follow_enabled = true
        }
      }
      if (yr.bounds != null)
        has_bounds = true
    }

    if (follow_enabled && has_bounds) {
      logger.warn("Follow enabled so bounds are unset.")
      for (const [, xr] of frame.x_ranges) {
        xr.bounds = null
      }
      for (const [, yr] of frame.y_ranges) {
        yr.bounds = null
      }
    }
  }

  update_dataranges(): void {
    this._update_dataranges(this.frame)

    for (const renderer of this.parent.auto_ranged_renderers) {
      const {coordinates} = renderer.model
      if (coordinates instanceof CoordinateMapping) {
        this._update_dataranges(coordinates)
      }
    }

    if (this.compute_initial() != null)
      this.invalidate_dataranges = false
  }

  compute_initial(): RangeInfo | null {
    // check for good values for ranges before setting initial range
    let good_vals = true
    const {x_ranges, y_ranges} = this.frame
    const xrs: Map<Range, Interval> = new Map()
    const yrs: Map<Range, Interval> = new Map()
    for (const [, range] of x_ranges) {
      const {start, end} = range
      if (isNaN(start + end)) {
        good_vals = false
        break
      }
      xrs.set(range, {start, end})
    }
    if (good_vals) {
      for (const [, range] of y_ranges) {
        const {start, end} = range
        if (isNaN(start + end)) {
          good_vals = false
          break
        }
        yrs.set(range, {start, end})
      }
    }
    if (good_vals)
      return {xrs, yrs}
    else {
      logger.warn("could not set initial ranges")
      return null
    }
  }

  protected _update_ranges_together(range_state: RangeState): void {
    // Get weight needed to scale the diff of the range to honor interval limits
    let weight = 1.0
    for (const [rng, range_info] of range_state) {
      weight = Math.min(weight, this._get_weight_to_constrain_interval(rng, range_info))
    }
    // Apply shared weight to all ranges
    if (weight < 1) {
      for (const [rng, range_info] of range_state) {
        range_info.start = weight*range_info.start + (1 - weight)*rng.start
        range_info.end = weight*range_info.end + (1 - weight)*rng.end
      }
    }
  }

  protected _update_ranges_individually(range_state: RangeState, options: RangeOptions = {}): void {
    const panning = options.panning ?? false
    const scrolling = options.scrolling ?? false
    const maintain_focus = options.maintain_focus ?? false

    let hit_bound = false
    for (const [rng, range_info] of range_state) {
      // Limit range interval first. Note that for scroll events,
      // the interval has already been limited for all ranges simultaneously
      if (!scrolling) {
        const weight = this._get_weight_to_constrain_interval(rng, range_info)
        if (weight < 1) {
          range_info.start = weight*range_info.start + (1 - weight)*rng.start
          range_info.end = weight*range_info.end + (1 - weight)*rng.end
        }
      }

      // Prevent range from going outside limits
      // Also ensure that range keeps the same delta when panning/scrolling
      if (rng.bounds != null) {
        const [min, max] = rng.computed_bounds
        const new_interval = Math.abs(range_info.end - range_info.start)

        if (rng.is_reversed) {
          if (min > range_info.end) {
            hit_bound = true
            range_info.end = min
            if (panning || scrolling) {
              range_info.start = min + new_interval
            }
          }
          if (max < range_info.start) {
            hit_bound = true
            range_info.start = max
            if (panning || scrolling) {
              range_info.end = max - new_interval
            }
          }
        } else {
          if (min > range_info.start) {
            hit_bound = true
            range_info.start = min
            if (panning || scrolling) {
              range_info.end = min + new_interval
            }
          }
          if (max < range_info.end) {
            hit_bound = true
            range_info.end = max
            if (panning || scrolling) {
              range_info.start = max - new_interval
            }
          }
        }
      }
    }

    // Cancel the event when hitting a bound while scrolling. This ensures that
    // the scroll-zoom tool maintains its focus position. Setting `maintain_focus`
    // to false results in a more "gliding" behavior, allowing one to
    // zoom out more smoothly, at the cost of losing the focus position.
    if (scrolling && hit_bound && maintain_focus)
      return

    for (const [rng, range_info] of range_state) {
      rng.have_updated_interactively = true
      if (rng.start != range_info.start || rng.end != range_info.end)
        rng.setv(range_info)
    }
  }

  protected _get_weight_to_constrain_interval(rng: Range, range_info: Interval): number {
    // Get the weight by which a range-update can be applied
    // to still honor the interval limits (including the implicit
    // max interval imposed by the bounds)
    const {min_interval} = rng
    let {max_interval} = rng

    // Express bounds as a max_interval. By doing this, the application of
    // bounds and interval limits can be applied independent from each-other.
    if (rng.bounds != null && rng.bounds != "auto") { // check `auto` for type-checking purpose
      const [min, max] = rng.bounds
      if (min != null && max != null) {
        const max_interval2 = Math.abs(max - min)
        max_interval = max_interval != null ? Math.min(max_interval, max_interval2) : max_interval2
      }
    }

    let weight = 1.0
    if (min_interval != null || max_interval != null) {
      const old_interval = Math.abs(rng.end - rng.start)
      const new_interval = Math.abs(range_info.end - range_info.start)
      if (min_interval != null && min_interval > 0 && new_interval < min_interval) {
        weight = (old_interval - min_interval) / (old_interval - new_interval)
      }
      if (max_interval != null && max_interval > 0 && new_interval > max_interval) {
        weight = (max_interval - old_interval) / (new_interval - old_interval)
      }
      weight = Math.max(0.0, Math.min(1.0, weight))
    }
    return weight
  }
}
