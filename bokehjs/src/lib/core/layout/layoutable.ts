import {BBox, CoordinateTransform} from "../util/bbox"

export type Size = {
  width: number
  height: number
}

export type MinSize = {
  min_width: number
  min_height: number
}

export type MaxSize = {
  max_width: number
  max_height: number
}

export type Margin = {
  left: number
  top: number
  right: number
  bottom: number
}

export type SizingPolicy = "fixed" | "fit" | "min" | "max"

export type SizeHint = Size /*& MinSize & MaxSize*/ & {
  inner?: Margin
  width_expanding?: boolean
  height_expanding?: boolean
}

export type Sizing = number | "fit" | "min" | "max"

export type BoxSizing = {
  width_policy: "fixed" | "fit" | "min" | "max"
  min_width: number
  width?: number
  max_width: number

  height_policy: "fixed" | "fit" | "min" | "max"
  min_height: number
  height?: number
  max_height: number

  aspect?: number
  margin: Margin
}

export interface ComputedVariable {
  readonly value: number
}

export abstract class Layoutable {

  protected _bbox: BBox = new BBox({left: 0, top: 0, width: 0, height: 0})

  get bbox(): BBox {
    return this._bbox
  }

  _top: ComputedVariable
  _left: ComputedVariable
  _width: ComputedVariable
  _height: ComputedVariable
  _right: ComputedVariable
  _bottom: ComputedVariable
  _hcenter: ComputedVariable
  _vcenter: ComputedVariable

  private _sizing: BoxSizing

  get sizing(): BoxSizing {
    return this._sizing
  }

  set_sizing(sizing: Partial<BoxSizing>): void {
    const {width_policy, height_policy,
           min_width, max_width, width,
           min_height, max_height, height,
           aspect, margin} = sizing

    this._sizing = {
      width_policy: width_policy || "fit",
      min_width: min_width != null ? min_width : 0,
      width,
      max_width: max_width != null ? max_width : Infinity,

      height_policy: height_policy || "fit",
      min_height: min_height != null ? min_height : 0,
      height,
      max_height: max_height != null ? max_height : Infinity,

      aspect,
      margin: margin != null ? margin : {top: 0, right: 0, bottom: 0, left: 0},
    }
  }

  constructor() {
    const layout = this

    this._top     = { get value(): number { return layout.bbox.top     } }
    this._left    = { get value(): number { return layout.bbox.left    } }
    this._width   = { get value(): number { return layout.bbox.width   } }
    this._height  = { get value(): number { return layout.bbox.height  } }
    this._right   = { get value(): number { return layout.bbox.right   } }
    this._bottom  = { get value(): number { return layout.bbox.bottom  } }
    this._hcenter = { get value(): number { return layout.bbox.hcenter } }
    this._vcenter = { get value(): number { return layout.bbox.vcenter } }
  }

  abstract size_hint(): SizeHint

  protected _set_geometry(outer: BBox, _inner: BBox): void {
    this._bbox = outer
  }

  set_geometry(outer: BBox, inner?: BBox): void {
    this._set_geometry(outer, inner || outer)
  }

  /*
  has_hfw(): boolean {
    return false
  }

  hfw(_width: number): number {
    return 0
  }

  wfh(_height: number): number {
    return 0
  }
  */

  has_hfw(): boolean {
    return (this.sizing.width_policy != "fixed" || this.sizing.height_policy != "fixed") && this.sizing.aspect != null
  }

  hfw(width: number): number {
    const {aspect} = this.sizing
    return width/aspect!
  }

  wfh(height: number): number {
    const {aspect} = this.sizing
    return height*aspect!
  }

  compute(viewport: {width: number | null, height: number | null}): void {
    const size_hint = this.size_hint()

    let width: number
    let height: number

    switch (this.sizing.width_policy) {
      case "fixed":
        width = this.sizing.width != null ? this.sizing.width : size_hint.width
        break
      case "fit":
        width = viewport.width != null ? viewport.width : size_hint.width
        break
      case "max":
        if (viewport.width != null)
          width = Math.max(viewport.width, size_hint.width)
        else
          throw new Error("'max' sizing policy requires viewport width to be specified")
        break
      case "min":
        if (size_hint.width_expanding === true && viewport.width != null)
          width = Math.max(viewport.width, size_hint.width)
        else
          width = size_hint.width
        break
      default:
        throw new Error("unrechable")
    }

    switch (this.sizing.height_policy) {
      case "fixed":
        height = this.sizing.height != null ? this.sizing.height : size_hint.height
        break
      case "fit":
        height = viewport.height != null ? viewport.height : size_hint.height
        break
      case "max":
        if (viewport.height != null)
          height = Math.max(viewport.height, size_hint.height)
        else
          throw new Error("'max' sizing policy requires viewport height to be specified")
        break
      case "min":
        if (size_hint.height_expanding === true && viewport.height != null)
          height = Math.max(viewport.height, size_hint.height)
        else
          height = size_hint.height
        break
      default:
        throw new Error("unrechable")
    }

    const {width_policy, height_policy, aspect} = this.sizing

    if (aspect != null) {
      if (width_policy == "max" && height_policy == "max") {
        const w_width = width
        const w_height = width / aspect

        const h_width = height * aspect
        const h_height = height

        const {abs} = Math
        const w_diff = abs(viewport.width! - w_width) + abs(viewport.height! - w_height)
        const h_diff = abs(viewport.width! - h_width) + abs(viewport.height! - h_height)

        if (w_diff < h_diff) {
          width = w_width
          height = w_height
        } else {
          width = h_width
          height = h_height
        }
      } else if (width_policy == "max") {
        if (height_policy == "fixed")
          width = height*aspect
        else
          height = width/aspect
      } else if (height_policy != "max") {
        if (width_policy == "fixed")
          height = width/aspect
        else
          width = height*aspect
      }
    }

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
    if (this.sizing.min_width != null)
      width = Math.max(this.sizing.min_width, width)
    if (this.sizing.max_width != null)
      width = Math.min(this.sizing.max_width, width)
    return width
  }

  clip_height(height: number): number {
    if (this.sizing.min_height != null)
      height = Math.max(this.sizing.min_height, height)
    if (this.sizing.max_height != null)
      height = Math.min(this.sizing.max_height, height)
    return height
  }

  clip_size({width, height}: Size): Size {
    return {
      width: this.clip_width(width),
      height: this.clip_height(height),
    }
  }
}

export class LayoutItem extends Layoutable {
  size_hint(): SizeHint {
    let width: number
    if (this.sizing.width_policy == "fixed" && this.sizing.width != null)
      width = this.sizing.width
    else
      width = 0

    let height: number
    if (this.sizing.height_policy == "fixed" && this.sizing.height != null)
      height = this.sizing.height
    else
      height = 0

    return {width, height}
  }
}

export class FixedLayout extends LayoutItem {
  readonly sizing: BoxSizing

  constructor(width: number, height: number) {
    super()

    this.set_sizing({
      width_policy: "fixed", width,
      height_policy: "fixed", height,
    })
  }
}
