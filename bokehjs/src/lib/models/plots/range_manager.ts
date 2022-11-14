import {Range} from "../ranges/range"
import {DataRange1d, Bounds} from "../ranges/data_range1d"
import {CartesianFrame} from "../canvas/cartesian_frame"
import {CoordinateMapping} from "../coordinates/coordinate_mapping"
import type {PlotView} from "./plot_canvas"
import {Interval} from "core/types"
import {logger} from "core/logging"

export type RangeInfo = {
  xrs: Map<string, Interval>
  yrs: Map<string, Interval>
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

  update(range_info: RangeInfo | null, options: RangeOptions = {}): void {
    const {x_ranges, y_ranges} = this.frame
    if (range_info == null) {
      for (const [, range] of x_ranges) {
        range.reset()
      }
      for (const [, range] of y_ranges) {
        range.reset()
      }
      this.update_dataranges()
    } else {
      const range_info_iter: [Range, Interval][] = []
      for (const [name, range] of x_ranges) {
        range_info_iter.push([range, range_info.xrs.get(name)!])
      }
      for (const [name, range] of y_ranges) {
        range_info_iter.push([range, range_info.yrs.get(name)!])
      }
      if (options.scrolling ?? false) {
        this._update_ranges_together(range_info_iter)   // apply interval bounds while keeping aspect
      }
      this._update_ranges_individually(range_info_iter, options)
    }
  }

  reset(): void {
    this.update(null)
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
        if (xr.follow) {
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
        if (yr.follow) {
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
      if (coordinates != null)
        this._update_dataranges(coordinates)
    }

    if (this.compute_initial() != null)
      this.invalidate_dataranges = false
  }

  compute_initial(): RangeInfo | null {
    // check for good values for ranges before setting initial range
    let good_vals = true
    const {x_ranges, y_ranges} = this.frame
    const xrs: Map<string, Interval> = new Map()
    const yrs: Map<string, Interval> = new Map()
    for (const [name, range] of x_ranges) {
      const {start, end} = range
      if (isNaN(start + end)) {
        good_vals = false
        break
      }
      xrs.set(name, {start, end})
    }
    if (good_vals) {
      for (const [name, range] of y_ranges) {
        const {start, end} = range
        if (isNaN(start + end)) {
          good_vals = false
          break
        }
        yrs.set(name, {start, end})
      }
    }
    if (good_vals)
      return {xrs, yrs}
    else {
      logger.warn("could not set initial ranges")
      return null
    }
  }

  protected _update_ranges_together(range_info_iter: [Range, Interval][]): void {
    // Get weight needed to scale the diff of the range to honor interval limits
    let weight = 1.0
    for (const [rng, range_info] of range_info_iter) {
      weight = Math.min(weight, this._get_weight_to_constrain_interval(rng, range_info))
    }
    // Apply shared weight to all ranges
    if (weight < 1) {
      for (const [rng, range_info] of range_info_iter) {
        range_info.start = weight*range_info.start + (1 - weight)*rng.start
        range_info.end = weight*range_info.end + (1 - weight)*rng.end
      }
    }
  }

  protected _update_ranges_individually(range_info_iter: [Range, Interval][], options: RangeOptions = {}): void {
    const panning = options.panning ?? false
    const scrolling = options.scrolling ?? false
    const maintain_focus = options.maintain_focus ?? false

    let hit_bound = false
    for (const [rng, range_info] of range_info_iter) {
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
      if (rng.bounds != null && rng.bounds != "auto") { // check `auto` for type-checking purpose
        const [min, max] = rng.bounds
        const new_interval = Math.abs(range_info.end - range_info.start)

        if (rng.is_reversed) {
          if (min != null) {
            if (min > range_info.end) {
              hit_bound = true
              range_info.end = min
              if (panning || scrolling) {
                range_info.start = min + new_interval
              }
            }
          }
          if (max != null) {
            if (max < range_info.start) {
              hit_bound = true
              range_info.start = max
              if (panning || scrolling) {
                range_info.end = max - new_interval
              }
            }
          }
        } else {
          if (min != null) {
            if (min > range_info.start) {
              hit_bound = true
              range_info.start = min
              if (panning || scrolling) {
                range_info.end = min + new_interval
              }
            }
          }
          if (max != null) {
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
    }

    // Cancel the event when hitting a bound while scrolling. This ensures that
    // the scroll-zoom tool maintains its focus position. Setting `maintain_focus`
    // to false results in a more "gliding" behavior, allowing one to
    // zoom out more smoothly, at the cost of losing the focus position.
    if (scrolling && hit_bound && maintain_focus)
      return

    for (const [rng, range_info] of range_info_iter) {
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
