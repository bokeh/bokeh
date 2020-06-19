import {Size, Sizeable, SizeHint, BoxSizing, SizingPolicy} from "./types"
import {BBox, CoordinateTransform} from "../util/bbox"

const {min, max, round} = Math

export type ExtBoxSizing = BoxSizing & {
  readonly size: Partial<Size>
  readonly min_size: Size
  readonly max_size: Size
}

export abstract class Layoutable {
  protected _bbox: BBox = new BBox()
  protected _inner_bbox: BBox = new BBox()

  get bbox(): BBox {
    return this._bbox
  }

  get inner_bbox(): BBox {
    return this._inner_bbox
  }

  private _sizing: ExtBoxSizing

  get sizing(): ExtBoxSizing {
    return this._sizing
  }

  set_sizing(sizing: Partial<BoxSizing>): void {
    const width_policy = sizing.width_policy || "fit"
    const width = sizing.width
    const min_width = sizing.min_width != null ? sizing.min_width : 0
    const max_width = sizing.max_width != null ? sizing.max_width : Infinity

    const height_policy = sizing.height_policy || "fit"
    const height = sizing.height
    const min_height = sizing.min_height != null ? sizing.min_height : 0
    const max_height = sizing.max_height != null ? sizing.max_height : Infinity

    const aspect = sizing.aspect
    const margin = sizing.margin || {top: 0, right: 0, bottom: 0, left: 0}
    const visible = sizing.visible !== false
    const halign = sizing.halign || "start"
    const valign = sizing.valign || "start"

    this._sizing = {
      width_policy, min_width, width, max_width,
      height_policy, min_height, height, max_height,
      aspect,
      margin,
      visible,
      halign,
      valign,
      size: {width, height},
      min_size: {width: min_width, height: min_height},
      max_size: {width: max_width, height: max_height},
    }

    this._init()
  }

  protected _init(): void {}

  protected _set_geometry(outer: BBox, inner: BBox): void {
    this._bbox = outer
    this._inner_bbox = inner
  }

  set_geometry(outer: BBox, inner?: BBox): void {
    this._set_geometry(outer, inner || outer)
  }

  is_width_expanding(): boolean {
    return this.sizing.width_policy == "max"
  }

  is_height_expanding(): boolean {
    return this.sizing.height_policy == "max"
  }

  apply_aspect(viewport: Size, {width, height}: Size): Size {
    const {aspect} = this.sizing

    if (aspect != null) {
      const {width_policy, height_policy} = this.sizing

      const gt = (width: SizingPolicy, height: SizingPolicy) => {
        const policies = {max: 4, fit: 3, min: 2, fixed: 1}
        return policies[width] > policies[height]
      }

      if (width_policy != "fixed" && height_policy != "fixed") {
        if (width_policy == height_policy) {
          const w_width = width
          const w_height = round(width / aspect)

          const h_width = round(height * aspect)
          const h_height = height

          const w_diff = Math.abs(viewport.width - w_width) + Math.abs(viewport.height - w_height)
          const h_diff = Math.abs(viewport.width - h_width) + Math.abs(viewport.height - h_height)

          if (w_diff <= h_diff) {
            width = w_width
            height = w_height
          } else {
            width = h_width
            height = h_height
          }
        } else if (gt(width_policy, height_policy)) {
          height = round(width/aspect)
        } else {
          width = round(height*aspect)
        }
      } else if (width_policy == "fixed") {
        height = round(width/aspect)
      } else if (height_policy == "fixed") {
        width = round(height*aspect)
      }
    }

    return {width, height}
  }

  protected abstract _measure(viewport: Sizeable): SizeHint

  measure(viewport_size: Size): SizeHint {
    if (!this.sizing.visible)
      return {width: 0, height: 0}

    const exact_width = (width: number) => {
      return this.sizing.width_policy == "fixed" && this.sizing.width != null ? this.sizing.width : width
    }
    const exact_height = (height: number) => {
      return this.sizing.height_policy == "fixed" && this.sizing.height != null ? this.sizing.height : height
    }

    const viewport = new Sizeable(viewport_size)
      .shrink_by(this.sizing.margin)
      .map(exact_width, exact_height)

    const computed = this._measure(viewport)
    const clipped = this.clip_size(computed)

    const width = exact_width(clipped.width)
    const height = exact_height(clipped.height)

    const size = this.apply_aspect(viewport, {width, height})
    return {...computed, ...size}
  }

