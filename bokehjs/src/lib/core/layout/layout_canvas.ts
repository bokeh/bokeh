import {Variable, ComputedVariable} from "./index"
import {Arrayable} from "../types"
import {BBox} from "../util/bbox"
import {SizeHint} from "./index"

export interface ViewTransform {
  compute: (v: number) => number
  v_compute: (vv: Arrayable<number>) => Arrayable<number>
}

export abstract class LayoutCanvas {

  _top: Variable
  _left: Variable
  _width: Variable
  _height: Variable
  _right: Variable
  _bottom: Variable

  _hcenter: ComputedVariable
  _vcenter: ComputedVariable

  constructor() {
    this._top = {value: 0}
    this._left = {value: 0}
    this._width = {value: 0}
    this._height = {value: 0}
    this._right = {value: 0}
    this._bottom = {value: 0}

    const layout = this
    this._hcenter = {
      get value(): number {
        return (layout._left.value + layout._right.value)/2
      },
    }
    this._vcenter = {
      get value(): number {
        return (layout._top.value + layout._bottom.value)/2
      },
    }
  }

  abstract size_hint(): SizeHint

  _set_geometry(outer: BBox, _inner: BBox): void {
    this._left.value = outer.left
    this._top.value = outer.top
    this._right.value = outer.right
    this._bottom.value = outer.bottom
    this._width.value = outer.width
    this._height.value = outer.height
  }

  set_geometry(outer: BBox, inner?: BBox): void {
    this._set_geometry(outer, inner || outer)
  }

  get_layoutable_children(): any[] {
    return []
  }

  get bbox(): BBox {
    return new BBox({
      x0: this._left.value,  y0: this._top.value,
      x1: this._right.value, y1: this._bottom.value,
    })
  }

  get layout_bbox(): {[key: string]: number} {
    return {
      top: this._top.value,
      left: this._left.value,
      width: this._width.value,
      height: this._height.value,
      right: this._right.value,
      bottom: this._bottom.value,
    }
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
LayoutCanvas.initClass()

export abstract class LayoutItem extends LayoutCanvas {}
