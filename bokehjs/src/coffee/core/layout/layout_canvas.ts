import {GE, EQ, Variable, Constraint} from "./solver"
import {HasProps} from "../has_props"
import {BBox} from "../util/bbox"

export class LayoutCanvas extends HasProps {

  _top: Variable
  _left: Variable
  _width: Variable
  _height: Variable
  _right: Variable
  _bottom: Variable
  _hcenter: Variable
  _vcenter: Variable

  initialize(attrs: any, options?: any) {
    super.initialize(attrs, options)
    this._top = new Variable(`${this.toString()}.top`)
    this._left = new Variable(`${this.toString()}.left`)
    this._width = new Variable(`${this.toString()}.width`)
    this._height = new Variable(`${this.toString()}.height`)
    this._right = new Variable(`${this.toString()}.right`)
    this._bottom = new Variable(`${this.toString()}.bottom`)
    this._hcenter = new Variable(`${this.toString()}.hcenter`)
    this._vcenter = new Variable(`${this.toString()}.vcenter`)
  }

  get_editables(): Variable[] {
    return []
  }

  get_constraints(): Constraint[] {
    return [
      GE(this._top),
      GE(this._bottom),
      GE(this._left),
      GE(this._right),
      GE(this._width),
      GE(this._height),
      EQ(this._left, this._width, [-1, this._right]),
      EQ(this._top, this._height, [-1, this._bottom]),
      EQ([2, this._hcenter], [-1, this._left], [-1, this._right]),
      EQ([2, this._vcenter], [-1, this._top], [-1, this._bottom]),
    ]
  }

  get bbox(): BBox {
    return new BBox({
      x0: this._left.value,  y0: this._top.value,
      x1: this._right.value, y1: this._bottom.value,
    })
  }

  get layout_bbox() {
    return {
      top: this._top.value,
      left: this._left.value,
      width: this._width.value,
      height: this._height.value,
      right: this._right.value,
      bottom: this._bottom.value,
      hcenter: this._hcenter.value,
      vcenter: this._vcenter.value,
    }
  }

  // relative view <-> relative screen
  vx_to_sx(x: number): number { return x }
  vy_to_sy(y: number): number { return this._height.value - y }

  sx_to_vx(x: number): number { return x }
  sy_to_vy(y: number): number { return this._height.value - y }

  v_vx_to_sx(xx: number[] | Float64Array): Float64Array {
    return new Float64Array(xx)
  }
  v_vy_to_sy(yy: number[] | Float64Array): Float64Array {
    const _yy = new Float64Array(yy.length)
    const height = this._height.value
    for (let i = 0; i < yy.length; i++) {
      _yy[i] = height - yy[i]
    }
    return _yy
  }

  v_sx_to_vx(xx: number[] | Float64Array): Float64Array {
    return new Float64Array(xx)
  }
  v_sy_to_vy(yy: number[] | Float64Array): Float64Array {
    const _yy = new Float64Array(yy.length)
    const height = this._height.value
    for (let i = 0; i < yy.length; i++) {
      _yy[i] = height - yy[i]
    }
    return _yy
  }

  // relative view -> absolute screen
  vx_to_Sx(x: number): number { return this._left.value + x }
  vy_to_Sy(y: number): number { return this._bottom.value - y }

  v_vx_to_Sx(xx: number[] | Float64Array): Float64Array {
    const _xx = new Float64Array(xx.length)
    const left = this._left.value
    for (let i = 0; i < xx.length; i++) {
      _xx[i] = left + xx[i]
    }
    return _xx
  }
  v_vy_to_Sy(yy: number[] | Float64Array): Float64Array {
    const _yy = new Float64Array(yy.length)
    const bottom = this._bottom.value
    for (let i = 0; i < yy.length; i++) {
      _yy[i] = bottom - yy[i]
    }
    return _yy
  }
}
LayoutCanvas.prototype.type = "LayoutCanvas"
