import {BBox} from "../util/bbox"
import {Arrayable} from "../types"

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

export type SizeHint = Size & {inner?: Margin}

export interface ComputedVariable {
  readonly value: number
}

export interface ViewTransform {
  compute: (v: number) => number
  v_compute: (vv: Arrayable<number>) => Arrayable<number>
}

export abstract class Layoutable {

  protected _bbox: BBox

  get bbox(): BBox {
    const {_bbox} = this
    if (_bbox != null)
      return _bbox
    else
      throw new Error("layout wasn't computed yet")
  }

  _top: ComputedVariable
  _left: ComputedVariable
  _width: ComputedVariable
  _height: ComputedVariable
  _right: ComputedVariable
  _bottom: ComputedVariable
  _hcenter: ComputedVariable
  _vcenter: ComputedVariable

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

  get xview(): ViewTransform {
    return {
      compute: (x: number): number => {
        return this._left.value + x
      },
      v_compute: (xx: Arrayable<number>): Arrayable<number> => {
        const _xx = new Float64Array(xx.length)
        const left = this._left.value
        for (let i = 0; i < xx.length; i++) {
          _xx[i] = left + xx[i]
        }
        return _xx
      },
    }
  }

  get yview(): ViewTransform {
    return {
      compute: (y: number): number => {
        return this._bottom.value - y
      },
      v_compute: (yy: Arrayable<number>): Arrayable<number> => {
        const _yy = new Float64Array(yy.length)
        const bottom = this._bottom.value
        for (let i = 0; i < yy.length; i++) {
          _yy[i] = bottom - yy[i]
        }
        return _yy
      },
    }
  }
}
