import {GE, EQ, Variable, ComputedVariable, Constraint} from "./solver"
import {HasProps} from "../has_props"
import {Arrayable} from "../types"
import {BBox} from "../util/bbox"

export interface ViewTransform {
  compute: (v: number) => number
  v_compute: (vv: Arrayable<number>) => Arrayable<number>
}

export namespace LayoutCanvas {
  export interface Attrs extends HasProps.Attrs {}

  export interface Props extends HasProps.Props {}
}

export interface LayoutCanvas extends LayoutCanvas.Attrs {}

export abstract class LayoutCanvas extends HasProps {

  properties: LayoutCanvas.Props

  constructor(attrs?: Partial<LayoutCanvas.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = "LayoutCanvas"
  }

  _top: Variable
  _left: Variable
  _width: Variable
  _height: Variable
  _right: Variable
  _bottom: Variable

  _hcenter: ComputedVariable
  _vcenter: ComputedVariable

  initialize(): void {
    super.initialize()

    this._top = new Variable(`${this.toString()}.top`)
    this._left = new Variable(`${this.toString()}.left`)
    this._width = new Variable(`${this.toString()}.width`)
    this._height = new Variable(`${this.toString()}.height`)
    this._right = new Variable(`${this.toString()}.right`)
    this._bottom = new Variable(`${this.toString()}.bottom`)

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
    ]
  }

  get_layoutable_children(): LayoutCanvas[] {
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
