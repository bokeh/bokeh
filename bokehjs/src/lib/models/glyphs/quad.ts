import {LRTB, LRTBView} from "./lrtb"
import type {LRTBRect} from "./lrtb"
import * as p from "core/properties"

export interface QuadView extends Quad.Data {}

export class QuadView extends LRTBView {
  declare model: Quad
  declare visuals: Quad.Visuals

  scenterxy(i: number): [number, number] {
    const scx = this.sleft[i]/2 + this.sright[i]/2
    const scy = this.stop[i]/2 + this.sbottom[i]/2
    return [scx, scy]
  }

  protected _lrtb(i: number): LRTBRect {
    const l = this.left[i]
    const r = this.right[i]
    const t = this.top[i]
    const b = this.bottom[i]
    return {l, r, t, b}
  }
}

export namespace Quad {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LRTB.Props & {
    right: p.CoordinateSpec
    bottom: p.CoordinateSpec
    left: p.CoordinateSpec
    top: p.CoordinateSpec
  }

  export type Visuals = LRTB.Visuals

  export type Data = LRTB.Data & p.GlyphDataOf<Props>
}

export interface Quad extends Quad.Attrs {}

export class Quad extends LRTB {
  declare properties: Quad.Props
  declare __view_type__: QuadView

  constructor(attrs?: Partial<Quad.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = QuadView

    this.define<Quad.Props>(({}) => ({
      right:  [ p.XCoordinateSpec, {field: "right"} ],
      bottom: [ p.YCoordinateSpec, {field: "bottom"} ],
      left:   [ p.XCoordinateSpec, {field: "left"} ],
      top:    [ p.YCoordinateSpec, {field: "top"} ],
    }))
  }
}
