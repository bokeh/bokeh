import {BBox, CoordinateTransform} from "../util/bbox"

export type Size = {
  width: number
  height: number
}

export type Margin = {
  left: number
  top: number
  right: number
  bottom: number
}

export type SizingPolicy = "fixed" | "min" | "max" | "auto"

export type SizeHint = Size & {
  inner?: Margin
}

export type Sizing = number | "min" | "max"

export type WidthSizing =
  {width_policy: "fixed", width: number} |
  {width_policy: "auto", width?: number | null} |
  {width_policy: "min" | "max"}

export type HeightSizing =
  {height_policy: "fixed", height: number} |
  {height_policy: "auto", height?: number | null} |
  {height_policy: "min" | "max"}

export type BoxSizing = WidthSizing & HeightSizing & {aspect?: number}

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

  sizing: BoxSizing

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

  compute(viewport: {width: number | null, height: number | null}): void {
    const size_hint = this.size_hint()

    let width: number
    let height: number

    switch (this.sizing.width_policy) {
      case "fixed":
        width = this.sizing.width
        break
      case "max":
        if (viewport.width != null)
          width = Math.max(viewport.width, size_hint.width)
        else
          throw new Error("'max' sizing policy requires viewport width to be specified")
        break
      case "min":
        width = size_hint.width
        break
      case "auto":
        if (this.sizing.width != null)
          width = this.sizing.width
        else
          width = size_hint.width
        break
      default:
        throw new Error("unrechable")
    }

    switch (this.sizing.height_policy) {
      case "fixed":
        height = this.sizing.height
        break
      case "max":
        if (viewport.height != null)
          height = Math.max(viewport.height, size_hint.height)
        else
          throw new Error("'max' sizing policy requires viewport height to be specified")
        break
      case "min":
        height = size_hint.height
        break
      case "auto":
        if (this.sizing.height != null)
          height = this.sizing.height
        else
          height = size_hint.height
        break
      default:
        throw new Error("unrechable")
    }

    const {width_policy, height_policy} = this.sizing

    if ((this.sizing.width_policy == "max" || this.sizing.width_policy == "min") &&
        (this.sizing.height_policy == "max" || this.sizing.height_policy == "min")) {
      const {aspect} = this.sizing
      if (aspect != null) {
        if (width_policy != height_policy) {
          if (width_policy == "max") {
            height = width/aspect
            if (height < size_hint.height) console.log("H")
          } else {
            width = height*aspect
            if (width < size_hint.width) console.log("W")
          }
        }
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
}

export class LayoutItem extends Layoutable {
  size_hint(): SizeHint {
    let width: number
    if (this.sizing.width_policy == "fixed")
      width = this.sizing.width
    else if (this.sizing.width_policy == "auto" && this.sizing.width != null)
      width = this.sizing.width
    else
      width = 0

    let height: number
    if (this.sizing.height_policy == "fixed")
      height = this.sizing.height
    else if (this.sizing.height_policy == "auto" && this.sizing.height != null)
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

    this.sizing = {
      width_policy: "fixed", width,
      height_policy: "fixed", height,
    }
  }
}
