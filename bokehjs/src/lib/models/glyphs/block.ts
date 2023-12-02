import {LRTB, LRTBView} from "./lrtb"
import type {LRTBRect} from "./lrtb"
import {minmax} from "core/util/math"
import {ScreenArray} from "core/types"
import * as p from "core/properties"

export interface BlockView extends Block.Data {}

export class BlockView extends LRTBView {
  declare model: Block
  declare visuals: Block.Visuals

  scenterxy(i: number): [number, number] {
    const scx = this.sleft[i]/2 + this.sright[i]/2
    const scy = this.stop[i]/2 + this.sbottom[i]/2
    return [scx, scy]
  }

  protected _lrtb(i: number): LRTBRect {
    const x_i = this.x[i]
    const y_i = this.y[i]
    const width_i = this.width.get(i)
    const height_i = this.height.get(i)

    const [l, r] = minmax(x_i, x_i + width_i)
    const [b, t] = minmax(y_i, y_i + height_i)

    return {l, r, t, b}
  }

  protected override _map_data(): void {
    const {sx, sy} = this
    const n = sx.length

    if (this.inherited_x && this.inherited_width) {
      this._inherit_attr<Block.Data>("sleft")
      this._inherit_attr<Block.Data>("sright")
    } else {
      const sw = this.sdist(this.renderer.xscale, this.x, this.width, "edge")

      const sleft = new ScreenArray(n)
      const sright = new ScreenArray(n)

      for (let i = 0; i < n; i++) {
        sleft[i] = sx[i]
        sright[i] = sx[i] + sw[i]
      }

      this._define_attr<Block.Data>("sleft", sleft)
      this._define_attr<Block.Data>("sright", sright)
    }

    if (this.inherited_y && this.inherited_height) {
      this._inherit_attr<Block.Data>("stop")
      this._inherit_attr<Block.Data>("sbottom")
    } else {
      const sh = this.sdist(this.renderer.yscale, this.y, this.height, "edge")

      const stop = new ScreenArray(n)
      const sbottom = new ScreenArray(n)

      for (let i = 0; i < n; i++) {
        stop[i] = sy[i] - sh[i]
        sbottom[i] = sy[i]
      }

      this._define_attr<Block.Data>("stop", stop)
      this._define_attr<Block.Data>("sbottom", sbottom)
    }

    this._clamp_to_viewport()
  }
}

export namespace Block {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LRTB.Props & {
    x: p.CoordinateSpec
    y: p.CoordinateSpec
    width: p.DistanceSpec
    height: p.DistanceSpec
  }

  export type Visuals = LRTB.Visuals

  export type Data = LRTB.Data & p.GlyphDataOf<Props> & {
    readonly max_width: number
  }
}

export interface Block extends Block.Attrs {}

export class Block extends LRTB {
  declare properties: Block.Props
  declare __view_type__: BlockView

  constructor(attrs?: Partial<Block.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BlockView

    this.define<Block.Props>(({}) => ({
      x:      [ p.XCoordinateSpec, {field: "x"} ],
      y:      [ p.YCoordinateSpec, {field: "y"} ],
      width:  [ p.DistanceSpec,    {value: 1}   ],
      height: [ p.DistanceSpec,    {value: 1}   ],
    }))
  }
}
