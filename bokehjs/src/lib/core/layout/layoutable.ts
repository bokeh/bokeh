import {Size, Sizeable, SizeHint, BoxSizing} from "./types"
import {BBox, CoordinateTransform} from "../util/bbox"

const {min, max} = Math

export interface ComputedVariable {
  readonly value: number
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

    this._init()
  }

  protected _init(): void {}

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

      if (width_policy != "fixed" && height_policy != "fixed") {
        const w_width = width
        const w_height = width / aspect

        const h_width = height * aspect
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
      } else if (width_policy != "fixed")
        height = width/aspect
      else if (height_policy != "fixed")
        width = height*aspect
      else
        throw new Error("unrechable")
    }

    return {width, height}
  }

  protected abstract _measure(viewport: Size): SizeHint

  measure(viewport: Size): SizeHint {
    //const {width_policy, height_policy, margin} = this.sizing
    viewport = new Sizeable(viewport).shrink_by(this.sizing.margin)

    //if (this.is_width_expanding())
    /*
    let width: number
    if (viewport.width == Infinity) {
      width = this.sizing.width != null ? this.sizing.width : computed.width
    } else {
      if (width_policy == "fixed")
        width = this.sizing.width != null ? this.sizing.width : computed.width
      else if (width_policy == "min")
      else if (width_policy == "fit")
      else if (width_policy == "max")
    }


    const clipped = this.clip_size(shrunk)
    if (width_policy == "fixed" && this.sizing.width != null)
      clipped.width = this.sizing.width
    if (height_policy == "fixed" && this.sizing.height != null)
      clipped.height = this.sizing.height

    const computed = this._measure(clipped)
    */

    const computed = this._measure(viewport)
    const {width, height} = this.clip_size(computed)

    /*
    let width: number
    if (width_policy == "fixed")
      width = this.sizing.width != null ? this.sizing.width : computed.width
    else
      width = computed.width

    let height: number
    if (height_policy == "fixed")
      height = this.sizing.height != null ? this.sizing.height : computed.height
    else
      height = computed.height
    */

    const size = this.apply_aspect(viewport, {width, height})
    return {...size, inner: computed.inner}
  }

  compute(viewport?: Partial<Size>): void {
    const size_hint = this.measure({
      width: viewport != null && viewport.width != null ? viewport.width : Infinity,
      height: viewport != null && viewport.height != null ? viewport.height : Infinity,
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
      if (width_policy == "fixed")
        width = this.sizing.width != null ? this.sizing.width : 0
      else if (width_policy == "min")
        width = this.sizing.width != null ? min(viewport.width, this.sizing.width) : 0
      else if (width_policy == "fit")
        width = this.sizing.width != null ? min(viewport.width, this.sizing.width) : viewport.width
      else if (width_policy == "max")
        width = this.sizing.width != null ? max(viewport.width, this.sizing.width) : viewport.width
      else
        throw new Error("unrechable")
    }

    let height: number
    if (viewport.height == Infinity) {
      height = this.sizing.height != null ? this.sizing.height : 0
    } else {
      if (height_policy == "fixed")
        height = this.sizing.height != null ? this.sizing.height : 0
      else if (height_policy == "min")
        height = this.sizing.height != null ? min(viewport.height, this.sizing.height) : 0
      else if (height_policy == "fit")
        height = this.sizing.height != null ? min(viewport.height, this.sizing.height) : viewport.height
      else if (height_policy == "max")
        height = this.sizing.height != null ? max(viewport.height, this.sizing.height) : viewport.height
      else
        throw new Error("unrechable")
    }

    return {width, height}
  }
}
