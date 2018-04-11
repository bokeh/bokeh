import {Box, BoxView, BoxData} from "./box"
import {Arrayable} from "core/types"
import {NumberSpec} from "core/vectorization"
import {Anchor} from "core/enums"
import {SpatialIndex} from "core/util/spatial"

export interface QuadData extends BoxData {
  _right: Arrayable<number>
  _bottom: Arrayable<number>
  _left: Arrayable<number>
  _top: Arrayable<number>

  sright: Arrayable<number>
  sbottom: Arrayable<number>
  sleft: Arrayable<number>
  stop: Arrayable<number>
}

export interface QuadView extends QuadData {}

export class QuadView extends BoxView {
  model: Quad
  visuals: Quad.Visuals

  get_anchor_point(anchor: Anchor, i: number, _spt: [number, number]): {x: number, y: number} | null {
    const left = Math.min(this.sleft[i], this.sright[i])
    const right = Math.max(this.sright[i], this.sleft[i])
    const top = Math.min(this.stop[i], this.sbottom[i])     // screen coordinates !!!
    const bottom = Math.max(this.sbottom[i], this.stop[i])  //

    switch (anchor) {
      case "top_left":      return {x: left,             y: top             }
      case "top_center":    return {x: (left + right)/2, y: top             }
      case "top_right":     return {x: right,            y: top             }
      case "center_right":  return {x: right,            y: (top + bottom)/2}
      case "bottom_right":  return {x: right,            y: bottom          }
      case "bottom_center": return {x: (left + right)/2, y: bottom          }
      case "bottom_left":   return {x: left,             y: bottom          }
      case "center_left":   return {x: left,             y: (top + bottom)/2}
      case "center":        return {x: (left + right)/2, y: (top + bottom)/2}
      default:              return null
    }
  }

  scenterx(i: number): number {
    return (this.sleft[i] + this.sright[i])/2
  }

  scentery(i: number): number {
    return (this.stop[i] + this.sbottom[i])/2
  }

  protected _index_data(): SpatialIndex {
    return this._index_box(this._right.length)
  }

  protected _lrtb(i: number): [number, number, number, number] {
    const l = this._left[i]
    const r = this._right[i]
    const t = this._top[i]
    const b = this._bottom[i]
    return [l, r, t, b]
  }
}

export namespace Quad {
  export interface Attrs extends Box.Attrs {
    right: NumberSpec
    bottom: NumberSpec
    left: NumberSpec
    top: NumberSpec
  }

  export interface Props extends Box.Props {}

  export interface Visuals extends Box.Visuals {}
}

export interface Quad extends Quad.Attrs {}

export class Quad extends Box {

  properties: Quad.Props

  constructor(attrs?: Partial<Quad.Attrs>) {
    super(attrs)
  }

  static initClass(): void {
    this.prototype.type = 'Quad'
    this.prototype.default_view = QuadView

    this.coords([['right', 'bottom'], ['left', 'top']])
  }
}
Quad.initClass()
