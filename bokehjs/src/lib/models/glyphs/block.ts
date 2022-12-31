import {LRTB, LRTBView, LRTBData} from "./lrtb"
import {FloatArray, ScreenArray} from "core/types"
import * as p from "core/properties"

export type BlockData = LRTBData & {
  _x: FloatArray
  _y: FloatArray
  readonly width: p.Uniform<number>
  readonly height: p.Uniform<number>

  stop: ScreenArray
  sbottom: ScreenArray
  sleft: ScreenArray
  sright: ScreenArray

  readonly max_width: number
}

export interface BlockView extends BlockData {}

export class BlockView extends LRTBView {
  declare model: Block
  declare visuals: Block.Visuals

  scenterxy(i: number): [number, number] {
    const scx = this.sleft[i]/2 + this.sright[i]/2
    const scy = this.stop[i]/2 + this.sbottom[i]/2
    return [scx, scy]
  }

  protected _lrtb(i: number): [number, number, number, number] {
    const x_i = this._x[i]
    const y_i = this._y[i]
    const width_i = this.width.get(i)
    const height_i = this.height.get(i)

    const l = Math.min(x_i, x_i + width_i)
    const r = Math.max(x_i, x_i + width_i)
    const t = Math.max(y_i, y_i + height_i)
    const b = Math.min(y_i, y_i + height_i)

    return [l, r, t, b]
  }

  protected override _map_data(): void {
    const sx = this.renderer.xscale.v_compute(this._x)
    const sy = this.renderer.yscale.v_compute(this._y)
    const sw = this.sdist(this.renderer.xscale, this._x, this.width, "edge")
    const sh = this.sdist(this.renderer.yscale, this._y, this.height, "edge")

    const n = sx.length

    this.stop = new ScreenArray(n)
    this.sbottom = new ScreenArray(n)
    this.sleft = new ScreenArray(n)
    this.sright = new ScreenArray(n)
    for (let i = 0; i < n; i++) {
      this.stop[i] = sy[i] - sh[i]
      this.sbottom[i] = sy[i]
      this.sleft[i] = sx[i]
      this.sright[i] = sx[i] + sw[i]
    }

    this._clamp_viewport()
  }
}

export namespace Block {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LRTB.Props & {
    x: p.CoordinateSpec
    y: p.CoordinateSpec
    width: p.NumberSpec
    height: p.NumberSpec
  }

  export type Visuals = LRTB.Visuals
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
      width:  [ p.NumberSpec,      {value: 1}   ],
      height: [ p.NumberSpec,      {value: 1}   ],
    }))
  }
}