  compute(viewport: Partial<Size> = {}): void {
    const size_hint = this.measure({
      width: viewport.width != null && this.is_width_expanding() ? viewport.width : Infinity,
      height: viewport.height != null && this.is_height_expanding() ? viewport.height : Infinity,
    })

    const {width, height} = size_hint
    const outer = new BBox({left: 0, top: 0, width, height})

    let inner: BBox | undefined = undefined

    if (size_hint.inner != null) {
      const {left, top, right, bottom} = size_hint.inner
      inner = new BBox({left, top, right: width - right, bottom: height - bottom})
    }

    this.set_geometry(outer, inner)
  }

  get xview(): CoordinateTransform {
    return this.bbox.xview
  }

  get yview(): CoordinateTransform {
    return this.bbox.yview
  }

  clip_width(width: number): number {
    return max(this.sizing.min_width, min(width, this.sizing.max_width))
  }

  clip_height(height: number): number {
    return max(this.sizing.min_height, min(height, this.sizing.max_height))
  }

  clip_size({width, height}: Size): Size {
    return {
      width: this.clip_width(width),
      height: this.clip_height(height),
    }
  }
}

export class LayoutItem extends Layoutable {
  /*
  constructor(readonly measure_fn: (viewport: Size) => Size) {
    super()
  }
  protected _measure(viewport: Size): SizeHint {
    return this.measure_fn(viewport)
  }
  protected _measure(viewport: Size): SizeHint {
    return {
      width: viewport.width != Infinity ? viewport.width : this.sizing.min_width,
      height: viewport.height != Infinity ? viewport.height : this.sizing.min_width,
    }
  }
  */

  protected _measure(viewport: Size): SizeHint {
    const {width_policy, height_policy} = this.sizing

    let width: number
    if (viewport.width == Infinity) {
      width = this.sizing.width != null ? this.sizing.width : 0
    } else {
      switch (width_policy) {
        case "fixed": {
          width = this.sizing.width != null ? this.sizing.width : 0
          break
        }
        case "min": {
          width = this.sizing.width != null ? min(viewport.width, this.sizing.width) : 0
          break
        }
        case "fit": {
          width = this.sizing.width != null ? min(viewport.width, this.sizing.width) : viewport.width
          break
        }
        case "max": {
          width = this.sizing.width != null ? max(viewport.width, this.sizing.width) : viewport.width
          break
        }
      }
    }

    let height: number
    if (viewport.height == Infinity) {
      height = this.sizing.height != null ? this.sizing.height : 0
    } else {
      switch (height_policy) {
        case "fixed": {
          height = this.sizing.height != null ? this.sizing.height : 0
          break
        }
        case "min": {
          height = this.sizing.height != null ? min(viewport.height, this.sizing.height) : 0
          break
        }
        case "fit": {
          height = this.sizing.height != null ? min(viewport.height, this.sizing.height) : viewport.height
          break
        }
        case "max": {
          height = this.sizing.height != null ? max(viewport.height, this.sizing.height) : viewport.height
          break
        }
      }
    }

    return {width, height}
  }
}

export abstract class ContentLayoutable extends Layoutable {

  /*
  protected _min_size(): SizeHint {
    return content_size.expanded_to(this.sizing.min_size)
    .map(...) // apply fixed size (?)
  }

  protected _max_size(): SizeHint {
    return this.sizing.max_size
  }
  */

  protected abstract _content_size(): Sizeable

  protected _measure(viewport: Sizeable): SizeHint {
    const content_size = this._content_size()

    const bounds = viewport
      .bounded_to(this.sizing.size)
      .bounded_to(content_size)

    const width = (() => {
      switch (this.sizing.width_policy) {
        case "fixed":
          return this.sizing.width != null ? this.sizing.width : content_size.width
        case "min":
          return content_size.width
        case "fit":
          return bounds.width
        case "max":
          return Math.max(content_size.width, bounds.width)
      }
    })()

    const height = (() => {
      switch (this.sizing.height_policy) {
        case "fixed":
          return this.sizing.height != null ? this.sizing.height : content_size.height
        case "min":
          return content_size.height
        case "fit":
          return bounds.height
        case "max":
          return Math.max(content_size.height, bounds.height)
      }
    })()

    return {width, height}
  }
}
