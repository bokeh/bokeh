import type {ReglWrapper} from "./regl_wrap"
import {SXSYGlyphGL} from "./sxsy"
import type {GLMarkerType} from "./types"
import type {HexTileView} from "../hex_tile"

export class HexTileGL extends SXSYGlyphGL {
  constructor(regl_wrapper: ReglWrapper, override readonly glyph: HexTileView) {
    super(regl_wrapper, glyph)
  }

  get marker_type(): GLMarkerType {
    return "hex_tile"
  }

  protected override _set_data(): void {
    super._set_data()

    let width: number
    let height: number
    if (this.glyph.model.orientation == "pointytop") {
      this._angles.set_from_scalar(0.5*Math.PI)
      width = this.glyph.svy[0]*2
      height = this.glyph.svx[4]*4/Math.sqrt(3)
    } else {
      this._angles.set_from_scalar(0)
      width = this.glyph.svx[0]*2
      height = this.glyph.svy[4]*4/Math.sqrt(3)
    }

    const {scale} = this.glyph
    if (scale.is_Scalar()) {
      const scale_i = scale.get(0)
      this._widths.set_from_scalar(width*scale_i)
      this._heights.set_from_scalar(height*scale_i)
    } else {
      const n = this.nvertices
      const widths = this._widths.get_sized_array(n)
      const heights = this._heights.get_sized_array(n)
      for (let i = 0; i < n; i++) {
        const scale_i = scale.get(i)
        widths[i] = width*scale_i
        heights[i] = height*scale_i
      }
      this._widths.update()
      this._heights.update()
    }
  }

  protected override _set_once(): void {
    super._set_once()
    this._auxs.set_from_scalar(0)
  }
}
